// script.js — Frontend logic for OTP signup flow

// ── DOM Elements ─────────────────────────────────────────
const API_BASE = "https://email-send-uix3.onrender.com";
const signupForm = document.getElementById("signup-form");
const verifyForm = document.getElementById("verify-form");
const successSection = document.getElementById("success-section");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const sentEmailDisplay = document.getElementById("sent-email-display");

const sendBtn = document.getElementById("send-btn");
const verifyBtn = document.getElementById("verify-btn");
const backBtn = document.getElementById("back-btn");
const restartBtn = document.getElementById("restart-btn");
const resendBtn = document.getElementById("resend-btn");

const toastEl = document.getElementById("toast");
const timerEl = document.getElementById("timer");

// Step indicators
const step1 = document.getElementById("step1-indicator");
const step2 = document.getElementById("step2-indicator");
const step3 = document.getElementById("step3-indicator");
const stepLine = document.getElementById("step-line");
const stepLine2 = document.getElementById("step-line-2");

// OTP digit inputs
const otpDigits = document.querySelectorAll(".otp-digit");

// Timer state
let timerInterval = null;
let timerSeconds = 120; // 2 minutes

// ── Toast Notification ──────────────────────────────────
// Shows a temporary message at the top of the card
let toastTimeout = null;

function showToast(message, type) {
  // Clear any existing timeout
  if (toastTimeout) clearTimeout(toastTimeout);

  // Remove previous classes and text
  toastEl.className = "toast";
  toastEl.textContent = "";

  // Force reflow so the animation restarts
  void toastEl.offsetWidth;

  toastEl.textContent = message;
  toastEl.classList.add(type, "show");

  // Auto-hide after 4 seconds
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 4000);
}

// ── Step Navigation ─────────────────────────────────────
function goToStep(stepNumber) {
  // Hide all sections
  signupForm.classList.add("hidden");
  verifyForm.classList.add("hidden");
  successSection.classList.add("hidden");

  // Reset all step indicators
  [step1, step2, step3].forEach((s) => s.classList.remove("active"));
  stepLine.classList.remove("filled");
  stepLine2.classList.remove("filled");

  // Show the correct section and activate the right step
  if (stepNumber === 1) {
    signupForm.classList.remove("hidden");
    step1.classList.add("active");
  } else if (stepNumber === 2) {
    verifyForm.classList.remove("hidden");
    step1.classList.add("active");
    step2.classList.add("active");
    stepLine.classList.add("filled");
  } else if (stepNumber === 3) {
    successSection.classList.remove("hidden");
    step1.classList.add("active");
    step2.classList.add("active");
    step3.classList.add("active");
    stepLine.classList.add("filled");
    stepLine2.classList.add("filled");
  }
}

// ── Timer ───────────────────────────────────────────────
function startTimer() {
  // Clear any existing timer
  if (timerInterval) clearInterval(timerInterval);

  timerSeconds = 120;
  timerEl.classList.remove("expired");
  resendBtn.classList.add("hidden");
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timerSeconds--;

    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timerEl.classList.add("expired");
      resendBtn.classList.remove("hidden");
    }

    updateTimerDisplay();
  }, 1000);
}

function updateTimerDisplay() {
  const mins = Math.floor(timerSeconds / 60).toString().padStart(2, "0");
  const secs = (timerSeconds % 60).toString().padStart(2, "0");
  timerEl.textContent = `${mins}:${secs}`;
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// ── OTP Input Logic ─────────────────────────────────────
// Each digit box auto-advances focus and allows backspace navigation

otpDigits.forEach((digit, index) => {
  // Only allow numeric characters
  digit.addEventListener("input", (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");

    if (value) {
      e.target.value = value[0]; // Keep only first digit
      e.target.classList.add("filled");

      // Move to next input
      if (index < otpDigits.length - 1) {
        otpDigits[index + 1].focus();
      }
    } else {
      e.target.value = "";
      e.target.classList.remove("filled");
    }

    checkOTPComplete();
  });

  // Handle backspace: clear current and go to previous
  digit.addEventListener("keydown", (e) => {
    if (e.key === "Backspace") {
      if (!digit.value && index > 0) {
        otpDigits[index - 1].focus();
        otpDigits[index - 1].value = "";
        otpDigits[index - 1].classList.remove("filled");
      } else {
        digit.value = "";
        digit.classList.remove("filled");
      }
      checkOTPComplete();
    }

    // Allow arrow key navigation
    if (e.key === "ArrowLeft" && index > 0) {
      otpDigits[index - 1].focus();
    }
    if (e.key === "ArrowRight" && index < otpDigits.length - 1) {
      otpDigits[index + 1].focus();
    }
  });

  // Select all text on focus for easy replacement
  digit.addEventListener("focus", () => {
    digit.select();
  });

  // Handle paste: distribute digits across inputs
  digit.addEventListener("paste", (e) => {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData)
      .getData("text")
      .replace(/[^0-9]/g, "");

    for (let i = 0; i < paste.length && i < otpDigits.length; i++) {
      otpDigits[i].value = paste[i];
      otpDigits[i].classList.add("filled");
    }

    // Focus the next empty input, or the last one
    const nextEmpty = Array.from(otpDigits).findIndex((d) => !d.value);
    if (nextEmpty !== -1) {
      otpDigits[nextEmpty].focus();
    } else {
      otpDigits[otpDigits.length - 1].focus();
    }

    checkOTPComplete();
  });
});

