// server.js — Express backend with OTP send & verify endpoints

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { sendOTPEmail } = require("./resend");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────
app.use(cors());                     // Allow frontend to call this API
app.use(express.json());             // Parse JSON request bodies

// ── In-memory OTP storage ──────────────────────────────
// Structure: { "user@email.com": { otp: "123456", expiresAt: 1700000000000 } }
const otpStore = {};

/**
 * Helper: Generate a random 6-digit number as a string
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── POST /send-otp ─────────────────────────────────────
app.post("/send-otp", async (req, res) => {
  try {
    const { name, email } = req.body;

    // Basic validation
    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required." });
    }

    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    // Generate OTP and set expiry (2 minutes from now)
    const otp = generateOTP();
    const expiresAt = Date.now() + 2 * 60 * 1000; // 2 min in ms

    // Store in memory
    otpStore[email] = { otp, expiresAt };

    // Send email via Resend
    await sendOTPEmail(name, email, otp);

    console.log(`[OTP Sent] ${email} → ${otp} (expires ${new Date(expiresAt).toISOString()})`);

    res.status(200).json({
      success: true,
      message: "OTP sent to your email.",
    });

  } catch (error) {
    console.error("[Send OTP Error]", error.message);

    // Handle Resend-specific errors
    if (error.message.includes("API key")) {
      return res.status(401).json({ success: false, message: "Invalid Resend API key. Check your .env file." });
    }

    res.status(500).json({ success: false, message: "Failed to send OTP. Please try again." });
  }
});

// ── POST /verify-otp ───────────────────────────────────
app.post("/verify-otp", (req, res) => {
  try {
    const { email, otp } = req.body;

    // Basic validation
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required." });
    }

    // Check if we have a stored OTP for this email
    const stored = otpStore[email];
    if (!stored) {
      return res.status(400).json({ success: false, message: "No OTP found. Please request a new one." });
    }

    // Check if OTP has expired
    if (Date.now() > stored.expiresAt) {
      // Clean up expired entry
      delete otpStore[email];
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    // Compare OTPs
    if (stored.otp !== otp) {
      return res.status(400).json({ success: false, message: "Incorrect OTP. Please try again." });
    }

    // OTP is correct — clean up and return success
    delete otpStore[email];
    console.log(`[OTP Verified] ${email} → signup complete`);

    res.status(200).json({
      success: true,
      message: "Signup successful! Welcome aboard.",
    });

  } catch (error) {
    console.error("[Verify OTP Error]", error.message);
    res.status(500).json({ success: false, message: "Verification failed. Please try again." });
  }
});

// ── Start Server ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
