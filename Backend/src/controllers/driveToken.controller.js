const driveTokenModel = require('../models/driveToken.model.js');
const userModel = require('../models/user.model.js');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');

// ── Per-label .env config (client id/secret only) ──
const ENV_CONFIG = {
    LOST: { clientId: () => process.env.GOOGLE_CLIENT_ID, clientSecret: () => process.env.GOOGLE_CLIENT_SECRET },
    EE:   { clientId: () => process.env.GOOGLE_CLIENT_ID_EE, clientSecret: () => process.env.GOOGLE_CLIENT_SECRET_EE },
    ME:   { clientId: () => process.env.GOOGLE_CLIENT_ID_ME, clientSecret: () => process.env.GOOGLE_CLIENT_SECRET_ME },
    CE:   { clientId: () => process.env.GOOGLE_CLIENT_ID_CE, clientSecret: () => process.env.GOOGLE_CLIENT_SECRET_CE }
};

// The redirect URI must match what's registered in Google Cloud Console
const REDIRECT_URI = process.env.NODE_ENV === 'production'
    ? `${process.env.BACKEND_URL}/api/drive-tokens/oauth-callback`
    : 'http://localhost:3000/api/drive-tokens/oauth-callback';
    
// ── Helper: get admin user from token ──
async function getUserFromToken(req) {
    let token = req.cookies?.token;
    if (!token) {
        const auth = req.headers.authorization;
        if (auth && auth.startsWith('Bearer ')) token = auth.split(' ')[1];
    }
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return await userModel.findById(decoded.id);
    } catch { return null; }
}

