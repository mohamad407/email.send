// resend.js — Resend client setup and email sending logic

const { Resend } = require("resend");
require("dotenv").config();

// Initialize Resend with your API key from .env
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a 6-digit OTP email to the user
 * @param {string} name  — User's name
 * @param {string} email — User's email address
 * @param {string} otp   — The 6-digit OTP code
 * @returns {object}     — Resend API response
 */
async function sendOTPEmail(name, email, otp) {
  const response = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: [email],
    subject: "Your OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f0f0f; border-radius: 12px; border: 1px solid #222;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #10b981, #34d399); border-radius: 12px; line-height: 48px; font-size: 22px; color: #fff;">
            &#10003;
          </div>
        </div>
        <h2 style="color: #ffffff; text-align: center; margin: 0 0 8px 0; font-size: 22px;">Verify Your Email</h2>
        <p style="color: #9ca3af; text-align: center; margin: 0 0 28px 0; font-size: 14px;">
          Hi <strong style="color: #e5e7eb;">${name}</strong>, here is your one-time verification code.
        </p>
        <div style="background: #1a1a1a; border: 1px dashed #333; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #34d399; font-family: 'Courier New', monospace;">${otp}</span>
        </div>
        <p style="color: #6b7280; text-align: center; font-size: 13px; margin: 0 0 6px 0;">
          This code is valid for <strong style="color: #9ca3af;">2 minutes</strong>.
        </p>
        <p style="color: #4b5563; text-align: center; font-size: 12px; margin: 0;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  return response;
}

// Export so server.js can use it
module.exports = { sendOTPEmail };
