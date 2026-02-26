// ══════════════════════════════════════
// Fast2SMS OTP System (Free for India)
// ══════════════════════════════════════

// 1. Go to fast2sms.com → Sign up → 
//    Dashboard → Dev API → Copy API key
const FAST2SMS_API_KEY = "K2BXSqkOp1I0wnGYojHdJmgVT9hLaPZNrzFyUtxDQfAilEbC6uraoRMCLPhZNekAy5xzXw98tHWOgGci";

let generatedOTP = null;
let timerInterval = null;
let timerSeconds = 30;

// ── Generate 6-digit OTP ──
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Send OTP via Fast2SMS ──
async function sendOTP() {
    clearError('error-phone');

    const phone = document.getElementById('input-phone').value.trim();

    if (!phone) {
        showError('error-phone', 'Please enter your phone number.');
        return;
    }

    // Indian number validation (10 digits)
    if (!/^[6-9]\d{9}$/.test(phone)) {
        showError('error-phone', 'Enter valid 10-digit Indian mobile number.');
        return;
    }

    setLoading('btn-send-otp', true, 'Sending...');

    generatedOTP = generateOTP();

    try {
        const response = await fetch(
            `https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_API_KEY}&variables_values=${generatedOTP}&route=otp&numbers=${phone}`,
            { method: 'GET' }
        );

        const data = await response.json();

        if (data.return === true) {
            // OTP sent successfully
            document.getElementById('step-phone').style.display = 'none';
            document.getElementById('step-otp').style.display = 'block';
            document.getElementById('display-phone').textContent = '+91 ' + phone;
            startTimer();
        } else {
            showError('error-phone', 'Failed to send OTP. Check your API key.');
        }

    } catch (error) {
        showError('error-phone', 'Network error. Please try again.');
        console.error(error);
    }

    setLoading('btn-send-otp', false, 'Send OTP');
}

// ── Verify OTP ──
function verifyOTP() {
    clearError('error-otp');

    const enteredOTP = document.getElementById('input-otp').value.trim();

    if (!enteredOTP || enteredOTP.length !== 6) {
        showError('error-otp', 'Please enter the 6-digit OTP.');
        return;
    }

    if (enteredOTP === generatedOTP) {
        // ✅ OTP correct
        const phone = document.getElementById('display-phone').textContent;
        document.getElementById('step-otp').style.display = 'none';
        document.getElementById('step-success').style.display = 'block';
        document.getElementById('success-phone').textContent = phone;
        clearInterval(timerInterval);
        saveUserToLocalStorage(phone);
    } else {
        // ❌ OTP wrong
        showError('error-otp', 'Wrong OTP. Please try again.');
    }
}

// ── Resend OTP ──
function resendOTP() {
    clearError('error-otp');
    document.getElementById('input-otp').value = '';
    const phone = document.getElementById('display-phone')
        .textContent.replace('+91 ', '');
    document.getElementById('input-phone').value = phone;
    document.getElementById('step-otp').style.display = 'none';
    document.getElementById('step-phone').style.display = 'block';
    sendOTP();
}

// ── Go Back ──
function goBack() {
    document.getElementById('step-otp').style.display = 'none';
    document.getElementById('step-phone').style.display = 'block';
    document.getElementById('input-phone').value = '';
    document.getElementById('input-otp').value = '';
    clearError('error-phone');
    clearError('error-otp');
    clearInterval(timerInterval);
    generatedOTP = null;
}

// ── Save user to LocalStorage (no backend needed) ──
function saveUserToLocalStorage(phone) {
    const users = JSON.parse(localStorage.getItem('gj57_users') || '[]');
    const exists = users.find(u => u.phone === phone);
    if (!exists) {
        users.push({ phone, joinedAt: new Date().toISOString() });
        localStorage.setItem('gj57_users', JSON.stringify(users));
        console.log('New user saved:', phone);
    }
    localStorage.setItem('gj57_current_user', phone);
}

// ── Timer ──
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

// ── Helpers ──
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
    isLoading
        ? btn.classList.add('loading')
        : btn.classList.remove('loading');
}

// ── Enter key support ──
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('input-phone')
        ?.addEventListener('keydown', e => { if (e.key === 'Enter') sendOTP(); });
    document.getElementById('input-otp')
        ?.addEventListener('keydown', e => { if (e.key === 'Enter') verifyOTP(); });
    document.getElementById('input-otp')
        ?.addEventListener('input', e => {
            if (e.target.value.length === 6) verifyOTP();
        });
});