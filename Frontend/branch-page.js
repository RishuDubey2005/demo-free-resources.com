/**
 * NITP - Branch Page Dynamic Engine
 * Used by: me1-8.html, ee1-8.html, ce1-8.html
 * Call: initBranchPage('ME', 1)
 */

const API_BASE = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://nitp-free-resources-com-backend.onrender.com';

// Color palette cycling per subject
const SUBJECT_COLORS = [
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#a18cd1', '#fbc2eb'],
    ['#667eea', '#764ba2'],
    ['#f7971e', '#ffd200'],
    ['#11998e', '#38ef7d'],
    ['#ee0979', '#ff6a00'],
    ['#06beb6', '#48b1bf'],
    ['#c94b4b', '#4b134f'],
    ['#ffecd2', '#fcb69f'],
];

const subjectState = {};

async function initBranchPage(branch, semester) {
    const container = document.getElementById('subjects-container');
    const subjects = (SUBJECTS_DATA[branch] && SUBJECTS_DATA[branch][semester]) || [];

    if (subjects.length === 0) {
        container.innerHTML = '<p style="padding:20px;color:#888;text-align:center;">📭 No subjects data available yet.</p>';
        return;
    }

    // Pre-fetch PDF counts for badge display
    let pdfCounts = {};
    try {
        const res = await fetch(
            `${API_BASE}/api/resources?branch=${branch}&semester=${semester}&limit=200`,
            { credentials: 'include' }
        );
        if (res.ok) {
            const data = await res.json();
            data.resources.forEach(r => {
                pdfCounts[r.subjectCode] = (pdfCounts[r.subjectCode] || 0) + 1;
            });
        }
    } catch (e) { /* silent */ }

    // Build styled subject cards
    subjects.forEach((subject, idx) => {
        const [c1, c2] = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
        const count = pdfCounts[subject.code] || 0;
        const isPYQ = subject.code === 'PYQ';

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'margin: 18px 14px;';

        wrapper.innerHTML = `
            <div class="subject-card" id="card-${subject.code}"
                style="background: linear-gradient(135deg, ${c1}, ${c2});
                       border-radius:16px; overflow:hidden;
                       box-shadow: 0 6px 20px rgba(0,0,0,0.18);
                       transition: transform 0.25s cubic-bezier(0.175,0.885,0.32,1.275),
                                   box-shadow 0.25s ease;
                       cursor:pointer;"
                onmouseenter="this.style.transform='translateY(-5px) scale(1.02)';this.style.boxShadow='0 14px 35px rgba(0,0,0,0.28)';"
                onmouseleave="this.style.transform='translateY(0) scale(1)';this.style.boxShadow='0 6px 20px rgba(0,0,0,0.18)';">

                <!-- Header row (clickable) -->
                <div class="subject-card-header"
                    onclick="toggleSubject('${subject.code}', '${branch}', ${semester})"
                    style="display:flex; justify-content:space-between; align-items:center;
                           padding:18px 20px; user-select:none;">
                    <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:0;">
                        <span style="font-size:24px; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.2));">
                            ${isPYQ ? '📝' : '📘'}
                        </span>
                        <div style="min-width:0;">
                            <div style="font-weight:700; color:#fff; font-size:14.5px;
                                        text-shadow:0 1px 4px rgba(0,0,0,0.35);
                                        word-break:break-word; line-height:1.4;">
                                ${subject.code} — ${subject.name}
                            </div>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px; flex-shrink:0; margin-left:12px;">
                        ${count > 0
                            ? `<span style="background:rgba(255,255,255,0.28);
                                           backdrop-filter:blur(4px);
                                           color:#fff; border-radius:20px;
                                           padding:3px 12px; font-size:12px;
                                           font-weight:700; white-space:nowrap;
                                           border:1px solid rgba(255,255,255,0.4);
                                           box-shadow:0 2px 8px rgba(0,0,0,0.15);">
                                   ✅ ${count} PDF${count > 1 ? 's' : ''}
                               </span>`
                            : `<span style="background:rgba(255,255,255,0.15);
                                           color:rgba(255,255,255,0.8);
                                           border-radius:20px; padding:3px 10px;
                                           font-size:11px; white-space:nowrap;
                                           border:1px solid rgba(255,255,255,0.25);">
                                   No PDFs yet
                               </span>`}
                        <span id="arrow-${subject.code}"
                            style="color:#fff; font-size:20px;
                                   transition:transform 0.3s ease;
                                   filter:drop-shadow(0 1px 3px rgba(0,0,0,0.3));">▼</span>
                    </div>
                </div>

                <!-- Expandable content -->
                <div id="items-${subject.code}"
                    style="display:none; background:rgba(255,255,255,0.97);
                           border-radius:0 0 16px 16px; margin:0;
                           border-top: 2px solid rgba(255,255,255,0.4);">
                    <div id="content-${subject.code}" style="padding:16px 20px;">
                        <p style="color:#aaa; font-size:13px; margin:0;">⏳ Loading...</p>
                    </div>
                    <div id="load-more-${subject.code}" class="load-more-container hidden"
                        style="padding:0 20px 16px;">
                        <button class="load-more-btn"
                            onclick="loadMorePDFs('${subject.code}','${branch}',${semester})">
                            📥 Load More
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(wrapper);

        subjectState[subject.code] = {
            page: 1, hasMore: false, loaded: false, open: false
        };
    });
}

// ── Toggle open/close ──
async function toggleSubject(code, branch, semester) {
    const itemsEl = document.getElementById(`items-${code}`);
    const arrowEl = document.getElementById(`arrow-${code}`);
    const state = subjectState[code];

    if (state.open) {
        itemsEl.style.display = 'none';
        arrowEl.style.transform = 'rotate(0deg)';
        state.open = false;
    } else {
        itemsEl.style.display = 'block';
        arrowEl.style.transform = 'rotate(180deg)';
        state.open = true;
        if (!state.loaded) {
            await loadSubjectPDFs(code, branch, semester, 1, false);
            state.loaded = true;
        }
    }
}

// ── Load PDFs for a subject ──
async function loadSubjectPDFs(code, branch, semester, page = 1, append = false) {
    const contentEl = document.getElementById(`content-${code}`);
    const loadMoreEl = document.getElementById(`load-more-${code}`);
    const state = subjectState[code];

    if (!append) {
        contentEl.innerHTML = '<p style="color:#aaa;font-size:13px;margin:0;">⏳ Loading PDFs...</p>';
    }

    try {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // PYQ always scoped by branch+semester so different sems don't mix
        const queryCode = `branch=${branch}&semester=${semester}&subjectCode=${encodeURIComponent(code)}`;

        const res = await fetch(
            `${API_BASE}/api/resources?${queryCode}&page=${page}&limit=5`,
            { credentials: 'include', headers }
        );
        const data = await res.json();

        if (!append) contentEl.innerHTML = '';

        if (res.ok) {
            if (data.resources.length === 0 && page === 1) {
                contentEl.innerHTML = `
                    <div style="text-align:center; padding:16px 0; color:#aaa;">
                        <div style="font-size:28px; margin-bottom:6px;">📭</div>
                        <p style="margin:0; font-size:13px;">No study materials uploaded yet.</p>
                        <p style="margin:4px 0 0; font-size:12px; color:#bbb;">
                            Professors can upload PDFs from their profile.
                        </p>
                    </div>`;
            } else {
                data.resources.forEach(r => {
                    contentEl.appendChild(buildUserPDFCard(r));
                });
            }

            state.hasMore = data.pagination?.hasMore || false;
            state.page = page;
            state.hasMore
                ? loadMoreEl.classList.remove('hidden')
                : loadMoreEl.classList.add('hidden');
        } else {
            contentEl.innerHTML = '<p style="color:red;font-size:13px;">❌ Failed to load.</p>';
        }
    } catch (err) {
        contentEl.innerHTML = '<p style="color:red;font-size:13px;">❌ Network error.</p>';
    }
}

async function loadMorePDFs(code, branch, semester) {
    const state = subjectState[code];
    if (!state.hasMore) return;
    await loadSubjectPDFs(code, branch, semester, state.page + 1, true);
}

// ── Build PDF card for students ──
function buildUserPDFCard(r) {
    const div = document.createElement('div');
    div.style.cssText = `
        display:flex; justify-content:space-between; align-items:center;
        padding:10px 0; border-bottom:1px solid #f0f0f0;
        flex-wrap:wrap; gap:8px;
    `;

    const date = new Date(r.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });

    div.innerHTML = `
        <div style="flex:1; min-width:0;">
            <div style="font-weight:600; font-size:14px; color:#333;">
                Part-${r.partNumber}
                ${r.isPinned ? '<span style="font-size:11px;color:#4f46e5;"> 📌</span>' : ''}
            </div>
            <div style="font-size:12px; color:#888; margin-top:2px;">
                📅 ${date} &nbsp;|&nbsp; 👤 ${r.uploadedBy?.username || 'NITP'}
            </div>
        </div>
        <button class="link-btn" onclick="openDriveFile('${r.driveFileId}')"
            style="white-space:nowrap; padding:6px 14px; border-radius:8px;
                   background:linear-gradient(135deg,#4facfe,#00f2fe);
                   color:#fff; border:none; cursor:pointer; font-weight:600; font-size:13px;">
            👁️ View
        </button>
    `;
    return div;
}

// ── Open PDF directly in Google Drive viewer ──
// No direct share link exposed — uses Drive file ID redirected via backend serve
function openDriveFile(driveFileId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('🔒 Please login to view study materials.');
        window.location.href = 'login.html';
        return;
    }
    // Opens Google Drive's own viewer — same look as Drive folder PDF view
    const driveViewUrl = `https://drive.google.com/file/d/${driveFileId}/view`;
    window.open(driveViewUrl, '_blank');
}
