/**
 * NITP Resources - AI Bot Widget
 * Injected on all pages via header.js
 */

(function() {
    const API = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : 'https://nitp-free-resources-com-backend.onrender.com';

    function getAuthHeaders() {
        const token = localStorage.getItem('token');
        const h = { 'Content-Type': 'application/json' };
        if (token) h['Authorization'] = `Bearer ${token}`;
        return h;
    }

    function isLoggedIn() {
        return !!localStorage.getItem('token');
    }

    // ── Inject CSS ──
    function injectCSS() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'ai-bot.css';
        document.head.appendChild(link);
    }

    // ── Inject HTML ──
    function injectHTML() {
        const fab = document.createElement('button');
        fab.id = 'ai-bot-fab';
        fab.title = 'Ask AI Assistant';
        fab.innerHTML = '🤖';
        fab.onclick = toggleBot;

        const panel = document.createElement('div');
        panel.id = 'ai-bot-panel';
        panel.classList.add('hidden');
        panel.innerHTML = `
            <div id="ai-bot-header">
                <div class="bot-title">🤖 <span>NITP AI Assistant</span></div>
                <button class="bot-close" onclick="window._botToggle()">✕</button>
            </div>
            <div id="ai-bot-messages">
            <h3 style="color: #7542e3;">Instructions:
                <li style="color: #864a0a;">Can ask only 15 questions per day in free plan.</li>
                <li style="color: #0a6786;"><u><b>Mention branch and subject to ask anything.</b></u></li><br>
                <li style="color: #52af0b;">Ask me to <b>"summarize your notes"</b>,<b>"provide solutions of PYQs"</b>,<b>"formulas of any subject"</b> etc.</li><br>
            </h3>
            </div>
            <div id="ai-bot-limit"></div>
            <div id="ai-bot-input-row">
                <textarea id="ai-bot-input" placeholder="Ask about summary, pyq solutions, formulas..." rows="2"></textarea>
                <button id="ai-bot-send" onclick="window._botSend()">➤</button>
            </div>
        `;

        document.body.appendChild(fab);
        document.body.appendChild(panel);

        // Enter key to send (Shift+Enter for newline)
        setTimeout(() => {
            const inp = document.getElementById('ai-bot-input');
            if (inp) {
                inp.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        window._botSend();
                    }
                });
            }
        }, 500);

        // Load history if logged in
        if (isLoggedIn()) loadHistory();
    }

    function toggleBot() {
        const panel = document.getElementById('ai-bot-panel');
        if (!panel) return;
        if (panel.classList.contains('hidden')) {
            panel.classList.remove('hidden');
            if (!isLoggedIn()) showNotLoggedIn();
        } else {
            panel.classList.add('hidden');
        }
    }
    window._botToggle = toggleBot;

    function showNotLoggedIn() {
        const msgs = document.getElementById('ai-bot-messages');
        msgs.innerHTML = `
            <div id="ai-bot-not-logged">
                🔒 Please <a href="login.html" style="color:#4f46e5;font-weight:600;">login</a> to use the AI assistant.<br>
                <small>Only registered users can chat with the AI.</small>
            </div>
        `;
        const row = document.getElementById('ai-bot-input-row');
        if (row) row.style.display = 'none';
    }

    function appendMessage(role, text) {
        const msgs = document.getElementById('ai-bot-messages');
        const div = document.createElement('div');
        div.className = role === 'user' ? 'user-msg' : 'bot-msg';
        div.textContent = text;
        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;
    }

    function setLimit(remaining) {
        const el = document.getElementById('ai-bot-limit');
        if (el) el.textContent = `${remaining} questions left today`;
    }

    async function loadHistory() {
        try {
            const res = await fetch(`${API}/api/ai/history`, {
                credentials: 'include',
                headers: getAuthHeaders()
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data.messages && data.messages.length > 0) {
                const msgs = document.getElementById('ai-bot-messages');
                msgs.innerHTML = ''; // clear welcome
                data.messages.forEach(m => appendMessage(m.role === 'model' ? 'bot' : 'user', m.text));
            }
        } catch(e) { /* silent */ }
    }

    window._botSend = async function() {
        if (!isLoggedIn()) { showNotLoggedIn(); return; }

        const inp = document.getElementById('ai-bot-input');
        const sendBtn = document.getElementById('ai-bot-send');
        const message = inp?.value.trim();
        if (!message) return;

        inp.value = '';
        inp.disabled = true;
        sendBtn.disabled = true;

        appendMessage('user', message);

        // Thinking indicator
        const msgs = document.getElementById('ai-bot-messages');
        const thinking = document.createElement('div');
        thinking.className = 'bot-msg';
        thinking.id = 'bot-thinking';
        thinking.textContent = '⏳ Thinking...';
        msgs.appendChild(thinking);
        msgs.scrollTop = msgs.scrollHeight;

        try {
            const res = await fetch(`${API}/api/ai/chat`, {
                method: 'POST',
                credentials: 'include',
                headers: getAuthHeaders(),
                body: JSON.stringify({ message })
            });

            const data = await res.json();
            thinking.remove();

            if (res.ok) {
                appendMessage('bot', data.reply);
                if (typeof data.questionsRemaining === 'number') {
                    setLimit(data.questionsRemaining);
                }
            } else {
                appendMessage('bot', '❌ ' + (data.message || 'Something went wrong.'));
            }

        } catch(err) {
            thinking.remove();
            appendMessage('bot', '❌ Network error. Please try again.');
        } finally {
            inp.disabled = false;
            sendBtn.disabled = false;
            inp.focus();
        }
    };

    // ── Init ──
    function init() {
        injectCSS();
        injectHTML();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();