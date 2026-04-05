const API =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://demo-free-resources-com.onrender.com";


let currentPage = 1;
let isLoadingItems = false;
let hasMoreItems = true;
let currentItemForReturn = null;
let uploaderIdentifier = localStorage.getItem('lostItemsId') || generateId();

function generateId() {
    const id = 'finder_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('lostItemsId', id);
    return id;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Image Preview
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function setupImagePreview() {
    const fileInput = document.getElementById('item-image');
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('image-preview');
    const removeBtn = document.getElementById('remove-preview');

    fileInput?.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Image must be less than 5MB');
                this.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                previewContainer.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

    removeBtn?.addEventListener('click', function() {
        fileInput.value = '';
        previewContainer.classList.add('hidden');
    });
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Create Item Card (Chat-like)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function createItemCard(item) {
    const div = document.createElement('div');
    div.className = `chat-item ${item.isReturned ? 'chat-returned' : ''}`;
    div.dataset.id = item._id;

    const isUploader = item.uploadedBy === uploaderIdentifier;

    div.innerHTML = `
        <div class="chat-bubble">
            <div class="chat-image-wrapper">
                <img src="${item.imageUrl}" alt="Found Item" 
                     class="chat-image ${item.isReturned ? 'blurred' : ''}"
                     onerror="this.src='https://via.placeholder.com/400x300?text=Image+Not+Available'"
                     onclick="viewItemDetails('${item._id}')">
                <div class="chat-stamp ${item.isReturned ? 'stamp-returned' : 'stamp-lost'}">
                    ${item.isReturned ? '✅ RETURNED' : '🚫 LOST ITEM'}
                </div>
            </div>
            
            <div class="chat-content">
                <h4>${item.caption}</h4>
                <div class="chat-meta">
                    <span>👤 ${item.finderName}</span>
                    <span>📍 ${item.foundLocation}</span>
                    <span>🕐 ${formatDate(item.createdAt)}</span>
                </div>
                
                <div class="chat-actions">
                    <button class="chat-view-btn" onclick="viewItemDetails('${item._id}')">👁️ Details</button>

                    ${!item.isReturned && isUploader ? 
                        `<button class="chat-return-btn" onclick="openReturnModal('${item._id}')">✅ Mark Returned</button>` : ''}

                    <!-- ✅ NEW: Delete button (always visible for now) -->
                    <button class="delete-btn" onclick="deleteItem('${item._id}')">
                        🗑 Delete
                    </button>
                </div>
            </div>
        </div>
    `;
    return div;
}
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Load Items (UPDATED - Pagination + Load More)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function loadItems(page = 1, append = false) {
    if (isLoadingItems) return;
    isLoadingItems = true;

    const list = document.getElementById('items-list');
    const loadMoreContainer = document.getElementById('load-more-container');
    const loadMoreBtn = document.getElementById('load-more-btn');

    // Initial load vs Load more UI
    if (!append) {
        list.innerHTML = '<p class="loading-text">⏳ Loading items...</p>';
    } else {
        if (loadMoreBtn) {
            loadMoreBtn.disabled = true;
            loadMoreBtn.innerHTML = '⏳ Loading...';
        }
    }

    try {
        const res = await fetch(`${API}/api/lost-items/all?page=${page}&limit=5`);
        const data = await res.json();

        if (res.ok) {

            // Clear only on first load
            if (!append) list.innerHTML = '';

            // No items case (first page only)
            if (data.items.length === 0 && page === 1) {
                list.innerHTML = `
                    <div class="no-items-msg">
                        <span>📭</span>
                        <p>No items reported yet</p>
                        <p>Found something? Click "Report a Found Item" above!</p>
                    </div>`;
                loadMoreContainer.classList.add('hidden');
            } else {
                // Append new items (latest already handled by backend sort)
                data.items.forEach(item => {
                    list.appendChild(createItemCard(item));
                });

                // Pagination handling
                hasMoreItems = data.pagination?.hasMore || false;

                // Show/Hide Load More button
                if (loadMoreContainer) {
                    loadMoreContainer.classList.toggle('hidden', !hasMoreItems);
                }
            }

            // Mark items as seen
            markItemsSeen();

        } else {
            if (!append) {
                list.innerHTML = '<p class="error-text">❌ Failed to load items</p>';
            }
        }

    } catch (err) {
        console.error(err);
        if (!append) {
            list.innerHTML = '<p class="error-text">❌ Network error</p>';
        }
    } finally {
        isLoadingItems = false;

        if (loadMoreBtn) {
            loadMoreBtn.disabled = false;
            loadMoreBtn.innerHTML = '📥 Load More';
        }
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// View Item Details
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function viewItemDetails(itemId) {
    const modal = document.getElementById('item-modal');
    const details = document.getElementById('modal-item-details');
    details.innerHTML = '<p class="loading-text">⏳ Loading...</p>';
    modal.classList.remove('hidden');

    try {
        const res = await fetch(`${API}/api/lost-items/item/${itemId}`);
        const data = await res.json();

        if (!res.ok) {
            details.innerHTML = '<p class="error-text">❌ Item not found</p>';
            return;
        }

        const item = data.item;
        const isUploader = item.uploadedBy === uploaderIdentifier;

        details.innerHTML = `
            <div class="item-detail-view">
                <div class="detail-image-section">
                    <img src="${item.imageUrl}" alt="Found Item" 
                         class="detail-image ${item.isReturned ? 'blurred' : ''}"
                         onerror="this.src='https://via.placeholder.com/500x400?text=Image+Not+Available'">
                    <div class="detail-status-badge ${item.isReturned ? 'status-returned' : 'status-lost'}">
                        ${item.isReturned ? '✅ RETURNED' : '🚫 LOST ITEM'}
                    </div>
                </div>
                
                <div class="detail-info-section">
                    <h2>${item.caption}</h2>
                    
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">📍 Found At</span>
                            <span class="detail-value">${item.foundLocation}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">👤 Finder</span>
                            <span class="detail-value">${item.finderName}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">📱 Contact</span>
                            <span class="detail-value"><a href="tel:${item.finderMobile}">${item.finderMobile}</a></span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">🏠 Finder Location</span>
                            <span class="detail-value">${item.finderLocation}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">🕐 Reported</span>
                            <span class="detail-value">${formatDate(item.createdAt)}</span>
                        </div>
                    </div>
                    
                    ${item.isReturned ? `
                        <div class="return-info-box">
                            <h4>✅ Return Details</h4>
                            <p><strong>Returned To:</strong> ${item.returnedToName}</p>
                            <p><strong>Department:</strong> ${item.returnedToDepartment}</p>
                            <p><strong>Contact:</strong> ${item.returnedToContact}</p>
                            <p><strong>Date:</strong> ${formatDate(item.returnedAt)}</p>
                        </div>
                    ` : ''}
                    
                    ${!item.isReturned && isUploader ? `
                        <button class="mark-returned-btn" onclick="openReturnModal('${item._id}')">
                            ✅ Mark as Returned
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    } catch (err) {
        console.error(err);
        details.innerHTML = '<p class="error-text">❌ Network error</p>';
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Mark as Returned
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function closeItemModal() { document.getElementById('item-modal').classList.add('hidden'); }
function closeReturnModal() { document.getElementById('return-modal').classList.add('hidden'); currentItemForReturn = null; }

function openReturnModal(itemId) {
    currentItemForReturn = itemId;
    closeItemModal();
    document.getElementById('return-modal').classList.remove('hidden');
}

async function confirmReturn() {
    const name = document.getElementById('returned-to-name').value.trim();
    const dept = document.getElementById('returned-to-dept').value.trim();
    const contact = document.getElementById('returned-to-contact').value.trim();

    if (!name || !dept || !contact) {
        alert('All fields are required');
        return;
    }

    const btn = document.getElementById('confirm-return-btn');
    btn.disabled = true;
    btn.innerHTML = '⏳ Updating...';

    try {
        const res = await fetch(`${API}/api/lost-items/mark-returned/${currentItemForReturn}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                returnedToName: name,
                returnedToDepartment: dept,
                returnedToContact: contact,
                uploaderIdentifier
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert('✅ Item marked as returned! Image moved to trash.');
            closeReturnModal();
            loadItems(1, false);
        } else {
            alert('❌ ' + data.message);
        }
    } catch (err) {
        console.error(err);
        alert('❌ Network error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '✅ Confirm';
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Mark Items Seen (for badge)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function markItemsSeen() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        await fetch(`${API}/api/lost-items/mark-seen`, {
            method: 'POST',
            credentials: 'include',
            headers: getAuthHeaders()
        });

        updateLostBadge(0);
    } catch (err) {
        console.log('Mark seen error:', err);
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Upload Form
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function handleUpload(e) {
    e.preventDefault();

    const status = document.getElementById('upload-status');
    const submitBtn = document.getElementById('submit-btn');
    const fileInput = document.getElementById('item-image');

    if (!fileInput.files[0]) {
        alert('Please choose an image');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Uploading to Drive...';
    status.textContent = '📤 Uploading image to Google Drive...';
    status.className = 'upload-status sending';

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    formData.append('finderName', document.getElementById('finder-name').value);
    formData.append('finderMobile', document.getElementById('finder-mobile').value);
    formData.append('finderLocation', document.getElementById('finder-location').value);
    formData.append('foundLocation', document.getElementById('found-location').value);
    formData.append('caption', document.getElementById('caption').value);
    formData.append('uploadedBy', uploaderIdentifier);

    try {
        const res = await fetch(`${API}/api/lost-items/upload`, {
            method: 'POST',
            body: formData // No Content-Type header (browser sets it for FormData)
        });

        const data = await res.json();

        if (res.ok) {
            status.textContent = '✅ Item uploaded successfully!';
            status.className = 'upload-status success';
            document.getElementById('upload-form').reset();
            document.getElementById('image-preview-container').classList.add('hidden');

            setTimeout(() => {
                document.getElementById('upload-form-container').classList.add('hidden');
                document.getElementById('toggle-upload-btn').textContent = '📤 Report a Found Item';
                status.textContent = '';
            }, 2000);

            loadItems(1, false);
        } else {
            status.textContent = '❌ ' + data.message;
            status.className = 'upload-status error';
        }
    } catch (err) {
        console.error(err);
        status.textContent = '❌ Upload failed. Please try again.';
        status.className = 'upload-status error';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '📤 Upload Item';
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Initialize
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

document.addEventListener('DOMContentLoaded', function() {
    setupImagePreview();

    // Toggle upload form
    const toggleBtn = document.getElementById('toggle-upload-btn');
    const formContainer = document.getElementById('upload-form-container');
    const cancelBtn = document.getElementById('cancel-upload-btn');

    toggleBtn?.addEventListener('click', function() {
        formContainer.classList.toggle('hidden');
        this.textContent = formContainer.classList.contains('hidden')
            ? '📤 Report a Found Item' : '❌ Close Form';
    });

    cancelBtn?.addEventListener('click', function() {
        formContainer.classList.add('hidden');
        toggleBtn.textContent = '📤 Report a Found Item';
        document.getElementById('upload-form').reset();
        document.getElementById('image-preview-container').classList.add('hidden');
    });

    // Upload form
    document.getElementById('upload-form')?.addEventListener('submit', handleUpload);

    // Load more
    document.getElementById('load-more-btn')?.addEventListener('click', function() {
        if (hasMoreItems && !isLoadingItems) {
            currentPage++;
            loadItems(currentPage, true);
        }
    });

    // Confirm return
    document.getElementById('confirm-return-btn')?.addEventListener('click', confirmReturn);

    // Close modals on outside click
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) e.target.classList.add('hidden');
    });

    // Initial load
    loadItems(1, false);
});
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                                       Delete function for the admin                                   //
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
async function deleteItem(id) {
    const confirmDelete = confirm("⚠️ Delete this item permanently?");
    if (!confirmDelete) return;

    try {
        const res = await fetch(`${API}/api/lost-items/delete/${id}`, {
            method: "DELETE",
            credentials: "include"
        });

        const data = await res.json();

        if (res.ok) {
            alert("Item deleted successfully");

            // Reload items
            currentPage = 1;
            document.getElementById('items-list').innerHTML = '';
            loadItems(1, false);

        } else {
            alert(data.message || "Delete failed");
        }

    } catch (err) {
        console.error(err);
        alert("Network error");
    }
}

// ✅ Make functions global (for onclick to work)
window.deleteItem = deleteItem;
window.viewItemDetails = viewItemDetails;
window.openReturnModal = openReturnModal;
window.closeItemModal = closeItemModal;
window.closeReturnModal = closeReturnModal;
window.confirmReturn = confirmReturn;