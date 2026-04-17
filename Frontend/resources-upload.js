/**
 * NITP Resources - Upload Panel JS
 * Professor / Admin only
 */

let resCurrentPage = 1;
let resHasMore = true;
let resIsLoading = false;
let currentFilter = {};

// ── On page load: auth check ──
document.addEventListener('DOMContentLoaded', function () {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user || (user.role !== 'Professor' && user.role !== 'Admin')) {
        document.getElementById('upload-section').classList.add('hidden');
        document.getElementById('access-denied').classList.remove('hidden');
    }

    // Drag-and-drop styling
    const zone = document.getElementById('drop-zone');
    if (zone) {
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type === 'application/pdf') {
                document.getElementById('res-file').files = e.dataTransfer.files;
                onFileSelected({ files: e.dataTransfer.files });
            } else {
                alert('Only PDF files are allowed.');
            }
        });
    }
});

// ── File selected indicator ──
function onFileSelected(input) {
    const nameEl = document.getElementById('file-selected-name');
    const file = input.files && input.files[0];
    if (file) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        nameEl.textContent = `✅ ${file.name} (${sizeMB} MB)`;
    } else {
        nameEl.textContent = '';
    }
}

// ── Branch changed ──
function onBranchChange() {
    const branch = document.getElementById('res-branch').value;
    const semEl  = document.getElementById('res-semester');
    const subEl  = document.getElementById('res-subject');

    semEl.disabled = !branch;
    semEl.value = '';
    subEl.disabled = true;
    subEl.innerHTML = '<option value="">— Choose Subject —</option>';

    document.getElementById('upload-card').classList.add('hidden');
    document.getElementById('existing-card').classList.add('hidden');
    setStep(1);
}

// ── Semester changed → populate subjects ──
function onSemesterChange() {
    const branch   = document.getElementById('res-branch').value;
    const semester = parseInt(document.getElementById('res-semester').value);
    const subEl    = document.getElementById('res-subject');

    subEl.innerHTML = '<option value="">— Choose Subject —</option>';
    subEl.disabled = true;

    if (!branch || !semester) return;

    const subjects = (SUBJECTS_DATA[branch] && SUBJECTS_DATA[branch][semester]) || [];
    subjects.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.code;
        opt.textContent = `${s.code} — ${s.name}`;
        opt.dataset.name = s.name;
        subEl.appendChild(opt);
    });

    subEl.disabled = subjects.length === 0;
    document.getElementById('upload-card').classList.add('hidden');
    document.getElementById('existing-card').classList.add('hidden');
    setStep(1);
}

// ── Apply filter ──
async function applyFilter() {
    const branch  = document.getElementById('res-branch').value;
    const semester = document.getElementById('res-semester').value;
    const subEl   = document.getElementById('res-subject');
    const subjectCode = subEl.value;
    const subjectName = subEl.options[subEl.selectedIndex]?.dataset?.name || subjectCode;

    if (!branch || !semester || !subjectCode) {
        alert('Please select Branch, Semester, and Subject.');
        return;
    }

    // ── Frontend branch restriction for Professors ──
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'Professor' && user.email) {
        const match = user.email.match(/\.([a-z]{2})@nitp\.ac\.in$/i);
        const profBranch = match ? match[1].toUpperCase() : null;
        const isTestProf = user.email === (window.TEST_PROF_EMAIL || '');
        if (!isTestProf && profBranch && profBranch !== branch) {
            alert(`❌ Access denied. You can only upload resources for your branch (${profBranch}).`);
            return;
        }
    }

    currentFilter = { branch, semester, subjectCode, subjectName };

    // Show upload + existing cards
    document.getElementById('upload-card').classList.remove('hidden');
    document.getElementById('existing-card').classList.remove('hidden');
    document.getElementById('res-upload-title').textContent = `${subjectCode} — ${subjectName}`;

    setStep(2);
    resCurrentPage = 1;
    await loadExisting(1, false);
}

// ── Stepper UI ──
function setStep(n) {
    [1, 2, 3].forEach(i => {
        const el = document.getElementById(`step${i}-indicator`);
        if (!el) return;
        el.classList.remove('active', 'done');
        if (i < n)  el.classList.add('done');
        if (i === n) el.classList.add('active');
    });
}

