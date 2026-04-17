const { google } = require('googleapis');
const { Readable } = require('stream');
const path = require('path');

// ── Per-label config from .env (never changes) ──
const ENV_CONFIG = {
    LOST: {
        clientId:     () => process.env.GOOGLE_CLIENT_ID,
        clientSecret: () => process.env.GOOGLE_CLIENT_SECRET,
        folderId:     () => process.env.GOOGLE_DRIVE_FOLDER_ID
    },
    EE: {
        clientId:     () => process.env.GOOGLE_CLIENT_ID_EE,
        clientSecret: () => process.env.GOOGLE_CLIENT_SECRET_EE,
        folderId:     () => process.env.GOOGLE_DRIVE_FOLDER_EE
    },
    ME: {
        clientId:     () => process.env.GOOGLE_CLIENT_ID_ME,
        clientSecret: () => process.env.GOOGLE_CLIENT_SECRET_ME,
        folderId:     () => process.env.GOOGLE_DRIVE_FOLDER_ME
    },
    CE: {
        clientId:     () => process.env.GOOGLE_CLIENT_ID_CE,
        clientSecret: () => process.env.GOOGLE_CLIENT_SECRET_CE,
        folderId:     () => process.env.GOOGLE_DRIVE_FOLDER_CE
    }
};

// ── Cache of live OAuth2 clients ──
const clientCache = {};

function getModel() {
    return require('../models/driveToken.model.js');
}

// Build a fresh OAuth2 client for a label using DB refresh token + .env credentials
async function buildClient(label) {
    const driveTokenModel = getModel();
    const record = await driveTokenModel.findOne({ label });
    if (!record) {
        throw new Error(
            `No refresh token in DB for label: ${label}. ` +
            `Please go to Admin Profile → Token Management → Seed or manually set the token.`
        );
    }

    const cfg = ENV_CONFIG[label];
    if (!cfg) throw new Error(`Unknown Drive label: ${label}`);

    const oauth2Client = new google.auth.OAuth2(
        cfg.clientId(),
        cfg.clientSecret(),
        'http://localhost:3000'
    );
    oauth2Client.setCredentials({ refresh_token: record.refreshToken });
    return oauth2Client;
}

// Get cached client or build a new one
async function getClient(label) {
    if (!clientCache[label]) {
        clientCache[label] = await buildClient(label);
    }
    return clientCache[label];
}

// Force-reload client after token update
async function reloadClient(label) {
    delete clientCache[label];
    clientCache[label] = await buildClient(label);
    console.log(`🔄 Drive client reloaded for: ${label}`);
}

function bufferToStream(buffer) {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
}

function generateFileName(originalName) {
    const ext = originalName ? path.extname(originalName) : '.jpg';
    return `lost_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
}

// ── Lost item image upload ──
async function uploadFile(buffer, originalName, mimeType) {
    const auth = await getClient('LOST');
    const drive = google.drive({ version: 'v3', auth });
    const folderId = ENV_CONFIG.LOST.folderId();

    const fileName = generateFileName(originalName);
    const response = await drive.files.create({
        requestBody: { name: fileName, parents: [folderId], mimeType },
        media: { mimeType, body: bufferToStream(buffer) },
        fields: 'id'
    });

    const fileId = response.data.id;
    await drive.permissions.create({
        fileId,
        requestBody: { role: 'reader', type: 'anyone' }
    });

    return { fileId, url: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000` };
}

// ── Upload PDF to branch drive ──
async function uploadResourcePDF(buffer, fileName, branch) {
    const label = branch; // 'EE', 'ME', 'CE'
    const auth = await getClient(label);
    const drive = google.drive({ version: 'v3', auth });
    const folderId = ENV_CONFIG[label].folderId();

    const response = await drive.files.create({
        requestBody: { name: fileName, parents: [folderId], mimeType: 'application/pdf' },
        media: { mimeType: 'application/pdf', body: bufferToStream(buffer) },
        fields: 'id'
    });

    const fileId = response.data.id;
    await drive.permissions.create({
        fileId,
        requestBody: { role: 'reader', type: 'anyone' }
    });

    return { fileId, fileName };
}

// ── Delete file ──
async function deleteFile(fileId, branch) {
    const label = branch || 'LOST';
    const auth = await getClient(label);
    const drive = google.drive({ version: 'v3', auth });
    await drive.files.delete({ fileId });
}

// ── Move lost item to trash (permanent delete) ──
async function moveFileToTrash(fileId) {
    const auth = await getClient('LOST');
    const drive = google.drive({ version: 'v3', auth });
    await drive.files.delete({ fileId });
}

// ── Stream PDF via proxy ──
async function getFileStream(fileId, branch) {
    const label = branch || 'LOST';
    const auth = await getClient(label);
    const drive = google.drive({ version: 'v3', auth });
    const response = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
    );
    return response.data;
}

module.exports = {
    uploadFile,
    moveFileToTrash,
    uploadResourcePDF,
    deleteFile,
    getFileStream,
    reloadClient
};