const API =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://demo-free-resources-com.onrender.com";

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Helper: Get auth headers (sends token if available)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Send OTP
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

const sendOtpBtn = document.getElementById("send-otp-btn");
const otpInputSection = document.getElementById("otp-input-section");
const otpStatus = document.getElementById("otp-status");

if (sendOtpBtn) {
    sendOtpBtn.addEventListener("click", async function () {
        const username = document.getElementById("r-username").value;
        const email = document.getElementById("r-email").value;

        if (!username || !email) {
            alert("Please enter username and email first");
            return;
        }

        showLoader();
        sendOtpBtn.disabled = true;
        otpStatus.textContent = "Sending OTP...";
        otpStatus.classList.remove("error");

        try {
            const res = await fetch(`${API}/api/auth/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username, email, role: document.getElementById("r-role").value })
            });

            const data = await res.json();

            if (res.ok) {
                otpStatus.textContent = "✅ OTP sent! Check your email.(🚨SPAM also🚨)";
                otpStatus.classList.remove("error");
                otpInputSection.classList.remove("hidden");
                
                document.getElementById("r-username").disabled = true;
                document.getElementById("r-email").disabled = true;
                
                let countdown = 60;
                sendOtpBtn.textContent = `Resend OTP (${countdown}s)`;
                
                const timer = setInterval(() => {
                    countdown--;
                    sendOtpBtn.textContent = `Resend OTP (${countdown}s)`;
                    
                    if (countdown <= 0) {
                        clearInterval(timer);
                        sendOtpBtn.disabled = false;
                        sendOtpBtn.textContent = "Resend OTP";
                    }
                }, 1000);
                
            } else {
                otpStatus.textContent = `❌ ${data.message}`;
                otpStatus.classList.add("error");
                sendOtpBtn.disabled = false;
            }

        } catch (err) {
            otpStatus.textContent = "❌ Network error. Try again.";
            otpStatus.classList.add("error");
            sendOtpBtn.disabled = false;
            console.error(err);
        } finally {
            hideLoader();
        }
    });
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Registration (with OTP verification)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

const registerBtn = document.getElementById("r-submit");
if (registerBtn) {
    registerBtn.addEventListener("click", async function (e) {
        e.preventDefault();
        showLoader();

        const username = document.getElementById("r-username").value;
        const email = document.getElementById("r-email").value;
        const password = document.getElementById("r-password").value;
        const role = document.getElementById("r-role").value;
        const otp = document.getElementById("r-otp").value;

        if (!username || !email || !password || !role) {
            alert("Please fill all fields");
            hideLoader();
            return;
        }

        if (!otp) {
            alert("Please enter the OTP");
            hideLoader();
            return;
        }

        if (otp.length !== 6) {
            alert("OTP must be 6 digits");
            hideLoader();
            return;
        }

        try {
            const res = await fetch(`${API}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username, email, password, role, otp })
            });

            const data = await res.json();
            alert(data.message);

            if (res.ok) {
                // ✅ Save token AND user to localStorage
                if (data.token) {
                    localStorage.setItem("token", data.token);
                }
                localStorage.setItem("user", JSON.stringify(data.user));
                
                if (data.user.role === "Student") {
                    window.location.href = "student-profile.html";
                } else if (data.user.role === "Professor") {
                    window.location.href = "professor-profile.html";
                } else if (data.user.role === "Admin") {
                    window.location.href = "admin-profile.html";
                }
            } else if (res.status === 409) {
                window.location.href = "login.html";
            }

        } catch (err) {
            alert("Network error. Please try again.");
            console.error(err);
        } finally {
            hideLoader();
        }
    });
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Login
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

