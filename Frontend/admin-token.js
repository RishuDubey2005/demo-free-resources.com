/**
 * NITP - Admin Drive Token Management
 * Handles token status check, OAuth auto-generation, and manual update
 */

let currentCheckedLabel = null;

document.addEventListener('DOMContentLoaded', function () {

    // ── Check for OAuth callback result in URL ──
    const urlParams = new URLSearchParams(window.location.search);
    const tokenSuccess = urlParams.get('token_success');
    const tokenError   = urlParams.get('token_error');
    const tokenLabel   = urlParams.get('label');

    if (tokenSuccess) {
        showGlobalMsg(`✅ Refresh token for ${tokenSuccess} was auto-generated and saved to DB successfully!`, 'green');
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
        // Auto-check the label that was just updated
        document.getElementById('token-label-select').value = tokenSuccess;
        setTimeout(() => checkTokenStatus(), 500);
    }
    if (tokenError) {
        showGlobalMsg(`❌ OAuth error for ${tokenLabel}: ${decodeURIComponent(tokenError)}`, 'red');
        window.history.replaceState({}, '', window.location.pathname);
    }

    // ── Seed button ──
    document.getElementById('seed-tokens-btn')?.addEventListener('click', async function () {
        const btn = this;
        const status = document.getElementById('seed-status');
        if (!confirm('This seeds refresh tokens from your .env into MongoDB. Only needed once. Continue?')) return;

        btn.disabled = true;
        btn.textContent = '⏳ Seeding...';
        status.textContent = '';

        try {
            const res = await fetch(`${API}/api/drive-tokens/seed`, {
                credentials: 'include', headers: getAuthHeaders()
            });
            const data = await res.json();
            status.textContent = res.ok ? `✅ ${data.message}` : `❌ ${data.message}`;
            status.style.color = res.ok ? '#10b981' : '#ef4444';
        } catch {
            status.textContent = '❌ Network error';
            status.style.color = '#ef4444';
        } finally {
            btn.disabled = false;
            btn.textContent = '🌱 Seed Tokens from .env (Run Once)';
        }
    });

    // ── Check status button ──
    document.getElementById('check-token-btn')?.addEventListener('click', checkTokenStatus);

    // ── Auto-generate button (opens OAuth consent in new tab) ──
    document.getElementById('auto-generate-btn')?.addEventListener('click', autoGenerateToken);

    // ── Manual update button ──
    document.getElementById('update-token-btn')?.addEventListener('click', updateToken);

    // ── Cancel button ──
    document.getElementById('cancel-token-btn')?.addEventListener('click', function () {
        document.getElementById('new-refresh-token-input').value = '';
        document.getElementById('update-token-status').textContent = '';
    });

    // ── Load all overview ──
    document.getElementById('load-all-tokens-btn')?.addEventListener('click', loadAllTokens);
    bindQuickTokenActions();
    hydrateOAuthPathLinks();
});

function showGlobalMsg(msg, color) {
    const el = document.getElementById('token-global-msg');
    if (!el) return;
    el.textContent = msg;
    el.style.color = color === 'green' ? '#065f46' : '#991b1b';
    el.style.background = color === 'green' ? '#d1fae5' : '#fee2e2';
    el.style.border = `1px solid ${color === 'green' ? '#6ee7b7' : '#fca5a5'}`;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 8000);
}

function hydrateOAuthPathLinks() {
    const links = [
        { id: 'oauth-link-lost', label: 'LOST' },
        { id: 'oauth-link-ee', label: 'EE' },
        { id: 'oauth-link-me', label: 'ME' },
        { id: 'oauth-link-ce', label: 'CE' }
    ];

    links.forEach(({ id, label }) => {
        const el = document.getElementById(id);
        if (!el) return;

        const fullPath = `${API}/api/drive-tokens/auth-start/${label}`;
        el.href = fullPath;
        el.textContent = fullPath;
    });

    const callbackEl = document.getElementById('oauth-callback-path');
    if (callbackEl) {
        callbackEl.textContent = `${API}/api/drive-tokens/oauth-callback`;
    }
}


function bindQuickTokenActions() {
    document.querySelectorAll('[data-token-action][data-token-label]').forEach(btn => {
        btn.addEventListener('click', async function () {
            const label = this.dataset.tokenLabel;
            const action = this.dataset.tokenAction;

            if (!label || !action) return;

            if (action === 'check') {
                await checkTokenStatusByLabel(label, this);
            }

            if (action === 'oauth') {
                await autoGenerateTokenForLabel(label, this);
            }
        });
    });
}

