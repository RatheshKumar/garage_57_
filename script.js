// ══════════════════════════════════════════════════════
//  GARAGE J57 — script.js
//  Firebase Phone OTP Authentication + Firestore DB
// ══════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────
// 1. FIREBASE CONFIGURATION
//    ⚠️  Replace ALL values below with YOUR Firebase
//    project credentials from:
//    Firebase Console → Project Settings → Your Apps
// ──────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ──────────────────────────────────────────────────────
// 2. STATE VARIABLES
// ──────────────────────────────────────────────────────
let confirmationResult = null;   // Firebase OTP result object
let timerInterval = null;   // Countdown interval reference
let timerSeconds = 30;     // OTP resend countdown

// ──────────────────────────────────────────────────────
// 3. HELPER FUNCTIONS
// ──────────────────────────────────────────────────────

// Show an error message under a form field
function showError(elementId, message) {
    document.getElementById(elementId).textContent = message;
}

// Clear an error message
function clearError(elementId) {
    document.getElementById(elementId).textContent = '';
}

// Set a button to loading state
function setLoading(buttonId, isLoading, label) {
    const btn = document.getElementById(buttonId);
    if (isLoading) {
        btn.classList.add('loading');
        btn.disabled = true;
        btn.textContent = label || 'Please wait...';
    } else {
        btn.classList.remove('loading');
        btn.disabled = false;
        btn.textContent = label;
    }
}

// Start the resend OTP countdown timer
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
            timerEl.textContent = '0';
        }
    }, 1000);
}

// Validate phone number (E.164 format: +91XXXXXXXXXX)
function isValidPhone(phone) {
    return /^\+[1-9]\d{9,14}$/.test(phone);
}

// ──────────────────────────────────────────────────────
// 4. STEP 1 — SEND OTP
// ──────────────────────────────────────────────────────
function sendOTP() {
    clearError('error-phone');

    const phone = document.getElementById('input-phone').value.trim();

    // Validate phone
    if (!phone) {
        showError('error-phone', 'Please enter your phone number.');
        return;
    }
    if (!isValidPhone(phone)) {
        showError('error-phone', 'Use international format: +91XXXXXXXXXX');
        return;
    }

    setLoading('btn-send-otp', true, 'Sending...');

    // Setup invisible reCAPTCHA (required by Firebase)
    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
        'recaptcha-container',
        { size: 'invisible' }
    );

    // Send OTP via Firebase
    auth.signInWithPhoneNumber(phone, window.recaptchaVerifier)
        .then((result) => {
            confirmationResult = result;

            // Show OTP step
            document.getElementById('step-phone').style.display = 'none';
            document.getElementById('step-otp').style.display = 'block';
            document.getElementById('display-phone').textContent = phone;

            startTimer();
            setLoading('btn-send-otp', false, 'Send OTP');
        })
        .catch((error) => {
            console.error('OTP send error:', error);
            setLoading('btn-send-otp', false, 'Send OTP');

            // Handle specific Firebase errors
            switch (error.code) {
                case 'auth/invalid-phone-number':
                    showError('error-phone', 'Invalid phone number format.');
                    break;
                case 'auth/too-many-requests':
                    showError('error-phone', 'Too many attempts. Please try again later.');
                    break;
                default:
                    showError('error-phone', 'Failed to send OTP. Please try again.');
            }

            // Reset reCAPTCHA on error
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
        });
}

