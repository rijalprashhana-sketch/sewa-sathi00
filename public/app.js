// ============================================================
// SewaSathi v10 - Main App JS
// ============================================================
const API = 'http://localhost:5000/api';

function getToken() { return localStorage.getItem('ss_token'); }
function getUser()  { try { return JSON.parse(localStorage.getItem('ss_user')); } catch(e){ return null; } }
function isLoggedIn() { return !!getToken() && !!getUser(); }

function saveAuth(token, user) {
    localStorage.setItem('ss_token', token);
    localStorage.setItem('ss_user', JSON.stringify(user));
}

function logout() {
    localStorage.removeItem('ss_token');
    localStorage.removeItem('ss_user');
    window.location.href = 'login.html';
}

async function apiCall(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    const tok = getToken();
    if (tok) opts.headers['Authorization'] = 'Bearer ' + tok;
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API + path, opts);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
}

function showAlert(msg, type = 'success') {
    const el = document.getElementById('alertMessage');
    if (!el) { alert(msg); return; }
    el.className = 'alert alert-' + type;
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4500);
}

// Phone validation: must be exactly 10 digits
function validateNepalPhone(phone) {
    return /^\d{10}$/.test(phone.trim());
}

// Generate a 6-digit OTP (simulated — in production send via SMS)
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// OTP session storage (in-memory for demo; production: server-side)
window._otpStore = {};

function storeOTP(phone, otp) {
    window._otpStore[phone] = { otp, expires: Date.now() + 5 * 60 * 1000 }; // 5 min
}

function verifyOTP(phone, otp) {
    const record = window._otpStore[phone];
    if (!record) return false;
    if (Date.now() > record.expires) return false;
    return record.otp === otp;
}

function buildNav() {
    const navLinks = document.getElementById('navLinks');
    if (!navLinks) return;
    const user = getUser();
    if (user) {
        navLinks.innerHTML = `
            <a href="index.html">Home</a>
            <a href="services.html">Services</a>
            <a href="messages.html"><i class="fas fa-envelope"></i> Messages</a>
            <a href="dashboard.html">Dashboard</a>
            <span style="color:rgba(255,255,255,0.7);padding:0 4px;">|</span>
            <span style="color:white;font-weight:600;">Hi, ${user.name.split(' ')[0]}</span>
            <a href="#" onclick="logout()" style="color:#ffcccc;">Logout</a>`;
    } else {
        navLinks.innerHTML = `
            <a href="index.html">Home</a>
            <a href="services.html">Services</a>
            <a href="login.html">Login</a>
            <a href="register.html" style="background:white;color:#667eea;padding:8px 18px;border-radius:20px;font-weight:600;">Register</a>`;
    }
}

document.addEventListener('DOMContentLoaded', buildNav);
