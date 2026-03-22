
// Format date
function formatProfileDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

// Load Profile Data
async function loadProfile() {
    showLoader();
    
    try {
        const res = await fetch(`${API}/api/auth/me`, {
            credentials: 'include',
            headers: getAuthHeaders()
        });
        
        if (!res.ok) {
            hideLoader();
            window.location.href = 'login.html';
            return;
        }
        
        const data = await res.json();
        const user = data.user;
        
        // Update avatar
        const avatar = document.getElementById('profile-avatar');
        if (avatar) avatar.textContent = user.username.charAt(0).toUpperCase();
        
        // Update basic info
        document.getElementById('profile-name').textContent = user.username;
        document.getElementById('profile-email').textContent = user.email;
        document.getElementById('profile-branch').textContent = user.branch || 'N/A';
        document.getElementById('profile-joined').textContent = formatProfileDate(user.createdAt);
        
        // Update optional fields
        const mobileEl = document.getElementById('profile-mobile');
        const rollEl = document.getElementById('profile-roll');
        const yearEl = document.getElementById('profile-year');
        const genderEl = document.getElementById('profile-gender');
        
        if (mobileEl) mobileEl.textContent = user.mobile || 'Not added';
        if (rollEl) rollEl.textContent = user.rollNo || 'Not added';
        if (yearEl) yearEl.textContent = user.passingYear || 'Not added';
        if (genderEl) genderEl.textContent = user.gender || 'Not added';
        
        
        // Fill edit inputs
        const editName = document.getElementById('edit-name');
        const editMobile = document.getElementById('edit-mobile');
        const editRoll = document.getElementById('edit-roll');
        const editYear = document.getElementById('edit-year');
        const editGender = document.getElementById('edit-gender');

        if (editName) editName.value = user.username || '';
        if (editMobile) editMobile.value = user.mobile || '';
        if (editRoll) editRoll.value = user.rollNo || '';
        if (editYear) editYear.value = user.passingYear || '';   
        if (editGender) editGender.value = user.gender || '';
        
        // Update status
        const statusEl = document.getElementById('profile-status');
        if (user.isBlocked) {
            statusEl.textContent = '🚫 Blocked';
            statusEl.className = 'profile-status blocked';
            
            // Show block warning
            const blockWarning = document.getElementById('block-warning');
            if (blockWarning) {
                blockWarning.classList.remove('hidden');
                document.getElementById('block-reason-display').textContent = 
                    user.blockReason || 'No reason provided';
                document.getElementById('block-date-display').textContent = 
                    'Blocked on: ' + formatProfileDate(user.blockedAt);
            }
        } else {
            statusEl.textContent = '✅ Active';
            statusEl.className = 'profile-status active';
        }
        
        // Store user for other uses
        localStorage.setItem('user', JSON.stringify(user));
        
    } catch (err) {
        console.error('Error loading profile:', err);
    } finally {
        hideLoader();
    }
}

// Save Profile
async function saveProfile() {
    const btn = document.getElementById('save-profile-btn');
    const status = document.getElementById('save-status');
    
    const username = document.getElementById('edit-name')?.value.trim() || null;
    const mobile = document.getElementById('edit-mobile')?.value.trim() || null;
    const rollNo = document.getElementById('edit-roll')?.value.trim() || null;
    const passingYear = document.getElementById('edit-year')?.value || null;
    const gender = document.getElementById('edit-gender')?.value || null;
    
    btn.disabled = true;
    btn.textContent = '⏳ Saving...';
    status.textContent = '';
    
    try {
        const body = { mobile };
        if (username) body.username = username;
        if (document.getElementById('edit-roll')) body.rollNo = rollNo;
        if (document.getElementById('edit-year')) body.passingYear = passingYear ? parseInt(passingYear) : null;
        if (gender) body.gender = gender;
        
        const res = await fetch(`${API}/api/auth/update-profile`, {
            method: 'PUT',
            credentials: 'include',
            headers: getAuthHeaders(),
            body: JSON.stringify(body)
        });
        
        const data = await res.json();
        
        if (res.ok) {
            status.textContent = '✅ Saved!';
            status.className = 'save-success';
            
            // Update display
            const nameEl = document.getElementById('profile-name');
            const mobileEl = document.getElementById('profile-mobile');
            const rollEl = document.getElementById('profile-roll');
            const yearEl = document.getElementById('profile-year');
            const genderEl = document.getElementById('profile-gender');
            
            if (nameEl && username) nameEl.textContent = username;
            if (mobileEl) mobileEl.textContent = mobile || 'Not added';
            if (rollEl) rollEl.textContent = rollNo || 'Not added';
            if (yearEl) yearEl.textContent = passingYear || 'Not added';
            if (genderEl) genderEl.textContent = gender || 'Not added';
            
            // Update avatar if name changed
            if (username) {
                const avatar = document.getElementById('profile-avatar');
                if (avatar) avatar.textContent = username.charAt(0).toUpperCase();
            }
            
            setTimeout(() => { status.textContent = ''; }, 3000);
        } else {
            status.textContent = '❌ ' + data.message;
            status.className = 'save-error';
        }
        
    } catch (err) {
        console.error(err);
        status.textContent = '❌ Network error';
        status.className = 'save-error';
    } finally {
        btn.disabled = false;
        btn.textContent = '💾 Save Changes';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadProfile();
    
    const saveBtn = document.getElementById('save-profile-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveProfile);
    }
});
