/**
 * NITP Resources - Admin User Management
 * Search, Filter, Block, Unblock, Delete Users
 */

let usersCurrentPage = 1;
let usersIsLoading = false;
let usersHasMore = true;
let currentFilters = {};
let userToDelete = null;
let userToBlock = null;

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Format Date
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Load User Stats
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function loadUserStats() {
    try {
        const res = await fetch(`${API}/api/users/stats`, {
            credentials: 'include',
            headers: getAuthHeaders()
        });
        
        if (res.ok) {
            const data = await res.json();
            
            document.getElementById('stat-total-users').textContent = data.totalUsers;
            document.getElementById('stat-students').textContent = data.totalStudents;
            document.getElementById('stat-professors').textContent = data.totalProfessors;
            document.getElementById('stat-blocked').textContent = data.blockedUsers;
            document.getElementById('stat-today').textContent = data.todayRegistrations;
        }
    } catch (err) {
        console.error('Error loading stats:', err);
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Create User Card HTML
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function createUserCard(user) {
    const div = document.createElement('div');
    div.className = `user-card ${user.isBlocked ? 'user-blocked' : ''}`;
    div.dataset.id = user._id;
    
    const branchBadge = user.branch ? `<span class="branch-badge branch-${user.branch.toLowerCase()}">${user.branch}</span>` : '';
    const roleBadge = `<span class="role-badge role-${user.role.toLowerCase()}">${user.role}</span>`;
    const statusBadge = user.isBlocked 
        ? `<span class="status-badge status-blocked">🚫 BLOCKED</span>` 
        : `<span class="status-badge status-active">✅ Active</span>`;
    
    div.innerHTML = `
        <div class="user-card-header">
            <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
            <div class="user-basic-info">
                <h4 class="user-name">${user.username}</h4>
                <p class="user-email">${user.email}</p>
            </div>
            ${user.isBlocked ? '<div class="blocked-indicator"></div>' : ''}
        </div>
        
        <div class="user-badges">
            ${roleBadge}
            ${branchBadge}
            ${statusBadge}
        </div>
        
        <div class="user-meta">
            <span>📅 Joined: ${formatDate(user.createdAt)}</span>
            ${user.isVerified ? '<span>✅ Verified</span>' : '<span>⏳ Unverified</span>'}
        </div>
        
        <div class="user-extra-info">
            ${user.mobile ? `<span>📞  ${user.mobile}</span>` : ''}
            ${user.rollNo ? `<span>🎫 ${user.rollNo}</span>` : ''}
            ${user.passingYear ? `<span>🎓 ${user.passingYear}</span>` : ''}
        </div>
        
        ${user.isBlocked ? `
            <div class="block-info">
                <span>🚫 Blocked on: ${formatDate(user.blockedAt)}</span>
                ${user.blockReason ? `<span>Reason: ${user.blockReason}</span>` : ''}
            </div>
        ` : ''}
        
        <div class="user-actions">
            <button class="view-btn" onclick="viewUserDetails('${user._id}')">👁️ View</button>
            ${user.isBlocked 
                ? `<button class="unblock-btn" onclick="unblockUser('${user._id}', '${user.username}')">✅ Unblock</button>`
                : `<button class="block-btn" onclick="openBlockModal('${user._id}', '${user.username}', '${user.email}')">🚫 Block</button>`
            }
            <button class="delete-btn" onclick="openDeleteModal('${user._id}', '${user.username}', '${user.email}')">🗑️ Delete</button>
        </div>
    `;
    
    return div;
}
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Load Users
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function loadUsers(page = 1, append = false) {
    if (usersIsLoading) return;
    usersIsLoading = true;
    
    const list = document.getElementById('users-list');
    const loadMoreContainer = document.getElementById('users-load-more-container');
    const loadMoreBtn = document.getElementById('users-load-more-btn');
    const countBadge = document.getElementById('users-count-badge');
    
    if (!append) {
        list.innerHTML = '<p class="loading-text">⏳ Loading users...</p>';
    } else {
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML = '⏳ Loading...';
    }
    
    try {
        // Build query string
        let queryParams = new URLSearchParams({
            page: page,
            limit: 10
        });
        
        if (currentFilters.search) queryParams.append('search', currentFilters.search);
        if (currentFilters.branch) queryParams.append('branch', currentFilters.branch);
        if (currentFilters.role) queryParams.append('role', currentFilters.role);
        if (currentFilters.blocked) queryParams.append('blocked', currentFilters.blocked);
        if (currentFilters.afterDate) queryParams.append('afterDate', currentFilters.afterDate);
        if (currentFilters.beforeDate) queryParams.append('beforeDate', currentFilters.beforeDate);
        if (currentFilters.gender) queryParams.append('gender', currentFilters.gender);
        
        const res = await fetch(`${API}/api/users/all?${queryParams}`, {
            credentials: 'include',
            headers: getAuthHeaders()
        });
        
        const data = await res.json();
        
        if (res.ok) {
            if (!append) {
                list.innerHTML = '';
            }
            
            countBadge.textContent = `(${data.pagination.totalUsers} total)`;
            
            if (data.users.length === 0 && page === 1) {
                list.innerHTML = '<p class="no-users">📭 No users found matching your criteria</p>';
                loadMoreContainer.classList.add('hidden');
            } else {
                data.users.forEach(user => {
                    list.appendChild(createUserCard(user));
                });
                
                usersHasMore = data.pagination.hasMore;
                
                if (usersHasMore) {
                    loadMoreContainer.classList.remove('hidden');
                } else {
                    loadMoreContainer.classList.add('hidden');
                }
            }
        } else {
            list.innerHTML = `<p class="error-text">❌ ${data.message}</p>`;
        }
        
    } catch (err) {
        console.error(err);
        list.innerHTML = '<p class="error-text">❌ Network error</p>';
    } finally {
        usersIsLoading = false;
        if (loadMoreBtn) {
            loadMoreBtn.disabled = false;
            loadMoreBtn.innerHTML = '📥 Load More Users';
        }
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Search & Filter Functions
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function applyFilters() {
    currentFilters = {
        search: document.getElementById('user-search-input').value.trim(),
        branch: document.getElementById('filter-branch').value,
        role: document.getElementById('filter-role').value,
        blocked: document.getElementById('filter-blocked').value,
        afterDate: document.getElementById('filter-after-date').value,
        beforeDate: document.getElementById('filter-before-date').value,
        gender: document.getElementById('filter-gender').value
    };
    
    usersCurrentPage = 1;
    loadUsers(1, false);
}

function clearFilters() {
    document.getElementById('user-search-input').value = '';
    document.getElementById('filter-branch').value = '';
    document.getElementById('filter-role').value = 'all';
    document.getElementById('filter-blocked').value = '';
    document.getElementById('filter-after-date').value = '';
    document.getElementById('filter-before-date').value = '';
    document.getElementById('filter-gender').value = '';
    
    currentFilters = {};
    usersCurrentPage = 1;
    loadUsers(1, false);
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// View User Details
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function viewUserDetails(userId) {
    const modal = document.getElementById('user-modal');
    const detailsDiv = document.getElementById('modal-user-details');
    
    detailsDiv.innerHTML = '<p class="loading-text">⏳ Loading user details...</p>';
    modal.classList.remove('hidden');
    
    try {
        const res = await fetch(`${API}/api/users/${userId}`, {
            credentials: 'include',
            headers: getAuthHeaders()
        });
        
        const data = await res.json();
        
        if (res.ok) {
            const user = data.user;
            
            detailsDiv.innerHTML = `
                <div class="user-detail-header ${user.isBlocked ? 'blocked' : ''}">
                    <div class="user-detail-avatar">${user.username.charAt(0).toUpperCase()}</div>
                    <div>
                        <h2>${user.username}</h2>
                        ${user.isBlocked ? '<span class="blocked-badge-large">🚫 BLOCKED</span>' : '<span class="active-badge-large">✅ ACTIVE</span>'}
                    </div>
                </div>
                
                <div class="user-detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">📧 Email</span>
                        <span class="detail-value">${user.email}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">👤 Role</span>
                        <span class="detail-value">${user.role}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">🏢 Branch</span>
                        <span class="detail-value">${user.branch || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">✅ Verified</span>
                        <span class="detail-value">${user.isVerified ? 'Yes' : 'No'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">📅 Registered</span>
                        <span class="detail-value">${formatDate(user.createdAt)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">🔄 Last Updated</span>
                        <span class="detail-value">${formatDate(user.updatedAt)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">📱 Mobile</span>
                        <span class="detail-value">${user.mobile || 'Not added'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">🎫 Roll No.</span>
                        <span class="detail-value">${user.rollNo || 'Not added'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">🎓 Passing Year</span>
                        <span class="detail-value">${user.passingYear || 'Not added'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">⚧️ Gender</span>
                        <span class="detail-value">${user.gender || 'Not added'}</span>
                    </div>
                    ${user.lastSeenNotificationTime ? `
                        <div class="detail-item">
                            <span class="detail-label">🔔 Last Seen Notifications</span>
                            <span class="detail-value">${formatDate(user.lastSeenNotificationTime)}</span>
                        </div>
                    ` : ''}
                    ${user.lastVisitedAt ? `
                        <div class="detail-item">
                            <span class="detail-label">🕐 Last Visited</span>
                            <span class="detail-value">${formatDate(user.lastVisitedAt)}</span>
                        </div>
                    ` : `
                        <div class="detail-item">
                            <span class="detail-label">🕐 Last Visited</span>
                            <span class="detail-value">Never</span>
                        </div>
                    `}
                </div>
                
                ${user.isBlocked ? `
                    <div class="block-details">
                        <h4>🚫 Block Information</h4>
                        <p><strong>Blocked At:</strong> ${formatDate(user.blockedAt)}</p>
                        <p><strong>Reason:</strong> ${user.blockReason || 'No reason provided'}</p>
                        ${user.blockedBy ? `<p><strong>Blocked By:</strong> ${user.blockedBy.username} (${user.blockedBy.email})</p>` : ''}
                    </div>
                ` : ''}
                
                <div class="modal-actions">
                    ${user.isBlocked 
                        ? `<button class="unblock-btn" onclick="unblockUser('${user._id}', '${user.username}'); closeUserModal();">✅ Unblock User</button>`
                        : `<button class="block-btn" onclick="closeUserModal(); openBlockModal('${user._id}', '${user.username}', '${user.email}');">🚫 Block User</button>`
                    }
                    <button class="delete-btn" onclick="closeUserModal(); openDeleteModal('${user._id}', '${user.username}', '${user.email}');">🗑️ Delete User</button>
                </div>
            `;
        } else {
            detailsDiv.innerHTML = `<p class="error-text">❌ ${data.message}</p>`;
        }
        
    } catch (err) {
        console.error(err);
        detailsDiv.innerHTML = '<p class="error-text">❌ Network error</p>';
    }
}

function closeUserModal() {
    document.getElementById('user-modal').classList.add('hidden');
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Block User
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function openBlockModal(userId, username, email) {
    userToBlock = { id: userId, username, email };
    document.getElementById('block-user-info').innerHTML = `User: <strong>${username}</strong> (${email})`;
    document.getElementById('block-reason-input').value = '';
    document.getElementById('block-modal').classList.remove('hidden');
}

function closeBlockModal() {
    document.getElementById('block-modal').classList.add('hidden');
    userToBlock = null;
}

async function confirmBlockUser() {
    if (!userToBlock) return;
    
    const reason = document.getElementById('block-reason-input').value.trim();
    const btn = document.getElementById('confirm-block-btn');
    
    btn.disabled = true;
    btn.innerHTML = '⏳ Blocking...';
    
    try {
        const res = await fetch(`${API}/api/users/block/${userToBlock.id}`, {
            method: 'POST',
            credentials: 'include',
            headers: getAuthHeaders(),
            body: JSON.stringify({ reason })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            alert(`✅ ${data.message}`);
            closeBlockModal();
            loadUsers(usersCurrentPage, false);
            loadUserStats();
        } else {
            alert(`❌ ${data.message}`);
        }
        
    } catch (err) {
        console.error(err);
        alert('❌ Network error. Try again.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🚫 Block User';
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Unblock User
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function unblockUser(userId, username) {
    if (!confirm(`Are you sure you want to unblock ${username}?`)) return;
    
    try {
        const res = await fetch(`${API}/api/users/unblock/${userId}`, {
            method: 'POST',
            credentials: 'include',
            headers: getAuthHeaders()
        });
        
        const data = await res.json();
        
        if (res.ok) {
            alert(`✅ ${data.message}`);
            loadUsers(usersCurrentPage, false);
            loadUserStats();
        } else {
            alert(`❌ ${data.message}`);
        }
        
    } catch (err) {
        console.error(err);
        alert('❌ Network error. Try again.');
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Delete User
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function openDeleteModal(userId, username, email) {
    userToDelete = { id: userId, username, email };
    document.getElementById('delete-user-info').innerHTML = `User: <strong>${username}</strong> (${email})`;
    document.getElementById('delete-modal').classList.remove('hidden');
}

function closeDeleteModal() {
    document.getElementById('delete-modal').classList.add('hidden');
    userToDelete = null;
}

async function confirmDeleteUser() {
    if (!userToDelete) return;
    
    const btn = document.getElementById('confirm-delete-btn');
    btn.disabled = true;
    btn.innerHTML = '⏳ Deleting...';
    
    try {
        const res = await fetch(`${API}/api/users/delete/${userToDelete.id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: getAuthHeaders()
        });
        
        const data = await res.json();
        
        if (res.ok) {
            alert(`✅ ${data.message}`);
            closeDeleteModal();
            loadUsers(usersCurrentPage, false);
            loadUserStats();
        } else {
            alert(`❌ ${data.message}`);
        }
        
    } catch (err) {
        console.error(err);
        alert('❌ Network error. Try again.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🗑️ Yes, Delete';
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Initialize on Page Load
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

document.addEventListener('DOMContentLoaded', function() {
    // Load stats
    if (document.getElementById('admin-stats')) {
        loadUserStats();
    }
    
    // Search button
    const searchBtn = document.getElementById('user-search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', applyFilters);
    }
    
    // Search on Enter key
    const searchInput = document.getElementById('user-search-input');
    if (searchInput) {
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    }
    
    // Apply filters button
    const applyBtn = document.getElementById('apply-filters-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', applyFilters);
    }
    
    // Clear filters button
    const clearBtn = document.getElementById('clear-filters-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearFilters);
    }
    
    // Load more users button
    const loadMoreBtn = document.getElementById('users-load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            if (usersHasMore && !usersIsLoading) {
                usersCurrentPage++;
                loadUsers(usersCurrentPage, true);
            }
        });
    }
    
    // Confirm block button
    const confirmBlockBtn = document.getElementById('confirm-block-btn');
    if (confirmBlockBtn) {
        confirmBlockBtn.addEventListener('click', confirmBlockUser);
    }
    
    // Confirm delete button
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteUser);
    }
    
    // Close modals on outside click
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.add('hidden');
        }
    });
    
    // Initial load
    if (document.getElementById('users-list')) {
        loadUsers(1, false);
    }
});