const loginBtn = document.getElementById("l-login");
if (loginBtn) {
    loginBtn.addEventListener("click", async function (e) {
        e.preventDefault();
        showLoader();

        const email = document.getElementById("l-email").value;
        const password = document.getElementById("l-password").value;
        const role = document.getElementById("l-role").value;

        if (!role) {
            alert("Please select a role");
            hideLoader();
            return;
        }

        try {
            const res = await fetch(`${API}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password, role })
            });

            const data = await res.json();
            alert(data.message);

            if (res.ok) {
                // ✅ Save token AND user to localStorage
                if (data.token) {
                    localStorage.setItem("token", data.token);
                }
                localStorage.setItem("user", JSON.stringify(data.user));

                if (data.user.role === "Student") {
                    window.location.href = "student-profile.html";
                } else if (data.user.role === "Professor") {
                    window.location.href = "professor-profile.html";
                } else if (data.user.role === "Admin") {
                    window.location.href = "admin-profile.html";
                }
            }
        } catch (err) {
            alert("Network error. Please try again.");
            console.error(err);
        } finally {
            hideLoader();
        }
    });
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Logout
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

const logoutBtn = document.getElementById("logout");
if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
        showLoader();
        try {
            await fetch(`${API}/api/auth/logout`, {
                method: "POST",
                credentials: "include",
                headers: getAuthHeaders()
            });
            alert("Logged out successfully");
            
            // ✅ Clear both token and user
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            
            window.location.href = "login.html";
        } catch (err) {
            alert("Logout failed");
            console.error(err);
        } finally {
            hideLoader();
        }
    });
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Page Heading
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

const pageHeading = document.getElementById("page-heading");
if (pageHeading) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
        pageHeading.innerHTML = `Welcome ${user.username}`;
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// User Count
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function loadUserCount() {
    try {
        const res = await fetch(`${API}/api/auth/count`, {
            credentials: "include"
        });
        const data = await res.json();

        const el = document.getElementById("user-count");
        if (el) {
            el.innerText = `${data.count}`;
        }
    } catch (err) {
        console.log("Count fetch error", err);
    }
}

loadUserCount();
setInterval(loadUserCount, 120000);

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Total Visits (Smart - Once per 30 minutes)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function handleVisitCount() {
    const VISIT_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds
    const lastVisit = localStorage.getItem("lastVisitTime");
    const now = Date.now();
    
    try {
        // Check if should increment
        if (!lastVisit || (now - parseInt(lastVisit)) > VISIT_INTERVAL) {
            // Increment visit count
            await fetch(`${API}/api/auth/visits/increment`, {
                method: "POST",
                credentials: "include"
            });
            localStorage.setItem("lastVisitTime", now.toString());
        }
        
        // Always fetch and display current count
        const res = await fetch(`${API}/api/auth/visits`, {
            credentials: "include"
        });
        const data = await res.json();
        
        const el = document.getElementById("total-hits");
        if (el) {
            el.innerText = data.count || 0;
        }
    } catch (err) {
        console.log("Visit count error:", err);
        const el = document.getElementById("total-hits");
        if (el) {
            el.innerText = "loading...";
        }
    }
}

handleVisitCount();

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Loader Functions
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function showLoader() {
    const loader = document.getElementById("loader");
    if (loader) {
        loader.classList.remove("hidden");
        
        // ✅ Create overlay if not exists
        if (!document.getElementById("loader-overlay")) {
            const overlay = document.createElement("div");
            overlay.id = "loader-overlay";
            overlay.className = "loader-overlay";
            document.body.appendChild(overlay);
        }
        document.getElementById("loader-overlay").style.display = "block";
        document.body.style.overflow = "hidden";
    }
}

function hideLoader() {
    const loader = document.getElementById("loader");
    if (loader) {
        loader.classList.add("hidden");
        
        // ✅ Hide overlay
        const overlay = document.getElementById("loader-overlay");
        if (overlay) overlay.style.display = "none";
        document.body.style.overflow = "";
    }
}
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Check Login (for public pages)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function checkLogin() {
    const path = window.location.pathname.toLowerCase();

    const isPublicPage =
        path.endsWith("index.html") ||
        path.endsWith("login.html") ||
        path.endsWith("register.html") ||
        path.endsWith("forgot.html") ||
        path === "/" ||
        path === "";

    if (!isPublicPage) return;

    // Quick check: if no token in localStorage, user is not logged in
    const token = localStorage.getItem("token");
    if (!token) return;

    showLoader();

    try {
        const res = await fetch(`${API}/api/auth/me`, {
            method: "GET",
            credentials: "include",
            headers: getAuthHeaders()
        });

        if (!res.ok) {
            // Token invalid - clear storage
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            hideLoader();
            return;
        }

        const data = await res.json();

        if (data?.user) {
            localStorage.setItem("user", JSON.stringify(data.user));

            if (path.includes("index.html") || path === "/" || path === "") {
                // On home page, just show message - don't redirect
                hideLoader();
                return;
            }

            // On login/register page, redirect to profile
            setTimeout(() => {
                if (data.user.role === "Student") {
                    window.location.replace("student-profile.html");
                } else if (data.user.role === "Professor") {
                    window.location.replace("professor-profile.html");
                } else if (data.user.role === "Admin") {
                    window.location.replace("admin-profile.html");
                }
            }, 100);
        } else {
            hideLoader();
        }
    } catch (err) {
        hideLoader();
    }
}

checkLogin();

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// FORGOT PASSWORD FUNCTIONALITY
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

let forgotPasswordEmail = "";

const fSendOtpBtn = document.getElementById("f-send-otp-btn");
const fOtpSection = document.getElementById("f-otp-section");
const fOtpStatus = document.getElementById("f-otp-status");

if (fSendOtpBtn) {
    fSendOtpBtn.addEventListener("click", async function () {
        const email = document.getElementById("f-email").value;

        if (!email) {
            alert("Please enter your email");
            return;
        }

        showLoader();
        fSendOtpBtn.disabled = true;
        fOtpStatus.textContent = "Sending OTP...";
        fOtpStatus.classList.remove("error");

        try {
            const res = await fetch(`${API}/api/auth/forgot-password/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (res.ok) {
                forgotPasswordEmail = email;
                fOtpStatus.textContent = "✅ OTP sent! Check your email.(🚨SPAM also🚨)";
                fOtpStatus.classList.remove("error");
                fOtpSection.classList.remove("hidden");
                
                document.getElementById("f-email").disabled = true;
                
                let countdown = 60;
                fSendOtpBtn.textContent = `Resend OTP (${countdown}s)`;
                
                const timer = setInterval(() => {
                    countdown--;
                    fSendOtpBtn.textContent = `Resend OTP (${countdown}s)`;
                    
                    if (countdown <= 0) {
                        clearInterval(timer);
                        fSendOtpBtn.disabled = false;
                        fSendOtpBtn.textContent = "Resend OTP";
                    }
                }, 1000);
                
            } else {
                fOtpStatus.textContent = `❌ ${data.message}`;
                fOtpStatus.classList.add("error");
                fSendOtpBtn.disabled = false;
            }

        } catch (err) {
            fOtpStatus.textContent = "❌ Network error. Try again.";
            fOtpStatus.classList.add("error");
            fSendOtpBtn.disabled = false;
            console.error(err);
        } finally {
            hideLoader();
        }
    });
}

const fVerifyOtpBtn = document.getElementById("f-verify-otp-btn");
const fPasswordSection = document.getElementById("f-password-section");

if (fVerifyOtpBtn) {
    fVerifyOtpBtn.addEventListener("click", async function () {
        const otp = document.getElementById("f-otp").value;

        if (!otp) {
            alert("Please enter the OTP");
            return;
        }

        if (otp.length !== 6) {
            alert("OTP must be 6 digits");
            return;
        }

        showLoader();
        fVerifyOtpBtn.disabled = true;

        try {
            const res = await fetch(`${API}/api/auth/forgot-password/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email: forgotPasswordEmail, otp })
            });

            const data = await res.json();

            if (res.ok) {
                alert("OTP verified! Create your new password.");
                fOtpSection.classList.add("hidden");
                fPasswordSection.classList.remove("hidden");
                document.getElementById("email-section").classList.add("hidden");
            } else {
                alert(data.message);
                fVerifyOtpBtn.disabled = false;
            }

        } catch (err) {
            alert("Network error. Try again.");
            fVerifyOtpBtn.disabled = false;
            console.error(err);
        } finally {
            hideLoader();
        }
    });
}

const fResetBtn = document.getElementById("f-reset-btn");

if (fResetBtn) {
    fResetBtn.addEventListener("click", async function () {
        const newPassword = document.getElementById("f-new-password").value;
        const confirmPassword = document.getElementById("f-confirm-password").value;

        if (!newPassword || !confirmPassword) {
            alert("Please fill both password fields");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("Passwords do not match! Please re-enter.");
            document.getElementById("f-new-password").value = "";
            document.getElementById("f-confirm-password").value = "";
            return;
        }

        if (newPassword.length < 6) {
            alert("Password must be at least 6 characters");
            return;
        }

        showLoader();
        fResetBtn.disabled = true;

        try {
            const res = await fetch(`${API}/api/auth/forgot-password/reset`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email: forgotPasswordEmail, newPassword })
            });

            const data = await res.json();
            alert(data.message);

            if (res.ok) {
                window.location.href = "login.html";
            } else {
                fResetBtn.disabled = false;
            }

        } catch (err) {
            alert("Network error. Try again.");
            fResetBtn.disabled = false;
            console.error(err);
        } finally {
            hideLoader();
        }
    });
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// PROTECT RESOURCE PAGES (ee1.html, me2.html, ce3.html, etc.)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

const protectedResourcePages = [
    "ee1.html", "ee2.html", "ee3.html", "ee4.html", "ee5.html", "ee6.html", "ee7.html", "ee8.html",
    "me1.html", "me2.html", "me3.html", "me4.html", "me5.html", "me6.html", "me7.html", "me8.html",
    "ce1.html", "ce2.html", "ce3.html", "ce4.html", "ce5.html", "ce6.html", "ce7.html", "ce8.html"
];

// Helper: Extract branch from email (ee, me, ce)
function getBranchFromEmail(email) {
    if (!email) return null;
    
    // Extract branch from email pattern: name.BRANCH@nitp.ac.in
    const match = email.match(/\.([a-z]{2})@nitp\.ac\.in$/);
    if (match) {
        const branch = match[1].toLowerCase();
        if (["ee", "me", "ce"].includes(branch)) return branch;
    }
    
    return null; // For Admin/Professor or other emails
}

// Helper: Extract branch from page name (ee1.html → ee)
function getBranchFromPage(path) {
    const pageName = path.split("/").pop().toLowerCase();
    
    if (pageName.startsWith("ee")) return "ee";
    if (pageName.startsWith("me")) return "me";
    if (pageName.startsWith("ce")) return "ce";
    
    return null;
}

async function protectResourcePages() {
    const path = window.location.pathname.toLowerCase();
    
    const isProtectedPage = protectedResourcePages.some(page => 
        path.endsWith(page.toLowerCase())
    );
    
    if (!isProtectedPage) return;
    
    // Quick check: if no token, redirect immediately
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please login to access this page.");
        window.location.replace("login.html");
        return;
    }
    
    showLoader();
    
    try {
        const res = await fetch(`${API}/api/auth/me`, {
            method: "GET",
            credentials: "include",
            headers: getAuthHeaders()
        });
        
        const data = await res.json();
        
        if (res.ok && data?.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
            
            // ✅ Allow Professors and Admins to access all resources
            if (data.user.role === "Professor" || data.user.role === "Admin") {
                hideLoader();
                return;
            }
            
            // ✅ For Students: Check branch access
            const userBranch = getBranchFromEmail(data.user.email);
            const pageBranch = getBranchFromPage(path);
            
            if (userBranch && pageBranch && userBranch !== pageBranch) {
                // ❌ Branch mismatch
                hideLoader();
                alert(`Access Denied! You belong to ${userBranch.toUpperCase()} branch. You cannot access ${pageBranch.toUpperCase()} resources.`);
                window.location.replace("index.html");
                return;
            }
            
            // ✅ Branch matches or user has special access - allow
            hideLoader();
            return;
        }
        
        // ❌ Token invalid or expired
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert("Session expired. Please login again.");
        window.location.replace("login.html");
        
    } catch (err) {
        console.error(err);
        alert("Network error. Please try again.");
        window.location.replace("login.html");
    }
}

protectResourcePages();




// ❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️
// ❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️
// ❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️
// ❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️
// ❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️
// ❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️
// ❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️
// ❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Load Footer
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function loadFooter() {
    fetch('footer.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer-placeholder').innerHTML = data;
        })
        .catch(err => console.error("Error loading footer:", err));
}

loadFooter();
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// 🚫 CHECK IF USER IS BLOCKED
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function checkIfUserBlocked() {
    const path = window.location.pathname.toLowerCase();
    
    // ✅ Allow access to index.html AND profile pages for blocked users
    const allowedPages = ['index.html', 'student-profile.html', 'professor-profile.html'];
    const isAllowedPage = allowedPages.some(page => path.endsWith(page)) || path === '/' || path === '' || path.endsWith('/');
    
    // Don't check on public pages where user might not be logged in
    const publicPages = ['login.html', 'register.html', 'forgot.html', 'account.html'];
    const isPublicPage = publicPages.some(page => path.endsWith(page));
    
    if (isPublicPage) return; // Don't check on login/register pages
    
    const token = localStorage.getItem('token');
    if (!token) return; // No token, user not logged in
    
    try {
        const res = await fetch(`${API}/api/users/check-block-status`, {
            credentials: 'include',
            headers: getAuthHeaders()
        });
        
        if (res.ok) {
            const data = await res.json();
            
            if (data.isBlocked) {
                // User is blocked!
                if (!isAllowedPage) {
                    // Show popup and redirect to index
                    alert(`🚫 ACCESS DENIED!\n\nYour account has been BLOCKED by the administrator.\n\n${data.blockReason ? 'Reason: ' + data.blockReason : ''}\n\nYou can only access Home and your Profile page.`);
                    
                    // Redirect to index
                    window.location.replace('index.html');
                }
            }
        }
    } catch (err) {
        console.error('Error checking block status:', err);
    }
}

// Show blocked banner on index page
function showBlockedBanner(reason) {
    // Check if banner already exists
    if (document.getElementById('blocked-banner')) return;
    
    const banner = document.createElement('div');
    banner.id = 'blocked-banner';
    banner.className = 'blocked-banner';
    banner.innerHTML = `
        <div class="blocked-banner-content">
            <span class="blocked-icon">🚫</span>
            <div class="blocked-text">
                <strong>Your account has been blocked by the administrator.</strong>
                ${reason ? `<br>Reason: ${reason}` : ''}
                <br><small>You can only access Home and your Profile page.</small>
            </div>
            <button onclick="this.parentElement.parentElement.remove()">✕</button>
        </div>
    `;
    
    // Insert after header
    const header = document.getElementById('header');
    if (header && header.nextSibling) {
        header.parentNode.insertBefore(banner, header.nextSibling);
    } else {
        document.body.insertBefore(banner, document.body.firstChild);
    }
}

// Run block check
checkIfUserBlocked();

// ── Show auth CTA on index page only if not logged in ──
(function() {
    const authCTA = document.getElementById('auth-cta');
    if (!authCTA) return; // not on index page

    const user = localStorage.getItem('token');
    if (!user) {
        authCTA.classList.remove('hidden');
    }
})();
