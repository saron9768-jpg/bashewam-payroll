/** Client-side session for Bashewam Payroll (sign-in state in the browser). */
const AUTH_SESSION = "bashewam_auth_session";
const USER_SESSION = "bashewam_user_session";
const AUTH_PERSIST = "bashewam_auth_persist";
const USER_PERSIST = "bashewam_user_persist";

function isAuthenticated() {
  return (
    sessionStorage.getItem(AUTH_SESSION) === "1" || localStorage.getItem(AUTH_PERSIST) === "1"
  );
}

function getCurrentUsername() {
  return (
    sessionStorage.getItem(USER_SESSION) ||
    localStorage.getItem(USER_PERSIST) ||
    ""
  );
}

function requireAuth() {
  if (!isAuthenticated()) {
    window.location.replace("login.html");
  }
}

function clearAuth() {
  sessionStorage.removeItem(AUTH_SESSION);
  sessionStorage.removeItem(USER_SESSION);
  localStorage.removeItem(AUTH_PERSIST);
  localStorage.removeItem(USER_PERSIST);
}

function logout() {
  clearAuth();
  window.location.href = "login.html";
}

/**
 * When assets/logo.png exists and loads, show image and hide letter fallback.
 */
function initBrandLogo(imgId, fallbackId) {
  const img = document.getElementById(imgId);
  const fb = document.getElementById(fallbackId);
  if (!img || !fb) return;

  function showLogo() {
    img.classList.add("is-visible");
    fb.classList.add("is-hidden");
  }

  function showFallback() {
    img.classList.remove("is-visible");
    fb.classList.remove("is-hidden");
  }

  img.addEventListener("load", showLogo);
  img.addEventListener("error", showFallback);

  if (img.complete) {
    if (img.naturalWidth > 0) showLogo();
    else showFallback();
  }
}