// ── Load existing PDFs ──
async function loadExisting(page = 1, append = false) {
    if (resIsLoading) return;
    resIsLoading = true;

    const list = document.getElementById('res-existing-list');
    const { branch, semester, subjectCode } = currentFilter;

    if (!append) list.innerHTML = '<p style="color:#aaa;font-size:13px;">⏳ Loading...</p>';

    try {
        const res = await fetch(
            `${API}/api/resources?branch=${branch}&semester=${semester}&subjectCode=${encodeURIComponent(subjectCode)}&page=${page}&limit=5`,
            { credentials: 'include', headers: getAuthHeaders() }
        );
        const data = await res.json();

        if (!append) list.innerHTML = '';

        if (res.ok) {
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            if (data.resources.length === 0 && page === 1) {
                list.innerHTML = '<p style="color:#aaa;font-size:13px;text-align:center;padding:12px 0;">📭 No PDFs yet for this subject.</p>';
            } else {
                data.resources.forEach(r => {
                    const canDelete = user.role === 'Admin' ||
                        (r.uploadedBy && r.uploadedBy._id === user.id);
                    list.appendChild(buildResourceCard(r, canDelete));
                });
            }

            const total = data.pagination?.total || 0;
            document.getElementById('res-part-info').textContent =
                total > 0
                    ? `📦 ${total} part(s) already uploaded. Your file will be Part-${total + 1}.`
                    : `📦 No uploads yet. Your file will be Part-1.`;

            resHasMore = data.pagination?.hasMore || false;
            const lmc = document.getElementById('res-load-more-container');
            resHasMore ? lmc.classList.remove('hidden') : lmc.classList.add('hidden');
        } else {
            list.innerHTML = '<p style="color:red;font-size:13px;">❌ Error loading resources.</p>';
        }
    } catch (err) {
        list.innerHTML = '<p style="color:red;font-size:13px;">❌ Network error.</p>';
    } finally {
        resIsLoading = false;
    }
}

async function loadMoreExisting() {
    if (resHasMore && !resIsLoading) {
        resCurrentPage++;
        await loadExisting(resCurrentPage, true);
    }
}

// ── Build resource card ──
function buildResourceCard(r, canDelete) {
    const div = document.createElement('div');
    div.className = 'existing-pdf-row';

    const date = new Date(r.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });

    div.innerHTML = `
        <div style="flex:1; min-width:0;">
            <span class="pdf-part-badge">Part-${r.partNumber}</span>
            <span style="font-size:13px; color:#555;">
                ${r.isPinned ? '📌 ' : ''}${r.uploadedBy?.username || 'NITP'}
            </span><br>
            <small style="color:#bbb; font-size:11px;">📅 ${date}</small>
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="btn-sm btn-view" onclick="openDriveFile('${r.driveFileId}')">👁️ View</button>
            <button class="btn-sm btn-pin"  onclick="pinPDF('${r._id}')">
                ${r.isPinned ? 'Unpin' : '📌 Pin'}
            </button>
            ${canDelete
                ? `<button class="btn-sm btn-delete" onclick="deletePDF('${r._id}')">🗑️</button>`
                : ''}
        </div>
    `;
    return div;
}

// ── Open PDF in Google Drive viewer (same as Drive folder look) ──
function openDriveFile(driveFileId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('🔒 Please login to view PDFs.');
        window.location.href = 'login.html';
        return;
    }
    window.open(`https://drive.google.com/file/d/${driveFileId}/view`, '_blank');
}

// ── Upload PDF ──
async function uploadPDF() {
    const { branch, semester, subjectCode, subjectName } = currentFilter;
    const fileInput = document.getElementById('res-file');
    const status = document.getElementById('res-upload-status');
    const btn = document.getElementById('res-upload-btn');

    if (!fileInput.files[0]) {
        status.style.color = '#ef4444';
        status.textContent = '❌ Please select a PDF file.';
        return;
    }

    const file = fileInput.files[0];
    if (file.size > 20 * 1024 * 1024) {
        status.style.color = '#ef4444';
        status.innerHTML = '❌ File too large (max 20MB). Compress at <a href="https://www.ilovepdf.com/compress_pdf" target="_blank">ilovepdf.com</a>';
        return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Uploading...';
    status.textContent = '';

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('branch', branch);
    formData.append('semester', semester);
    formData.append('subjectCode', subjectCode);
    formData.append('subjectName', subjectName);

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API}/api/resources/upload`, {
            method: 'POST',
            credentials: 'include',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData
        });
        const data = await res.json();

        if (res.ok) {
            status.style.color = '#10b981';
            status.textContent = '✅ ' + data.message;
            fileInput.value = '';
            document.getElementById('file-selected-name').textContent = '';
            setStep(3);
            resCurrentPage = 1;
            await loadExisting(1, false);
        } else {
            status.style.color = '#ef4444';
            status.textContent = '❌ ' + data.message;
            setStep(2);
        }
    } catch (err) {
        status.style.color = '#ef4444';
        status.textContent = '❌ Network error. Try again.';
    } finally {
        btn.disabled = false;
        btn.textContent = '📤 Upload PDF';
    }
}

// ── Pin / Unpin ──
async function pinPDF(id) {
    try {
        const res = await fetch(`${API}/api/resources/pin/${id}`, {
            method: 'PUT', credentials: 'include', headers: getAuthHeaders()
        });
        const data = await res.json();
        alert(data.message);
        resCurrentPage = 1;
        await loadExisting(1, false);
    } catch { alert('❌ Network error.'); }
}

// ── Delete ──
async function deletePDF(id) {
    if (!confirm('Permanently delete this PDF from Drive and database?')) return;
    try {
        const res = await fetch(`${API}/api/resources/delete/${id}`, {
            method: 'DELETE', credentials: 'include', headers: getAuthHeaders()
        });
        const data = await res.json();
        alert(data.message);
        resCurrentPage = 1;
        await loadExisting(1, false);
    } catch { alert('❌ Network error.'); }
}