async function checkTokenStatusByLabel(label, triggerBtn = null) {
    if (!label) {
        alert('Please select a Drive account first.');
        return;
    }

    const selectEl = document.getElementById('token-label-select');
    if (selectEl) selectEl.value = label;

    const btn = triggerBtn || document.getElementById('check-token-btn');
    const oldText = btn ? btn.textContent : '';

    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Checking...';
    }

    document.getElementById('token-status-card').classList.add('hidden');
    document.getElementById('update-token-status').textContent = '';

    try {
        const res = await fetch(`${API}/api/drive-tokens/check/${label}`, {
            credentials: 'include',
            headers: getAuthHeaders()
        });

        const data = await res.json();

        if (res.ok) {
            currentCheckedLabel = label;
            renderTokenCard(data);
        } else {
            currentCheckedLabel = label;
            renderTokenCard({
                label,
                status: 'unknown',
                error: data.message,
                hasToken: false,
                lastChecked: null
            });
        }
    } catch {
        alert('❌ Network error. Try again.');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = oldText || '🔍 Check Status';
        }
    }
}

async function autoGenerateTokenForLabel(label, triggerBtn = null) {
    if (!label) {
        alert('Please choose a valid drive label.');
        return;
    }

    currentCheckedLabel = label;

    const selectEl = document.getElementById('token-label-select');
    if (selectEl) selectEl.value = label;

    const btn = triggerBtn || document.getElementById('auto-generate-btn');
    const oldText = btn ? btn.textContent : '';

    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Getting auth URL...';
    }

    try {
        const res = await fetch(`${API}/api/drive-tokens/auth-url/${label}`, {
            credentials: 'include',
            headers: getAuthHeaders()
        });

        const data = await res.json();

        if (res.ok) {
            const instrEl = document.getElementById('oauth-instructions');

            if (instrEl) {
                instrEl.innerHTML = `
                    <strong>Drive selected:</strong> ${label}<br>
                    <strong>Step 1:</strong> A Google login page has opened in a new tab.<br>
                    <strong>Step 2:</strong> Sign in with the correct Gmail for <strong>${label}</strong> drive only.<br>
                    <strong>Step 3:</strong> Click "Allow".<br>
                    <strong>Step 4:</strong> Google will redirect to <code>/api/drive-tokens/oauth-callback</code>.<br>
                    <strong>Step 5:</strong> Backend will auto-save the new refresh token in MongoDB.<br>
                    <strong>Step 6:</strong> You will be sent back to <code>/admin-profile.html</code> automatically.<br>
                    <strong>Step 7:</strong> Click the check button again and confirm the token is active.<br><br>
                    <span style="color:#b91c1c;">
                        If no refresh token is returned, revoke app access first from
                        <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">myaccount.google.com/permissions</a>
                        using the same Gmail account, then retry.
                    </span>
                `;
                instrEl.classList.remove('hidden');
            }

            window.open(data.url, '_blank');
        } else {
            alert('❌ ' + data.message);
        }
    } catch {
        alert('❌ Network error. Try again.');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = oldText || '🔄 Auto-Generate Token (OAuth)';
        }
    }
}


async function checkTokenStatus() {
    const label = document.getElementById('token-label-select').value;
    await checkTokenStatusByLabel(label);
}

function renderTokenCard(data) {
    const card = document.getElementById('token-status-card');
    const isActive = data.status === 'active';
    const isUnknown = data.status === 'unknown' || !data.hasToken;

    document.getElementById('token-card-label').textContent = `Drive: ${data.label}`;
    document.getElementById('token-card-checked').textContent =
        data.lastChecked
            ? `Last checked: ${new Date(data.lastChecked).toLocaleString('en-IN')}`
            : 'Never checked';

    const badge = document.getElementById('token-card-status-badge');
    if (isActive) {
        badge.textContent = '✅ Active';
        badge.style.cssText = 'background:#d1fae5;color:#065f46;padding:5px 16px;border-radius:20px;font-size:13px;font-weight:700;';
    } else if (isUnknown) {
        badge.textContent = '⚠️ Not Set';
        badge.style.cssText = 'background:#fef3c7;color:#92400e;padding:5px 16px;border-radius:20px;font-size:13px;font-weight:700;';
    } else {
        badge.textContent = '❌ Expired / Dead';
        badge.style.cssText = 'background:#fee2e2;color:#991b1b;padding:5px 16px;border-radius:20px;font-size:13px;font-weight:700;';
    }

    const errEl = document.getElementById('token-card-error');
    if (data.error) {
        errEl.textContent = `${data.error}`;
        errEl.classList.remove('hidden');
    } else {
        errEl.classList.add('hidden');
    }

    document.getElementById('new-refresh-token-input').value = '';
    document.getElementById('update-token-status').textContent = '';
    card.classList.remove('hidden');
}

