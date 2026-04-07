/**
 * Professor Profile - My Resources Section
 */

let profPage = 1;
let profHasMore = true;
let profLoading = false;

document.addEventListener('DOMContentLoaded', function() {
    loadProfResources(1, false);
    loadProfAlerts();

    const btn = document.getElementById('prof-load-more-btn');
    if (btn) btn.addEventListener('click', function() {
        if (profHasMore && !profLoading) {
            profPage++;
            loadProfResources(profPage, true);
        }
    });
});

async function loadProfResources(page = 1, append = false) {
    if (profLoading) return;
    profLoading = true;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const list = document.getElementById('prof-resources-list');
    if (!list) return;

    if (!append) list.innerHTML = '<p>⏳ Loading...</p>';

    try {
        const res = await fetch(
            `${API}/api/resources?uploadedBy=${user.id}&page=${page}&limit=5`,
            { credentials: 'include', headers: getAuthHeaders() }
        );
        const data = await res.json();

        if (!append) list.innerHTML = '';

        if (res.ok) {
            if (data.resources.length === 0 && page === 1) {
                list.innerHTML = '<p style="color:#888;">You haven\'t uploaded any PDFs yet. <a href="resources-upload.html">Upload now →</a></p>';
            } else {
                data.resources.forEach(r => {
                    const div = document.createElement('div');
                    div.className = 'admin-notification-item';
                    div.style.display = 'flex';
                    div.style.justifyContent = 'space-between';
                    div.style.alignItems = 'center';
                    div.innerHTML = `
                        <div>
                            <strong>${r.branch} Sem-${r.semester} | ${r.subjectName}</strong> — Part-${r.partNumber}<br>
                            <small>📅 ${new Date(r.createdAt).toLocaleDateString('en-IN')} | ${r.isPinned ? '📌 Pinned' : '🕒 Not pinned'}</small>
                        </div>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;">
                            <button class="${r.isPinned ? 'cancel-btn' : 'edit-btn'}" onclick="profPin('${r._id}')">
                                ${r.isPinned ? 'Unpin' : '📌 Pin'}
                            </button>
                            <button class="delete-btn" onclick="profDelete('${r._id}')">🗑️ Delete</button>
                        </div>
                    `;
                    list.appendChild(div);
                });
            }

            profHasMore = data.pagination?.hasMore;
            const lmc = document.getElementById('prof-load-more-container');
            profHasMore ? lmc?.classList.remove('hidden') : lmc?.classList.add('hidden');
        }
    } catch(err) {
        list.innerHTML = '<p style="color:red;">❌ Error loading resources.</p>';
    } finally {
        profLoading = false;
    }
}

async function loadProfAlerts() {
    try {
        const res = await fetch(`${API}/api/resources/alerts`, {
            credentials: 'include', headers: getAuthHeaders()
        });
        const data = await res.json();
        if (res.ok && data.alerts && data.alerts.length > 0) {
            document.getElementById('prof-old-alert')?.classList.remove('hidden');
            const ol = document.getElementById('prof-old-list');
            if (ol) {
                ol.innerHTML = data.alerts.map(r =>
                    `<div>• ${r.branch} Sem-${r.semester} | ${r.subjectName} Part-${r.partNumber} 
                    — <button class="delete-btn" style="padding:2px 8px;font-size:11px;" onclick="profDelete('${r._id}')">Delete</button>
                    <button class="edit-btn" style="padding:2px 8px;font-size:11px;" onclick="profPin('${r._id}')">📌 Keep Forever</button></div>`
                ).join('');
            }
        }
    } catch(e) { /* silent */ }
}

async function profPin(id) {
    try {
        const res = await fetch(`${API}/api/resources/pin/${id}`, {
            method: 'PUT', credentials: 'include', headers: getAuthHeaders()
        });
        const data = await res.json();
        alert(data.message);
        profPage = 1;
        loadProfResources(1, false);
        loadProfAlerts();
    } catch { alert('❌ Network error.'); }
}

async function profDelete(id) {
    if (!confirm('Permanently delete this PDF from Drive and database?')) return;
    try {
        const res = await fetch(`${API}/api/resources/delete/${id}`, {
            method: 'DELETE', credentials: 'include', headers: getAuthHeaders()
        });
        const data = await res.json();
        alert(data.message);
        profPage = 1;
        loadProfResources(1, false);
        loadProfAlerts();
    } catch { alert('❌ Network error.'); }
}