// ══════════════════════════════════════════════════════
//  GARAGE J57 — script.js
//  Works with Vercel API endpoint
// ══════════════════════════════════════════════════════

// ── API URL — works both locally and on Vercel ──
const API_URL = "/api/otp";

// ── State ──
let timerInterval = null;
let timerSeconds = 30;

// ══════════════════════════════════════
// STEP 1 — SEND OTP
// ══════════════════════════════════════
async function sendOTP() {
    clearError('error-phone');

    const phone = document.getElementById('input-phone').value.trim();

    if (!phone) {
        showError('error-phone', 'Please enter your phone number.');
        return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
        showError('error-phone', 'Enter valid 10-digit number (e.g. 9047727963)');
        return;
    }

    setLoading('btn-send-otp', true, 'Sending...');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'send', phone })
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('step-phone').style.display = 'none';
            document.getElementById('step-otp').style.display = 'block';
            document.getElementById('display-phone').textContent = '+91 ' + phone;
            startTimer();
        } else {
            showError('error-phone', data.message || 'Failed to send OTP.');
        }

    } catch (error) {
        showError('error-phone', 'Network error. Please try again.');
        console.error('Send OTP error:', error);
    }

    setLoading('btn-send-otp', false, 'Send OTP');
}

// ══════════════════════════════════════
// STEP 2 — VERIFY OTP
// ══════════════════════════════════════
async function verifyOTP() {
    clearError('error-otp');

    const otp = document.getElementById('input-otp').value.trim();
    const phone = document.getElementById('display-phone')
        .textContent.replace('+91 ', '').trim();

    if (!otp || otp.length !== 6) {
        showError('error-otp', 'Please enter the 6-digit OTP.');
        return;
    }

    setLoading('btn-verify-otp', true, 'Verifying...');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'verify', phone, otp })
        });

        const data = await response.json();

        if (data.success) {
            clearInterval(timerInterval);
            document.getElementById('step-otp').style.display = 'none';
            document.getElementById('step-success').style.display = 'block';
            document.getElementById('success-phone').textContent = '+91 ' + phone;
            saveUser(phone);
        } else {
            showError('error-otp', data.message || 'Wrong OTP. Try again.');
        }

    } catch (error) {
        showError('error-otp', 'Network error. Please try again.');
        console.error('Verify OTP error:', error);
    }

    setLoading('btn-verify-otp', false, 'Verify & Log In');
}

// ══════════════════════════════════════
// RESEND OTP
// ══════════════════════════════════════
function resendOTP() {
    clearError('error-otp');
    const phone = document.getElementById('display-phone')
        .textContent.replace('+91 ', '').trim();
    document.getElementById('input-phone').value = phone;
    document.getElementById('input-otp').value = '';
    document.getElementById('step-otp').style.display = 'none';
    document.getElementById('step-phone').style.display = 'block';
    sendOTP();
}

// ══════════════════════════════════════
// GO BACK
// ══════════════════════════════════════
function goBack() {
    document.getElementById('step-otp').style.display = 'none';
    document.getElementById('step-phone').style.display = 'block';
    document.getElementById('input-phone').value = '';
    document.getElementById('input-otp').value = '';
    clearError('error-phone');
    clearError('error-otp');
    clearInterval(timerInterval);
}

// ══════════════════════════════════════
// SAVE USER TO LOCALSTORAGE
// ══════════════════════════════════════
function saveUser(phone) {
    const users = JSON.parse(localStorage.getItem('gj57_users') || '[]');
    const exists = users.find(u => u.phone === phone);
    if (!exists) {
        users.push({ phone, joinedAt: new Date().toISOString() });
        localStorage.setItem('gj57_users', JSON.stringify(users));
    }
    localStorage.setItem('gj57_current_user', phone);
}

// ══════════════════════════════════════
// TIMER
// ══════════════════════════════════════
function startTimer() {
    timerSeconds = 30;
    const timerEl = document.getElementById('timer');
    const resendBtn = document.getElementById('btn-resend');
    resendBtn.classList.remove('active');
    resendBtn.disabled = true;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timerSeconds--;
        timerEl.textContent = timerSeconds;
        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            resendBtn.classList.add('active');
            resendBtn.disabled = false;
        }
    }, 1000);
}

// ══════════════════════════════════════
// HELPERS
// ══════════════════════════════════════
function showError(id, msg) {
    document.getElementById(id).textContent = msg;
}
function clearError(id) {
    document.getElementById(id).textContent = '';
}
function setLoading(btnId, isLoading, label) {
    const btn = document.getElementById(btnId);
    btn.disabled = isLoading;
    btn.textContent = label;
    isLoading ? btn.classList.add('loading') : btn.classList.remove('loading');
}

// ══════════════════════════════════════
// KEYBOARD SUPPORT
// ══════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('input-phone')
        ?.addEventListener('keydown', e => { if (e.key === 'Enter') sendOTP(); });
    document.getElementById('input-otp')
        ?.addEventListener('keydown', e => { if (e.key === 'Enter') verifyOTP(); });
    document.getElementById('input-otp')
        ?.addEventListener('input', e => { if (e.target.value.length === 6) verifyOTP(); });
});