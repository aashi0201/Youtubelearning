const API_BASE = "http://localhost:5000/api/auth";

function showMessage(type, text) {
  const box = document.getElementById("authMessage");
  if (!box) return;

  box.className = `authMessage ${type}`;
  box.style.display = "block";
  box.textContent = text;
}

function clearMessage() {
  const box = document.getElementById("authMessage");
  if (!box) return;
  box.style.display = "none";
  box.textContent = "";
  box.className = "authMessage";
}

function setButtonLoading(buttonId, loadingText, isLoading) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;

  if (isLoading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = loadingText;
    btn.disabled = true;
    btn.style.opacity = "0.75";
    btn.style.cursor = "not-allowed";
  } else {
    btn.textContent = btn.dataset.originalText || btn.textContent;
    btn.disabled = false;
    btn.style.opacity = "1";
    btn.style.cursor = "pointer";
  }
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;

  if (input.type === "password") {
    input.type = "text";
    btn.textContent = "Hide";
  } else {
    input.type = "password";
    btn.textContent = "Show";
  }
}

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function updatePasswordStrengthUI() {
  const input = document.getElementById("pass");
  const fill = document.getElementById("strengthFill");
  const text = document.getElementById("strengthText");

  if (!input || !fill || !text) return;

  const value = input.value || "";
  const score = getPasswordStrength(value);

  let width = 0;
  let label = "Password strength: —";
  let colorClass = "";

  if (value.length === 0) {
    width = 0;
    label = "Password strength: —";
  } else if (score <= 2) {
    width = 33;
    label = "Password strength: Weak";
    colorClass = "weak";
  } else if (score <= 4) {
    width = 66;
    label = "Password strength: Medium";
    colorClass = "medium";
  } else {
    width = 100;
    label = "Password strength: Strong";
    colorClass = "strong";
  }

  fill.style.width = `${width}%`;
  fill.className = `strengthFill ${colorClass}`;
  text.textContent = label;
}

function forgotPassword() {
  showMessage("info", "Forgot password flow can be added next. Backend auth is ready for future upgrade.");
}

function googleLoginPlaceholder() {
  showMessage("info", "Google login placeholder added. Real Google OAuth can be integrated next.");
}

async function register() {
  clearMessage();

  const name = (document.getElementById("name")?.value || "").trim();
  const email = (document.getElementById("email")?.value || "").trim().toLowerCase();
  const pass = (document.getElementById("pass")?.value || "").trim();
  const confirmPass = (document.getElementById("confirmPass")?.value || "").trim();
  const agreeTerms = document.getElementById("agreeTerms")?.checked;

  if (!name) return showMessage("error", "Name required");
  if (!email || !email.includes("@")) return showMessage("error", "Valid email required");
  if (!pass || pass.length < 4) return showMessage("error", "Password must be at least 4 characters");
  if (pass !== confirmPass) return showMessage("error", "Passwords do not match");
  if (!agreeTerms) return showMessage("error", "Please agree before continuing");

  try {
    setButtonLoading("registerBtn", "Creating account...", true);

    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        password: pass
      })
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.error || data.details || "Registration failed");
    }

    showMessage("success", "Account created successfully ✅ Redirecting to login...");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1200);
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    showMessage("error", err.message);
  } finally {
    setButtonLoading("registerBtn", "Register", false);
  }
}

async function login() {
  clearMessage();

  const email = (document.getElementById("email")?.value || "").trim().toLowerCase();
  const pass = (document.getElementById("pass")?.value || "").trim();
  const rememberMe = document.getElementById("rememberMe")?.checked;

  if (!email || !email.includes("@")) return showMessage("error", "Valid email required");
  if (!pass) return showMessage("error", "Password required");

  try {
    setButtonLoading("loginBtn", "Signing in...", true);

    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password: pass
      })
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.error || data.details || "Login failed");
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("currentUser", JSON.stringify(data.user));
    localStorage.setItem("rememberMe", rememberMe ? "true" : "false");

    showMessage("success", "Login successful ✅ Redirecting...");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 800);
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    showMessage("error", err.message);
  } finally {
    setButtonLoading("loginBtn", "Login", false);
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("rememberMe");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const passInput = document.getElementById("pass");
  if (passInput) {
    passInput.addEventListener("input", updatePasswordStrengthUI);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;

    if (document.getElementById("registerBtn")) {
      register();
    } else if (document.getElementById("loginBtn")) {
      login();
    }
  });
});