// ── Auto-generate: get OAuth URL from server, open it ──
async function autoGenerateToken() {
    if (!currentCheckedLabel) {
        alert('Please check a token status first, or use the direct Fix button for that drive.');
        return;
    }

    await autoGenerateTokenForLabel(currentCheckedLabel);
}

// ── Manual update ──
async function updateToken() {
    if (!currentCheckedLabel) { alert('Please check a token status first.'); return; }

    const newToken = document.getElementById('new-refresh-token-input').value.trim();
    if (!newToken) { alert('Please paste the new refresh token.'); return; }

    const btn = document.getElementById('update-token-btn');
    const status = document.getElementById('update-token-status');
    btn.disabled = true;
    btn.textContent = '⏳ Validating & Saving...';
    status.textContent = '';

    try {
        const res = await fetch(`${API}/api/drive-tokens/update/${currentCheckedLabel}`, {
            method: 'PUT',
            credentials: 'include',
            headers: getAuthHeaders(),
            body: JSON.stringify({ refreshToken: newToken })
        });
        const data = await res.json();

        if (res.ok) {
            status.style.color = '#10b981';
            status.textContent = data.message;
            document.getElementById('new-refresh-token-input').value = '';
            await checkTokenStatus();
        } else {
            status.style.color = '#ef4444';
            status.textContent = data.message;
        }
    } catch {
        status.style.color = '#ef4444';
        status.textContent = '❌ Network error. Try again.';
    } finally {
        btn.disabled = false;
        btn.textContent = '✅ Set Token in DB';
    }
}

async function loadAllTokens() {
    const btn = document.getElementById('load-all-tokens-btn');
    const list = document.getElementById('all-tokens-list');
    btn.disabled = true;
    btn.textContent = '⏳ Loading...';
    list.innerHTML = '<p class="token-muted-text" style="font-size:13px;">Loading...</p>';

    try {
        const res = await fetch(`${API}/api/drive-tokens/all`, {
            credentials: 'include', headers: getAuthHeaders()
        });
        const data = await res.json();

        if (res.ok && data.tokens.length > 0) {
            list.innerHTML = data.tokens.map(t => {
                const sc = t.lastStatus === 'active' ? '#10b981' : t.lastStatus === 'expired' ? '#ef4444' : '#f59e0b';
                const st = t.lastStatus === 'active' ? '✅ Active' : t.lastStatus === 'expired' ? '❌ Expired' : '⚠️ Unknown';
                return `
                    <div class="token-overview-item" style="display:flex;justify-content:space-between;align-items:center;
                                padding:10px 14px;border-radius:10px;border:1px solid #e5e7eb;
                                margin-bottom:8px;flex-wrap:wrap;gap:8px;background:#fafafa;">
                        <div>
                            <strong>${t.label}</strong>
                            ${!t.hasToken ? '<span style="font-size:11px;color:#ef4444;margin-left:6px;">⚠️ No token in DB</span>' : ''}
                            <br>
                            <small class="token-muted-text">
                                Last checked: ${t.lastChecked ? new Date(t.lastChecked).toLocaleString('en-IN') : 'Never'}
                            </small>
                        </div>
                        <span style="color:${sc};font-weight:700;font-size:13px;">${st}</span>
                    </div>
                `;
            }).join('');
        } else {
            list.innerHTML = '<p class="token-muted-text" style="font-size:13px;">No data yet. Check individual tokens or seed first.</p>';
        }
    } catch {
        list.innerHTML = '<p style="color:red;font-size:13px;">❌ Network error.</p>';
    } finally {
        btn.disabled = false;
        btn.textContent = '📥 Load All Token Status';
    }
}
