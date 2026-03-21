function toggleDarkMode() {
    const html = document.documentElement;
    if (html.getAttribute("data-theme") === "dark") {
        html.removeAttribute("data-theme");
    } else {
        html.setAttribute("data-theme", "dark");
    }
}

fetch("header.html")
  .then(res => res.text())
  .then(html => {
    document.getElementById("header").innerHTML = html;

    // ===================================================================
    //  DARK MODE WITH ICON (🌙 / 🔆) — FULL & FINAL
    // ===================================================================

    // Set icon inside toggle ball based on theme
    function updateToggleIcon() {   
      const ball = document.querySelector(".toggle-ball");
      if (!ball) return;

      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      ball.textContent = isDark ? "🔆" : "🌙"; 
    }

    // Toggle Dark Mode
    window.toggleDarkMode = function () { 
      const htmlEl = document.documentElement;
      const isDark = htmlEl.getAttribute("data-theme") === "dark";

      if (isDark) {
        htmlEl.removeAttribute("data-theme");
        try { localStorage.setItem("theme", "light"); } catch (e) {}
      } else {
        htmlEl.setAttribute("data-theme", "dark");
        try { localStorage.setItem("theme", "dark"); } catch (e) {}
      }

      updateToggleIcon(); 
    };

    // Load saved theme
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      }
    } catch (e) {}

    updateToggleIcon(); // ⚠️⚠️⚠️ ensure icon loads on first load



    // ===================================================================
    // ⭐ HAMBURGER MENU / OVERLAY
    // ===================================================================

    window.toggleMenu = function () {
      const sidebar = document.getElementById("sbSidebar");
      const overlay = document.getElementById("sbOverlay");
      const btn = document.querySelector(".sb-menu-btn");

      sidebar.classList.toggle("open");
      overlay.classList.toggle("show");
      btn.classList.toggle("active");

      document.body.classList.toggle("sb-menu-open");
    };


    // ===================================================================
    // ⚡ SIDEBAR OPEN/CLOSE
    // ===================================================================
    window.openSidebar = function () {
      document.getElementById("sbSidebar").classList.add("active");
    };

    window.closeSidebar = function () {
      document.getElementById("sbSidebar").classList.remove("active");
    };
      
    // ✅ Close sidebar when clicking outside
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('sbSidebar');
        const menuIcon = document.querySelector('.sb-menu-icon');
        const openMenuBtn = document.querySelector('.cta-button');
        
        if (sidebar && sidebar.classList.contains('active')) {
            const isClickInsideSidebar = sidebar.contains(e.target);
            const isClickOnMenuIcon = menuIcon && menuIcon.contains(e.target);
            const isClickOnOpenBtn = openMenuBtn && openMenuBtn.contains(e.target);
            
            if (!isClickInsideSidebar && !isClickOnMenuIcon && !isClickOnOpenBtn) {
                closeSidebar();
            }
        }
    });
      
    // ===================================================================
    // ⚡ DROPDOWN TOGGLE INSIDE SIDEBAR
    // ===================================================================
    document.querySelectorAll(".sb-dropdown > span").forEach(drop => {
      drop.addEventListener("click", () => {
        drop.parentElement.classList.toggle("open");
      });
    });

  })
  .catch(err => console.error("Header load error:", err));

  // ===================================================================
// 🔔 NOTIFICATION BELL BADGE & REDIRECT
// ===================================================================

// Go to notifications page
window.goToNotifications = function() {
    window.location.href = 'about.html';
};

// Update bell badge count
window.updateBellBadge = function(count) {
    const badge = document.getElementById('bell-badge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
};

// Fetch unread notification count
async function fetchUnreadCount() {
    try {
        const API = location.hostname === "localhost" || location.hostname === "127.0.0.1"
            ? "http://localhost:3000"
            : "https://demo-free-resources-com.onrender.com";
        
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const res = await fetch(`${API}/api/notifications/unread-count`, {
            credentials: 'include',
            headers: headers
        });
        
        if (res.ok) {
            const data = await res.json();
            updateBellBadge(data.unreadCount);
        }
    } catch (err) {
        console.log('Error fetching unread count:', err);
    }
}

// Fetch unread count when header loads
setTimeout(fetchUnreadCount, 500); // Wait for header to fully load

// Refresh unread count every 2 minutes

setInterval(fetchUnreadCount, 120000);
