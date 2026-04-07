const userModel = require('../models/user.model.js');
const resourceModel = require('../models/resource.model.js');
const chatHistoryModel = require('../models/chatHistory.model.js');
const aiUsageModel = require('../models/aiUsage.model.js');
const jwt = require('jsonwebtoken');

const DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT) || 15;
const GEMINI_MODEL = 'gemini-2.5-flash';

// ── 4 keys from 4 different Gmail accounts ──
const GEMINI_KEYS = [
    process.env.GEMINI_KEY_1,
    process.env.GEMINI_KEY_2,
    process.env.GEMINI_KEY_3,
    process.env.GEMINI_KEY_4
].filter(Boolean); // removes undefined if some keys not added yet

const GEMINI_LIMIT_PER_KEY = parseInt(process.env.GEMINI_DAILY_LIMIT_PER_KEY) || 450;

// In-memory key usage tracker (resets on server restart = daily restart covers this)
const keyUsage = {};

function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}

// Returns the first key that hasn't hit 450 today
function getActiveGeminiKey() {
    const today = getTodayStr();
    for (let i = 0; i < GEMINI_KEYS.length; i++) {
        const usageKey = `${today}_key${i}`;
        const used = keyUsage[usageKey] || 0;
        if (used < GEMINI_LIMIT_PER_KEY) {
            return { key: GEMINI_KEYS[i], usageKey };
        }
    }
    return null; // all 4 keys exhausted
}

function incrementKeyUsage(usageKey) {
    keyUsage[usageKey] = (keyUsage[usageKey] || 0) + 1;
}

// ─── Helper: get user from token ───────────────────────────────
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

// ─── Helper: today's date string ──────────────────────────────
function todayStr() {
    return new Date().toISOString().split('T')[0];
}

