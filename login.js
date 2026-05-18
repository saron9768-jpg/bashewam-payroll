/** Sign-in credentials (change here or switch to a server when you host with a backend). */
const DEMO_USER = "admin";
const DEMO_PASS = "Bashewam@2026";

function showLoginError(msg) {
  const el = document.getElementById("login-error");
  el.textContent = msg;
  el.hidden = !msg;
}

function tryLogin(username, password, remember) {
  const u = username.trim().toLowerCase();
  const p = password;

  if (!username.trim() || !p) {
    showLoginError("Enter your username and password.");
    return false;
  }

  if (u !== DEMO_USER.toLowerCase() || p !== DEMO_PASS) {
    showLoginError("Incorrect username or password. Contact your administrator if you need help.");
    return false;
  }

  showLoginError("");

  if (remember) {
    localStorage.setItem("bashewam_auth_persist", "1");
    localStorage.setItem("bashewam_user_persist", username.trim());
  } else {
    sessionStorage.setItem("bashewam_auth_session", "1");
    sessionStorage.setItem("bashewam_user_session", username.trim());
  }

  window.location.href = "index.html";
  return true;
}

document.addEventListener("DOMContentLoaded", () => {
  initBrandLogo("login-logo", "login-logo-fallback");

  if (
    sessionStorage.getItem("bashewam_auth_session") === "1" ||
    localStorage.getItem("bashewam_auth_persist") === "1"
  ) {
    window.location.replace("index.html");
    return;
  }

  const form = document.getElementById("login-form");
  const pass = document.getElementById("login-password");
  const toggle = document.getElementById("toggle-password");

  toggle.addEventListener("click", () => {
    const hidden = pass.type === "password";
    pass.type = hidden ? "text" : "password";
    toggle.setAttribute("aria-pressed", hidden ? "true" : "false");
    toggle.textContent = hidden ? "Hide" : "Show";
  });

  document.getElementById("forgot-link").addEventListener("click", (e) => {
    e.preventDefault();
    const box = document.getElementById("forgot-panel");
    box.hidden = !box.hidden;
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    tryLogin(
      document.getElementById("login-username").value,
      pass.value,
      document.getElementById("login-remember").checked
    );
  });
});
