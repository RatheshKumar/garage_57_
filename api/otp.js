// ══════════════════════════════════════════════════════
//  GARAGE J57 — api/otp.js
//  Vercel Serverless Function for Fast2SMS OTP
// ══════════════════════════════════════════════════════

const fetch = require('node-fetch');

// ── In-memory OTP store ──
// Note: Vercel functions are stateless so this resets
// between cold starts. For production use a database.
const otpStore = {};

module.exports = async (req, res) => {

    // ── Allow CORS ──
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { action, phone, otp } = req.body;

    // ══════════════════════════════════════
    // ACTION: send
    // ══════════════════════════════════════
    if (action === 'send') {

        if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Enter a valid 10-digit Indian mobile number.'
            });
        }

        // Generate 6-digit OTP
        const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

        // Save with 5 min expiry
        otpStore[phone] = {
            otp: generatedOTP,
            expiresAt: Date.now() + 5 * 60 * 1000
        };

        try {
            // ⚠️ Paste your Fast2SMS API key in Vercel Environment Variables
            // Variable name: FAST2SMS_API_KEY
            const API_KEY = process.env.FAST2SMS_API_KEY;

            const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${API_KEY}&variables_values=${generatedOTP}&route=otp&numbers=${phone}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.return === true) {
                console.log(`OTP sent to ${phone}`);
                return res.json({ success: true, message: 'OTP sent successfully.' });
            } else {
                console.error('Fast2SMS error:', data);
                return res.status(500).json({
                    success: false,
                    message: data.message?.[0] || 'Failed to send OTP.'
                });
            }

        } catch (error) {
            console.error('Server error:', error);
            return res.status(500).json({ success: false, message: 'Server error.' });
        }
    }

    // ══════════════════════════════════════
    // ACTION: verify
    // ══════════════════════════════════════
    if (action === 'verify') {

        if (!phone || !otp) {
            return res.status(400).json({ success: false, message: 'Phone and OTP required.' });
        }

        const record = otpStore[phone];

        if (!record) {
            return res.status(400).json({ success: false, message: 'OTP not found. Request a new one.' });
        }

        if (Date.now() > record.expiresAt) {
            delete otpStore[phone];
            return res.status(400).json({ success: false, message: 'OTP expired. Request a new one.' });
        }

        if (record.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Wrong OTP. Please try again.' });
        }

        delete otpStore[phone];
        return res.json({ success: true, message: 'Phone verified successfully.' });
    }

    return res.status(400).json({ success: false, message: 'Invalid action.' });
};