// ─── POST /api/ai/chat ─────────────────────────────────────────
async function chat(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user) {
            return res.status(401).json({ message: '🔒 Please login to use the AI assistant.' });
        }
        if (user.isBlocked) {
            return res.status(403).json({ message: 'Your account is blocked.' });
        }

        const { message } = req.body;
        if (!message || message.trim() === '') {
            return res.status(400).json({ message: 'Message is required.' });
        }

        // ── Daily limit check ──
        const today = todayStr();
        let usage = await aiUsageModel.findOne({ userId: user._id, date: today });
        if (usage && usage.count >= DAILY_LIMIT) {
            return res.status(429).json({ 
                message: `⚠️ Daily limit of ${DAILY_LIMIT} questions reached. Resets at midnight. Come back tomorrow!`
            });
        }

        // ── Get active Gemini key (auto-rotate) ──
        const activeKey = getActiveGeminiKey();
        if (!activeKey) {
            return res.status(429).json({
                message: '⚠️ AI service is at full capacity for today. Please try again tomorrow!'
            });
        }

        const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${activeKey.key}`;

        // ── Fetch relevant PDFs from DB based on message context ──
        const msgLower = message.toLowerCase();
        let contextFilter = {};

        const branchMap = { 'ee': 'EE', 'electrical': 'EE', 'me': 'ME', 'mechanical': 'ME', 'ce': 'CE', 'civil': 'CE' };
        for (const [key, val] of Object.entries(branchMap)) {
            if (msgLower.includes(key)) { contextFilter.branch = val; break; }
        }

        const semMatch = msgLower.match(/sem(?:ester)?\s*[-]?\s*(\d)/i) || msgLower.match(/(\d)(?:st|nd|rd|th)\s+sem/i);
        if (semMatch) contextFilter.semester = parseInt(semMatch[1]);

        let resources = [];
        if (Object.keys(contextFilter).length > 0) {
            resources = await resourceModel
                .find(contextFilter)
                .select('branch semester subjectCode subjectName partNumber fileName')
                .lean();
        }

        let resourceContext = '';
        if (resources.length > 0) {
            resourceContext = '\n\n📚 Available Study Materials in our database:\n';
            const grouped = {};
            resources.forEach(r => {
                const key = `${r.branch} Sem-${r.semester} | ${r.subjectName} (${r.subjectCode})`;
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(`Part-${r.partNumber}`);
            });
            for (const [subject, parts] of Object.entries(grouped)) {
                resourceContext += `• ${subject}: ${parts.join(', ')} available\n`;
            }
            resourceContext += '\nWhen mentioning these materials, tell the user they can find them in the Resources section by filtering branch → semester → subject.\n';
        }

        // ── Build system prompt ──
        // ── Build system prompt ──
        const systemPrompt = `You are a smart and helpful AI assistant embedded in the NIT Patna Free Resources website.

        Guidelines:
        1. Answer ANY question the user asks — academic, general knowledge, science, math, coding, history, current affairs, or anything else. Never refuse or redirect.
        2. If PDF content is provided below, use it as the primary source to answer subject-related questions. Extract formulas, concepts, summaries, and PYQ solutions directly from it.
        3. For questions outside the PDF content, use your own knowledge to give accurate, complete answers.
        4. Be concise but thorough. Use bullet points, formulas, or examples wherever helpful.
        5. If asked about available notes/PDFs on the website, tell the user to use the Resources filter (branch → semester → subject).
        6. Never make up file links.
        7. Keep responses focused and under 400 words unless a detailed explanation is needed.
        8. If a user asks to "find notes for [subject]", tell them to use the Resources filter on the website.
        9. If you don't know the answer, say "I don't have that information right now, but I can help with other questions!"
        10 Always encourage students to explore the resources available on the website.
        11. If unusual or inappropriate requests are made, respond with "I'm here to help with academic questions related to NIT Patna. Let's keep our conversation focused on that."
        ${resourceContext}`;

        // ── Load chat history ──
        let historyDoc = await chatHistoryModel.findOne({ userId: user._id });
        const chatHistory = historyDoc ? historyDoc.messages : [];

        const contents = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: 'Understood. I am ready to help NIT Patna students with their academic queries.' }] },
            ...chatHistory.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            })),
            { role: 'user', parts: [{ text: message }] }
        ];

        // ── Call Gemini API ──
        const geminiRes = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 600
                }
            })
        });

        if (!geminiRes.ok) {
            const errData = await geminiRes.json();
            console.error('Gemini API error:', errData);

            // If this key got rate limited by Google, mark it exhausted and inform user
            if (errData?.error?.code === 429) {
                keyUsage[activeKey.usageKey] = GEMINI_LIMIT_PER_KEY;
                return res.status(429).json({
                    message: '⚠️ AI is busy right now. Please try again in a moment!'
                });
            }

            return res.status(502).json({ 
                message: 'AI service temporarily unavailable. Try again shortly.' 
            });
        }

        // ── Success: increment key usage ──
        incrementKeyUsage(activeKey.usageKey);

        const geminiData = await geminiRes.json();
        const aiReply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

        // ── Save updated chat history ──
        const newMessages = [
            ...chatHistory,
            { role: 'user', text: message },
            { role: 'model', text: aiReply }
        ];

        const trimmed = newMessages.slice(-20);

        await chatHistoryModel.findOneAndUpdate(
            { userId: user._id },
            {
                userId: user._id,
                messages: trimmed,
                expiresAt: new Date(Date.now() + 20 * 1000)
            },
            { upsert: true, new: true }
        );

        // ── Increment daily usage ──
        await aiUsageModel.findOneAndUpdate(
            { userId: user._id, date: today },
            { $inc: { count: 1 } },
            { upsert: true }
        );

        const remaining = DAILY_LIMIT - ((usage?.count || 0) + 1);

        return res.status(200).json({ 
            reply: aiReply,
            questionsRemaining: remaining
        });

    } catch (err) {
        console.error('AI chat error:', err);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
}

// ─── GET /api/ai/history ──────────────────────────────────────
async function getHistory(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ message: 'Login required.' });

        const history = await chatHistoryModel.findOne({ userId: user._id });
        return res.status(200).json({ messages: history?.messages || [] });
    } catch (err) {
        return res.status(500).json({ message: 'Server error' });
    }
}

// ─── DELETE /api/ai/history ───────────────────────────────────
async function clearHistory(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ message: 'Login required.' });

        await chatHistoryModel.findOneAndDelete({ userId: user._id });
        return res.status(200).json({ message: 'Chat history cleared.' });
    } catch (err) {
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = { chat, getHistory, clearHistory };