// ── Helper: test if a refresh token is alive ──
async function testRefreshToken(label, refreshToken) {
    try {
        const cfg = ENV_CONFIG[label];
        const oauth2Client = new google.auth.OAuth2(cfg.clientId(), cfg.clientSecret(), REDIRECT_URI);
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const { credentials } = await oauth2Client.refreshAccessToken();
        if (credentials && credentials.access_token) return { alive: true, error: null };
        return { alive: false, error: 'No access token returned' };
    } catch (err) {
        return { alive: false, error: err.message || 'Token invalid or expired' };
    }
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// GET /api/drive-tokens/all  — overview (no secrets exposed)
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
async function getAllTokens(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user || user.role !== 'Admin') return res.status(403).json({ message: 'Admin only.' });

        const records = await driveTokenModel.find().select('-refreshToken');

        // Merge with .env label info
        const labels = ['LOST', 'EE', 'ME', 'CE'];
        const tokens = labels.map(label => {
            const rec = records.find(r => r.label === label);
            return {
                label,
                hasToken: !!rec,
                lastChecked: rec?.lastChecked || null,
                lastStatus: rec?.lastStatus || 'unknown',
                lastError: rec?.lastError || null
            };
        });

        return res.status(200).json({ tokens });
    } catch (err) {
        return res.status(500).json({ message: 'Server error' });
    }
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// GET /api/drive-tokens/check/:label  — live token status check
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
async function checkTokenStatus(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user || user.role !== 'Admin') return res.status(403).json({ message: 'Admin only.' });

        const label = req.params.label.toUpperCase();
        if (!ENV_CONFIG[label]) return res.status(400).json({ message: `Invalid label: ${label}` });

        const record = await driveTokenModel.findOne({ label });
        if (!record) {
            return res.status(404).json({
                message: `No refresh token stored for ${label}. Please set it first.`,
                label,
                hasToken: false
            });
        }

        const result = await testRefreshToken(label, record.refreshToken);

        record.lastChecked = new Date();
        record.lastStatus = result.alive ? 'active' : 'expired';
        record.lastError = result.alive ? null : result.error;
        await record.save();

        return res.status(200).json({
            label,
            lastChecked: record.lastChecked,
            status: record.lastStatus,
            error: record.lastError,
            hasToken: true
        });
    } catch (err) {
        console.error('Check token error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// PUT /api/drive-tokens/update/:label  — save new refresh token to DB
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
async function updateRefreshToken(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user || user.role !== 'Admin') return res.status(403).json({ message: 'Admin only.' });

        const label = req.params.label.toUpperCase();
        if (!ENV_CONFIG[label]) return res.status(400).json({ message: `Invalid label: ${label}` });

        const { refreshToken } = req.body;
        if (!refreshToken || !refreshToken.trim()) {
            return res.status(400).json({ message: 'Refresh token is required.' });
        }

        // Validate before saving
        const result = await testRefreshToken(label, refreshToken.trim());
        if (!result.alive) {
            return res.status(400).json({
                message: `❌ Token validation failed: ${result.error}. Token NOT saved.`
            });
        }

        // Upsert into MongoDB
        await driveTokenModel.findOneAndUpdate(
            { label },
            {
                label,
                refreshToken: refreshToken.trim(),
                lastStatus: 'active',
                lastError: null,
                lastChecked: new Date()
            },
            { upsert: true, new: true }
        );

        // Reload drive client immediately
        const driveConfig = require('../config/drive.config.js');
        await driveConfig.reloadClient(label);

        return res.status(200).json({
            message: `✅ Refresh token for ${label} updated and verified successfully!`
        });
    } catch (err) {
        console.error('Update token error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// GET /api/drive-tokens/auth-url/:label  — generate OAuth consent URL
// (Point 16: admin clicks this link, approves, gets code back)
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
async function getAuthUrl(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user || user.role !== 'Admin') return res.status(403).json({ message: 'Admin only.' });

        const label = req.params.label.toUpperCase();
        const cfg = ENV_CONFIG[label];
        if (!cfg) return res.status(400).json({ message: `Invalid label: ${label}` });

        const oauth2Client = new google.auth.OAuth2(cfg.clientId(), cfg.clientSecret(), REDIRECT_URI);

        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',           // force consent so refresh token is always returned
            scope: ['https://www.googleapis.com/auth/drive'],
            state: label                 // pass label through so callback knows which drive
        });

        return res.status(200).json({ url, label });
    } catch (err) {
        console.error('Auth URL error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// GET /api/drive-tokens/auth-start/:label  — direct redirect to Google OAuth
// Opens Google consent screen immediately instead of returning JSON
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
async function startOAuth(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user || user.role !== 'Admin') {
            return res.status(403).send('Admin only.');
        }

        const label = req.params.label.toUpperCase();
        const cfg = ENV_CONFIG[label];
        if (!cfg) {
            return res.status(400).send(`Invalid label: ${label}`);
        }

        const oauth2Client = new google.auth.OAuth2(
            cfg.clientId(),
            cfg.clientSecret(),
            REDIRECT_URI
        );

        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: ['https://www.googleapis.com/auth/drive'],
            state: label
        });

        return res.redirect(url);
    } catch (err) {
        console.error('Start OAuth error:', err);
        return res.status(500).send('Server error');
    }
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// GET /api/drive-tokens/oauth-callback  — Google redirects here after approval
// Exchanges auth code → refresh token, saves to DB, redirects admin back
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
async function oauthCallback(req, res) {
    try {
        const { code, state: label, error } = req.query;

        if (error) {
            return res.redirect(
                `${process.env.FRONTEND_URL}/admin-profile.html?token_error=${encodeURIComponent(error)}&label=${label}`
            );
        }

        if (!code || !label) {
            return res.status(400).send('Missing code or label.');
        }

        const cfg = ENV_CONFIG[label];
        if (!cfg) return res.status(400).send(`Invalid label: ${label}`);

        const oauth2Client = new google.auth.OAuth2(cfg.clientId(), cfg.clientSecret(), REDIRECT_URI);
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.refresh_token) {
            return res.redirect(
                `${process.env.FRONTEND_URL}/admin-profile.html?token_error=${encodeURIComponent('No refresh token returned. Try revoking access first at myaccount.google.com/permissions then retry.')}&label=${label}`
            );
        }

        // Save to MongoDB
        await driveTokenModel.findOneAndUpdate(
            { label },
            {
                label,
                refreshToken: tokens.refresh_token,
                lastStatus: 'active',
                lastError: null,
                lastChecked: new Date()
            },
            { upsert: true, new: true }
        );

        // Reload drive client
        const driveConfig = require('../config/drive.config.js');
        await driveConfig.reloadClient(label);

        console.log(`✅ OAuth refresh token auto-saved for: ${label}`);

        // Redirect back to admin profile with success message
        return res.redirect(
            `${process.env.FRONTEND_URL}/admin-profile.html?token_success=${label}`
        );
    } catch (err) {
        console.error('OAuth callback error:', err);
        return res.redirect(
            `${process.env.FRONTEND_URL}/admin-profile.html?token_error=${encodeURIComponent(err.message)}&label=unknown`
        );
    }
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// GET /api/drive-tokens/seed  — one-time seed of refresh tokens from .env
// Safe: skips if already exists
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
async function seedTokensFromEnv(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user || user.role !== 'Admin') return res.status(403).json({ message: 'Admin only.' });

        const entries = [
            { label: 'LOST', refreshToken: process.env.GOOGLE_REFRESH_TOKEN },
            { label: 'EE',   refreshToken: process.env.GOOGLE_REFRESH_TOKEN_EE },
            { label: 'ME',   refreshToken: process.env.GOOGLE_REFRESH_TOKEN_ME },
            { label: 'CE',   refreshToken: process.env.GOOGLE_REFRESH_TOKEN_CE }
        ];

        let seeded = 0, skipped = 0, missing = 0;
        for (const entry of entries) {
            if (!entry.refreshToken) { missing++; continue; }
            const exists = await driveTokenModel.findOne({ label: entry.label });
            if (exists) { skipped++; continue; }
            await driveTokenModel.create({ label: entry.label, refreshToken: entry.refreshToken });
            seeded++;
        }

        return res.status(200).json({
            message: `Seed complete. Seeded: ${seeded}, Already in DB (skipped): ${skipped}, Missing in .env: ${missing}`
        });
    } catch (err) {
        console.error('Seed error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = {
    getAllTokens,
    checkTokenStatus,
    updateRefreshToken,
    getAuthUrl,
    startOAuth,
    oauthCallback,
    seedTokensFromEnv
};