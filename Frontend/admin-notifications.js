/**
 * NITP Resources - Admin Notification Management
 * Create, Edit, Delete notifications
 */

let adminCurrentPage = 1;
let adminIsLoading = false;
let adminHasMore = true;

// Format timestamp
function formatAdminTimestamp(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Create notification item for admin view
function createAdminNotificationItem(notification) {
    const div = document.createElement('div');
    div.className = 'admin-notification-item';
    div.dataset.id = notification._id;
    
    div.innerHTML = `
        <div class="admin-notif-content">
            <span class="admin-notif-time">🕐 ${formatAdminTimestamp(notification.createdAt)}</span>
            <p class="admin-notif-message" id="msg-${notification._id}">${notification.message}</p>
        </div>
        <div class="admin-notif-actions">
            <button class="edit-btn" onclick="editNotification('${notification._id}')">✏️ Edit</button>
            <button class="delete-btn" onclick="deleteNotification('${notification._id}')">🗑️ Delete</button>
        </div>
        <div class="edit-section hidden" id="edit-section-${notification._id}">
            <textarea id="edit-input-${notification._id}" rows="2">${notification.message}</textarea>
            <div class="edit-buttons">
                <button class="save-btn" onclick="saveNotification('${notification._id}')">💾 Save</button>
                <button class="cancel-btn" onclick="cancelEdit('${notification._id}')">❌ Cancel</button>
            </div>
        </div>
    `;
    
    return div;
}

// Load admin notifications
async function loadAdminNotifications(page = 1, append = false) {
    if (adminIsLoading) return;
    adminIsLoading = true;
    
    const list = document.getElementById('admin-notification-list');
    const loadMoreContainer = document.getElementById('admin-load-more-container');
    const loadMoreBtn = document.getElementById('admin-load-more-btn');
    
    if (!append) {
        list.innerHTML = '<p class="loading-text">⏳ Loading notifications...</p>';
    } else {
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML = '⏳ Loading...';
    }
    
    try {
        const res = await fetch(`${API}/api/notifications?page=${page}&limit=10`, {
            credentials: 'include',
            headers: getAuthHeaders()
        });
        
        const data = await res.json();
        
        if (res.ok) {
            if (!append) {
                list.innerHTML = '';
            }
            
            if (data.notifications.length === 0 && page === 1) {
                list.innerHTML = '<p class="no-notifications-admin">📭 No notifications yet. Create one above!</p>';
                loadMoreContainer.classList.add('hidden');
            } else {
                data.notifications.forEach(notif => {
                    list.appendChild(createAdminNotificationItem(notif));
                });
                
                adminHasMore = data.pagination.hasMore;
                
                if (adminHasMore) {
                    loadMoreContainer.classList.remove('hidden');
                } else {
                    loadMoreContainer.classList.add('hidden');
                }
            }
        } else {
            list.innerHTML = '<p class="error-text">❌ Failed to load notifications</p>';
        }
        
    } catch (err) {
        console.error(err);
        list.innerHTML = '<p class="error-text">❌ Network error</p>';
    } finally {
        adminIsLoading = false;
        if (loadMoreBtn) {
            loadMoreBtn.disabled = false;
            loadMoreBtn.innerHTML = '📥 Load More';
        }
    }
}

// Add new notification
async function addNotification() {
    const input = document.getElementById('new-notification-input');
    const status = document.getElementById('add-notification-status');
    const btn = document.getElementById('add-notification-btn');
    
    const message = input.value.trim();
    
    if (!message) {
        status.textContent = '❌ Please enter a message';
        status.className = 'error';
        return;
    }
    
    btn.disabled = true;
    btn.innerHTML = '⏳ Adding...';
    status.textContent = '';
    
    try {
        const res = await fetch(`${API}/api/notifications/create`, {
            method: 'POST',
            credentials: 'include',
            headers: getAuthHeaders(),
            body: JSON.stringify({ message })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            status.textContent = '✅ Notification added successfully!';
            status.className = 'success';
            input.value = '';
            
            // Reload notifications list
            adminCurrentPage = 1;
            loadAdminNotifications(1, false);
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                status.textContent = '';
            }, 3000);
            
        } else {
            status.textContent = `❌ ${data.message}`;
            status.className = 'error';
        }
        
    } catch (err) {
        console.error(err);
        status.textContent = '❌ Network error. Try again.';
        status.className = 'error';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '📤 Add Notification';
    }
}

// Edit notification - show edit section
function editNotification(id) {
    const editSection = document.getElementById(`edit-section-${id}`);
    const messageEl = document.getElementById(`msg-${id}`);
    
    editSection.classList.remove('hidden');
    messageEl.classList.add('hidden');
}

// Cancel edit
function cancelEdit(id) {
    const editSection = document.getElementById(`edit-section-${id}`);
    const messageEl = document.getElementById(`msg-${id}`);
    
    editSection.classList.add('hidden');
    messageEl.classList.remove('hidden');
}

// Save edited notification
async function saveNotification(id) {
    const input = document.getElementById(`edit-input-${id}`);
    const message = input.value.trim();
    
    if (!message) {
        alert('Message cannot be empty');
        return;
    }
    
    try {
        const res = await fetch(`${API}/api/notifications/update/${id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: getAuthHeaders(),
            body: JSON.stringify({ message })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            // Update UI
            const messageEl = document.getElementById(`msg-${id}`);
            messageEl.textContent = message;
            cancelEdit(id);
            alert('✅ Notification updated!');
        } else {
            alert(`❌ ${data.message}`);
        }
        
    } catch (err) {
        console.error(err);
        alert('❌ Network error. Try again.');
    }
}

// Delete notification
async function deleteNotification(id) {
    if (!confirm('Are you sure you want to delete this notification?')) {
        return;
    }
    
    try {
        const res = await fetch(`${API}/api/notifications/delete/${id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: getAuthHeaders()
        });
        
        const data = await res.json();
        
        if (res.ok) {
            // Remove from UI
            const item = document.querySelector(`[data-id="${id}"]`);
            if (item) {
                item.remove();
            }
            alert('✅ Notification deleted!');
        } else {
            alert(`❌ ${data.message}`);
        }
        
    } catch (err) {
        console.error(err);
        alert('❌ Network error. Try again.');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add notification button
    const addBtn = document.getElementById('add-notification-btn');
    if (addBtn) {
        addBtn.addEventListener('click', addNotification);
    }
    
    // Load more button
    const loadMoreBtn = document.getElementById('admin-load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            if (adminHasMore && !adminIsLoading) {
                adminCurrentPage++;
                loadAdminNotifications(adminCurrentPage, true);
            }
        });
    }
    
    // Allow Ctrl+Enter to submit
    const input = document.getElementById('new-notification-input');
    if (input) {
        input.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'Enter') {
                addNotification();
            }
        });
    }
    
    // Initial load
    if (document.getElementById('admin-notification-list')) {
        loadAdminNotifications(1, false);
    }
});