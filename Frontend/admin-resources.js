/**
 * Admin Profile - Resource Management
 */

let adminResPage = 1;
let adminResHasMore = true;
let adminResLoading = false;
let adminResFilter = {};

document.addEventListener('DOMContentLoaded', function() {
    loadAdminAlerts();

    document.getElementById('admin-res-filter-btn')?.addEventListener('click', function() {
        adminResFilter = {
            branch: document.getElementById('admin-res-branch').value,
            semester: document.getElementById('admin-res-semester').value
        };
        adminResPage = 1;
        loadAdminResources(1, false);
    });

    document.getElementById('admin-res-clear-btn')?.addEventListener('click', function() {
        adminResFilter = {};
        document.getElementById('admin-res-branch').value = '';
        document.getElementById('admin-res-semester').value = '';
        document.getElementById('admin-resources-list').innerHTML = '<p style="color:#888;">Use filter above to view resources.</p>';
        document.getElementById('admin-res-load-more-container')?.classList.add('hidden');
    });

    document.getElementById('admin-res-load-more-btn')?.addEventListener('click', function() {
        if (adminResHasMore && !adminResLoading) {
            adminResPage++;
            loadAdminResources(adminResPage, true);
        }
    });
});

async function loadAdminResources(page = 1, append = false) {
    if (adminResLoading) return;
    adminResLoading = true;

    const list = document.getElementById('admin-resources-list');
    if (!list) return;
    if (!append) list.innerHTML = '<p>⏳ Loading...</p>';

    const params = new URLSearchParams({ page, limit: 10, ...adminResFilter });

    try {
        const res = await fetch(`${API}/api/resources?${params.toString()}`, {
            credentials: 'include', headers: getAuthHeaders()
        });
        const data = await res.json();

        if (!append) list.innerHTML = '';

        if (res.ok) {
            if (data.resources.length === 0 && page === 1) {
                list.innerHTML = '<p style="color:#888;">No resources found for this filter.</p>';
            } else {
                data.resources.forEach(r => {
                    const div = document.createElement('div');
                    div.className = 'admin-notification-item';
                    div.style.display = 'flex';
                    div.style.justifyContent = 'space-between';
                    div.style.alignItems = 'center';
                    div.innerHTML = `
                        <div>
                            <strong>${r.branch} Sem-${r.semester} | ${r.subjectName} (${r.subjectCode})</strong> — Part-${r.partNumber}<br>
                            <small>👤 ${r.uploadedBy?.username || 'Unknown'} | 📅 ${new Date(r.createdAt).toLocaleDateString('en-IN')} | ${r.isPinned ? '📌 Pinned' : '🕒 Not pinned'}</small>
                        </div>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;">
                            <button class="${r.isPinned ? 'cancel-btn' : 'edit-btn'}" onclick="adminPinRes('${r._id}')">
                                ${r.isPinned ? 'Unpin' : '📌 Pin'}
                            </button>
                            <button class="delete-btn" onclick="adminDeleteRes('${r._id}')">🗑️ Delete</button>
                        </div>
                    `;
                    list.appendChild(div);
                });
            }

            adminResHasMore = data.pagination?.hasMore;
            const lmc = document.getElementById('admin-res-load-more-container');
            adminResHasMore ? lmc?.classList.remove('hidden') : lmc?.classList.add('hidden');
        }
    } catch(err) {
        list.innerHTML = '<p style="color:red;">❌ Error loading resources.</p>';
    } finally {
        adminResLoading = false;
    }
}

async function loadAdminAlerts() {
    try {
        const res = await fetch(`${API}/api/resources/alerts`, {
            credentials: 'include', headers: getAuthHeaders()
        });
        const data = await res.json();
        if (res.ok && data.alerts?.length > 0) {
            document.getElementById('admin-old-alert')?.classList.remove('hidden');
            const ol = document.getElementById('admin-old-list');
            if (ol) {
                ol.innerHTML = data.alerts.map(r =>
                    `<div>• ${r.branch} Sem-${r.semester} | ${r.subjectName} Part-${r.partNumber} — by ${r.uploadedBy?.username || '?'}
                    <button class="delete-btn" style="padding:2px 8px;font-size:11px;" onclick="adminDeleteRes('${r._id}')">Delete</button>
                    <button class="edit-btn" style="padding:2px 8px;font-size:11px;" onclick="adminPinRes('${r._id}')">📌 Keep</button></div>`
                ).join('');
            }
        }
    } catch(e) { /* silent */ }
}

async function adminPinRes(id) {
    try {
        const res = await fetch(`${API}/api/resources/pin/${id}`, {
            method: 'PUT', credentials: 'include', headers: getAuthHeaders()
        });
        const data = await res.json();
        alert(data.message);
        loadAdminResources(1, false);
        loadAdminAlerts();
    } catch { alert('❌ Network error.'); }
}

async function adminDeleteRes(id) {
    if (!confirm('Permanently delete this PDF from Drive and database?')) return;
    try {
        const res = await fetch(`${API}/api/resources/delete/${id}`, {
            method: 'DELETE', credentials: 'include', headers: getAuthHeaders()
        });
        const data = await res.json();
        alert(data.message);
        adminResPage = 1;
        loadAdminResources(1, false);
        loadAdminAlerts();
    } catch { alert('❌ Network error.'); }
}