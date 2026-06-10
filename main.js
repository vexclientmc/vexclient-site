const header = document.querySelector(".site-header");
const API_URL = "https://api.vexclient.com";
const accountBackdrop = document.querySelector("#account-backdrop");
const accountResult = document.querySelector("#account-result");
const turnstileSiteKey = document.querySelector('meta[name="turnstile-site-key"]')?.content;
let turnstileWidgetId = null;

function showAccountMessage(message, type = "") {
  accountResult.textContent = message;
  accountResult.dataset.type = type;
}

function openAccount(tab = "login") {
  accountBackdrop.classList.add("open");
  accountBackdrop.setAttribute("aria-hidden", "false");
  selectAccountTab(tab);
}

function closeAccount() {
  accountBackdrop.classList.remove("open");
  accountBackdrop.setAttribute("aria-hidden", "true");
}

function selectAccountTab(tab) {
  document.querySelectorAll("[data-account-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.accountTab === tab);
  });
  document.querySelector("#login-form").hidden = tab !== "login";
  document.querySelector("#register-form").hidden = tab !== "register";
  showAccountMessage("");
  if (tab === "register" && window.turnstile && turnstileWidgetId === null && turnstileSiteKey && !turnstileSiteKey.startsWith("REPLACE_")) {
    turnstileWidgetId = window.turnstile.render("#turnstile-slot", { sitekey: turnstileSiteKey, theme: "dark" });
  }
}

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "The request failed.");
  return body;
}

document.querySelectorAll("[data-open-account]").forEach((button) => button.addEventListener("click", () => openAccount()));
document.querySelector("[data-close-account]").addEventListener("click", closeAccount);
accountBackdrop.addEventListener("click", (event) => { if (event.target === accountBackdrop) closeAccount(); });
document.querySelectorAll("[data-account-tab]").forEach((button) => {
  button.addEventListener("click", () => selectAccountTab(button.dataset.accountTab));
});

document.querySelector("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  showAccountMessage("Signing in...");
  try {
    const result = await api("/account/login", {
      method: "POST",
      body: JSON.stringify({ identity: form.get("identity"), password: form.get("password") }),
    });
    localStorage.setItem("vex-web-refresh", result.refreshToken);
    showAccountMessage(`Signed in as ${result.user.username}. Open Vex to use desktop features.`, "success");
  } catch (error) {
    showAccountMessage(error.message, "error");
  }
});

document.querySelector("#register-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!window.turnstile || turnstileWidgetId === null) {
    return showAccountMessage("Turnstile site key is not configured yet.", "error");
  }
  const form = new FormData(event.currentTarget);
  showAccountMessage("Creating account...");
  try {
    await api("/account/register", {
      method: "POST",
      body: JSON.stringify({
        username: form.get("username"),
        email: form.get("email"),
        password: form.get("password"),
        turnstileToken: window.turnstile.getResponse(turnstileWidgetId),
      }),
    });
    showAccountMessage("Account created. Check your email to verify it.", "success");
    event.currentTarget.reset();
    window.turnstile.reset(turnstileWidgetId);
  } catch (error) {
    showAccountMessage(error.message, "error");
    window.turnstile.reset(turnstileWidgetId);
  }
});

const verificationToken = new URLSearchParams(location.search).get("token");
const requestedAccountTab = new URLSearchParams(location.search).get("account");
if (requestedAccountTab === "register" || requestedAccountTab === "login") {
  openAccount(requestedAccountTab);
}
if (verificationToken) {
  openAccount("login");
  showAccountMessage("Verifying your email...");
  api("/account/verify-email", {
    method: "POST",
    body: JSON.stringify({ token: verificationToken }),
  }).then(() => {
    showAccountMessage("Email verified. You can log in now.", "success");
    history.replaceState({}, "", location.pathname);
  }).catch((error) => showAccountMessage(error.message, "error"));
}

window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 24);
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth" });
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.14 });

document.querySelectorAll(".section-copy, .launcher-window, .feature-intro, .feature-grid article, .download-card")
  .forEach((element) => observer.observe(element));