// Enable/disable verify button based on whether all 6 digits are filled
function checkOTPComplete() {
  const allFilled = Array.from(otpDigits).every((d) => d.value.length === 1);
  verifyBtn.disabled = !allFilled;
}

// Get the full 6-digit OTP string from all inputs
function getOTPValue() {
  return Array.from(otpDigits).map((d) => d.value).join("");
}

// Clear all OTP inputs
function clearOTPInputs() {
  otpDigits.forEach((d) => {
    d.value = "";
    d.classList.remove("filled");
  });
  verifyBtn.disabled = true;
}

// ── Send OTP ────────────────────────────────────────────
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();

  // Basic client-side validation
  if (!name) {
    showToast("Please enter your name.", "error");
    nameInput.focus();
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast("Please enter a valid email address.", "error");
    emailInput.focus();
    return;
  }

  // Show loading state on button
  sendBtn.classList.add("loading");
  sendBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to send OTP.");
    }

    // OTP sent successfully — switch to verify step
    sentEmailDisplay.textContent = email;
    clearOTPInputs();
    goToStep(2);
    startTimer();

    // Focus the first OTP input
    setTimeout(() => otpDigits[0].focus(), 100);

    showToast("OTP sent! Check your inbox.", "success");

  } catch (error) {
    showToast(error.message, "error");
  } finally {
    sendBtn.classList.remove("loading");
    sendBtn.disabled = false;
  }
});

// ── Verify OTP ──────────────────────────────────────────
verifyForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const otp = getOTPValue();

  if (otp.length !== 6) {
    showToast("Please enter all 6 digits.", "error");
    return;
  }

  // Show loading state
  verifyBtn.classList.add("loading");
  verifyBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Verification failed.");
    }

    // Success — stop timer and go to success step
    stopTimer();
    document.getElementById("success-name").textContent = nameInput.value.trim();
    goToStep(3);

  } catch (error) {
    showToast(error.message, "error");

    // Shake the OTP inputs on error for feedback
    const group = document.querySelector(".otp-input-group");
    group.style.animation = "none";
    void group.offsetWidth; // Force reflow
    group.style.animation = "shake 0.4s ease";

    // Clear OTP inputs after wrong attempt
    clearOTPInputs();
    setTimeout(() => otpDigits[0].focus(), 400);
  } finally {
    verifyBtn.classList.remove("loading");
    checkOTPComplete();
  }
});

// ── Resend OTP ──────────────────────────────────────────
resendBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();

  resendBtn.disabled = true;
  resendBtn.textContent = "Sending...";

  try {
    const response = await fetch(`${API_BASE}/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to resend OTP.");
    }

    clearOTPInputs();
    startTimer();
    setTimeout(() => otpDigits[0].focus(), 100);
    showToast("New OTP sent! Check your inbox.", "success");

  } catch (error) {
    showToast(error.message, "error");
  } finally {
    resendBtn.disabled = false;
    resendBtn.textContent = "Resend code";
  }
});

// ── Back Button ─────────────────────────────────────────
backBtn.addEventListener("click", () => {
  stopTimer();
  clearOTPInputs();
  goToStep(1);
});

// ── Restart Button ──────────────────────────────────────
restartBtn.addEventListener("click", () => {
  // Reset everything to initial state
  nameInput.value = "";
  emailInput.value = "";
  clearOTPInputs();
  stopTimer();
  goToStep(1);

  // Refocus name input
  setTimeout(() => nameInput.focus(), 100);
});

// ── Shake Animation (injected dynamically) ──────────────
const shakeStyle = document.createElement("style");
shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-6px); }
    80% { transform: translateX(6px); }
  }
`;
document.head.appendChild(shakeStyle);

// ── Focus name input on page load ───────────────────────
window.addEventListener("DOMContentLoaded", () => {
  nameInput.focus();
});
