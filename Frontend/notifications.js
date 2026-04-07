/**
 * NITP Resources - Notification System
 * Handles loading, displaying, and pagination of notifications
 */

let currentPage = 1;
let isLoading = false;
let hasMoreNotifications = true;

// Format timestamp to readable format
function formatTimestamp(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Create notification HTML element
function createNotificationElement(notification) {
    const div = document.createElement('div');
    div.className = 'notification-item';
    div.dataset.id = notification._id;
    
    div.innerHTML = `
        <div class="notification-header">
            <span class="notification-time">🕐 ${formatTimestamp(notification.createdAt)}</span>
            ${notification.createdBy ? `<span class="notification-author">by ${notification.createdBy.username || 'Admin'}</span>` : ''}
        </div>
        <div class="notification-message">${notification.message}</div>
    `;
    
    return div;
}

// Load notifications from server
async function loadNotifications(page = 1, append = false) {
    if (isLoading) return;
    isLoading = true;
    
    const notificationList = document.getElementById('notification-list');
    const loadMoreContainer = document.getElementById('load-more-container');
    const noMoreNotifications = document.getElementById('no-more-notifications');
    const loadMoreBtn = document.getElementById('load-more-btn');
    
    if (!append) {
        notificationList.innerHTML = `
            <div class="notification-loading">
                <div class="loading-spinner"></div>
                <p>Loading notifications...</p>
            </div>
        `;
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
                notificationList.innerHTML = '';
            }
            
            if (data.notifications.length === 0 && page === 1) {
                notificationList.innerHTML = `
                    <div class="no-notifications">
                        <span class="no-notif-icon">📭</span>
                        <p>No notifications yet</p>
                    </div>
                `;
                loadMoreContainer.classList.add('hidden');
                noMoreNotifications.classList.add('hidden');
            } else {
                data.notifications.forEach(notification => {
                    notificationList.appendChild(createNotificationElement(notification));
                });
                
                hasMoreNotifications = data.pagination.hasMore;
                
                if (hasMoreNotifications) {
                    loadMoreContainer.classList.remove('hidden');
                    noMoreNotifications.classList.add('hidden');
                } else {
                    loadMoreContainer.classList.add('hidden');
                    if (data.notifications.length > 0 || page > 1) {
                        noMoreNotifications.classList.remove('hidden');
                    }
                }
            }
            
            // Mark notifications as seen
            markNotificationsAsSeen();
            
        } else {
            notificationList.innerHTML = `
                <div class="notification-error">
                    <p>❌ Failed to load notifications</p>
                    <button onclick="loadNotifications(1, false)">Retry</button>
                </div>
            `;
        }
        
    } catch (err) {
        console.error('Error loading notifications:', err);
        notificationList.innerHTML = `
            <div class="notification-error">
                <p>❌ Network error. Please try again.</p>
                <button onclick="loadNotifications(1, false)">Retry</button>
            </div>
        `;
    } finally {
        isLoading = false;
        if (loadMoreBtn) {
            loadMoreBtn.disabled = false;
            loadMoreBtn.innerHTML = '📥 Load More Notifications';
        }
    }
}

// Mark notifications as seen
async function markNotificationsAsSeen() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return; // Only mark as seen for logged-in users
        
        await fetch(`${API}/api/notifications/mark-seen`, {
            method: 'POST',
            credentials: 'include',
            headers: getAuthHeaders()
        });
        
        // Update bell icon badge
        updateBellBadge(0);
        
    } catch (err) {
        console.error('Error marking notifications as seen:', err);
    }
}

// Load more button handler
document.addEventListener('DOMContentLoaded', function() {
    const loadMoreBtn = document.getElementById('load-more-btn');
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            if (hasMoreNotifications && !isLoading) {
                currentPage++;
                loadNotifications(currentPage, true);
            }
        });
    }
    
    // Initial load
    if (document.getElementById('notification-list')) {
        loadNotifications(1, false);
    }
});