// ──────────────────────────────────────────────────────
// 5. STEP 2 — VERIFY OTP
// ──────────────────────────────────────────────────────
function verifyOTP() {
    clearError('error-otp');

    const otp = document.getElementById('input-otp').value.trim();

    if (!otp || otp.length !== 6) {
        showError('error-otp', 'Please enter the 6-digit OTP.');
        return;
    }

    if (!confirmationResult) {
        showError('error-otp', 'Session expired. Please go back and try again.');
        return;
    }

    setLoading('btn-verify-otp', true, 'Verifying...');

    confirmationResult.confirm(otp)
        .then((result) => {
            const user = result.user;

            // Save or update user in Firestore
            saveUserToDatabase(user);

            // Show success step
            document.getElementById('step-otp').style.display = 'none';
            document.getElementById('step-success').style.display = 'block';
            document.getElementById('success-phone').textContent = user.phoneNumber;

            clearInterval(timerInterval);
            setLoading('btn-verify-otp', false, 'Verify & Log In');
        })
        .catch((error) => {
            console.error('OTP verify error:', error);
            setLoading('btn-verify-otp', false, 'Verify & Log In');

            switch (error.code) {
                case 'auth/invalid-verification-code':
                    showError('error-otp', 'Wrong OTP. Please check and try again.');
                    break;
                case 'auth/code-expired':
                    showError('error-otp', 'OTP expired. Please resend.');
                    break;
                default:
                    showError('error-otp', 'Verification failed. Please try again.');
            }
        });
}

// ──────────────────────────────────────────────────────
// 6. RESEND OTP
// ──────────────────────────────────────────────────────
function resendOTP() {
    clearError('error-otp');

    const phone = document.getElementById('display-phone').textContent;

    // Reset reCAPTCHA
    if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
    }

    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
        'recaptcha-container',
        { size: 'invisible' }
    );

    auth.signInWithPhoneNumber(phone, window.recaptchaVerifier)
        .then((result) => {
            confirmationResult = result;
            startTimer();
            document.getElementById('input-otp').value = '';
        })
        .catch((error) => {
            console.error('Resend OTP error:', error);
            showError('error-otp', 'Failed to resend OTP. Please try again.');
        });
}

// ──────────────────────────────────────────────────────
// 7. GO BACK (Change Number)
// ──────────────────────────────────────────────────────
function goBack() {
    document.getElementById('step-otp').style.display = 'none';
    document.getElementById('step-phone').style.display = 'block';
    document.getElementById('input-phone').value = '';
    document.getElementById('input-otp').value = '';
    clearError('error-phone');
    clearError('error-otp');
    clearInterval(timerInterval);
    confirmationResult = null;

    if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
    }
}

// ──────────────────────────────────────────────────────
// 8. SAVE USER TO FIRESTORE DATABASE
//    Creates a new user record on first login,
//    or updates lastLogin on subsequent logins.
// ──────────────────────────────────────────────────────
function saveUserToDatabase(user) {
    const userRef = db.collection('users').doc(user.uid);

    userRef.get()
        .then((doc) => {
            if (doc.exists) {
                // Existing user — update last login time
                userRef.update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('Existing user logged in:', user.phoneNumber);
            } else {
                // New user — create full record
                userRef.set({
                    uid: user.uid,
                    phone: user.phoneNumber,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                    isActive: true
                });
                console.log('New user created:', user.phoneNumber);
            }
        })
        .catch((error) => {
            console.error('Firestore error:', error);
        });
}

// ──────────────────────────────────────────────────────
// 9. AUTH STATE OBSERVER
//    Detects if user is already logged in on page load.
// ──────────────────────────────────────────────────────
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('User already logged in:', user.phoneNumber);
        // Optional: auto-redirect if already logged in
        // window.location.href = 'dashboard.html';
    } else {
        console.log('No user logged in.');
    }
});

// ──────────────────────────────────────────────────────
// 10. ALLOW PRESSING ENTER KEY ON INPUTS
// ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const phoneInput = document.getElementById('input-phone');
    const otpInput = document.getElementById('input-otp');

    if (phoneInput) {
        phoneInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendOTP();
        });
    }

    if (otpInput) {
        otpInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') verifyOTP();
        });

        // Auto-verify when 6 digits are entered
        otpInput.addEventListener('input', () => {
            if (otpInput.value.length === 6) verifyOTP();
        });
    }
});