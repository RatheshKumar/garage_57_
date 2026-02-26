// ══════════════════════════════════════════════════════
//  GARAGE J57 — server.js
//  Node.js backend for Fast2SMS OTP
//  Run: node server.js
// ══════════════════════════════════════════════════════

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// ── Paste your Fast2SMS API key here ──
const FAST2SMS_API_KEY = "K2BXSqkOp1I0wnGYojHdJmgVT9hLaPZNrzFyUtxDQfAilEbC6uraoRMCLPhZNekAy5xzXw98tHWOgGci";

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.use(express.static('.'));  // serves your HTML/CSS/JS files

// ── Store OTPs in memory (temporary) ──
// Format: { "919047727963": { otp: "123456", expiresAt: Date } }
const otpStore = {};

// ══════════════════════════════════════
// ROUTE 1 — Send OTP
// POST /send-otp
// Body: { phone: "9047727963" }
// ══════════════════════════════════════
app.post('/send-otp', async (req, res) => {
    const { phone } = req.body;

    // Validate phone
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
        return res.status(400).json({
            success: false,
            message: 'Enter a valid 10-digit Indian mobile number.'
        });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Set OTP expiry — 5 minutes
    const expiresAt = Date.now() + 5 * 60 * 1000;

    // Save OTP
    otpStore[phone] = { otp, expiresAt };

    try {
        // Call Fast2SMS API
        const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_API_KEY}&variables_values=${otp}&route=otp&numbers=${phone}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.return === true) {
            console.log(`OTP ${otp} sent to ${phone}`);
            return res.json({
                success: true,
                message: 'OTP sent successfully.'
            });
        } else {
            console.error('Fast2SMS error:', data);
            return res.status(500).json({
                success: false,
                message: data.message?.[0] || 'Failed to send OTP.'
            });
        }

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// ══════════════════════════════════════
// ROUTE 2 — Verify OTP
// POST /verify-otp
// Body: { phone: "9047727963", otp: "123456" }
// ══════════════════════════════════════
app.post('/verify-otp', (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({
            success: false,
            message: 'Phone and OTP are required.'
        });
    }

    const record = otpStore[phone];

    // Check if OTP exists
    if (!record) {
        return res.status(400).json({
            success: false,
            message: 'OTP not found. Please request a new one.'
        });
    }

    // Check if OTP expired
    if (Date.now() > record.expiresAt) {
        delete otpStore[phone];
        return res.status(400).json({
            success: false,
            message: 'OTP expired. Please request a new one.'
        });
    }

    // Check if OTP matches
    if (record.otp !== otp) {
        return res.status(400).json({
            success: false,
            message: 'Wrong OTP. Please try again.'
        });
    }

    // ✅ OTP is correct — delete it so it can't be reused
    delete otpStore[phone];

    console.log(`Phone ${phone} verified successfully`);
    return res.json({
        success: true,
        message: 'Phone verified successfully.'
    });
});

// ══════════════════════════════════════
// START SERVER
// ══════════════════════════════════════
app.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════╗
  ║   Garage J57 Server Running      ║
  ║   http://localhost:${PORT}          ║
  ╚══════════════════════════════════╝
  `);
});