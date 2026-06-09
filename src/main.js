import "./styles.css";

const sidebar = document.querySelector(".sidebar");
const content = document.querySelector("#view-content");
const toast = document.querySelector(".toast");
const navItems = document.querySelectorAll(".nav-item");
const homeTemplate = content.innerHTML;
const popovers = document.querySelectorAll(".popover");
const modalBackdrop = document.querySelector("#modal-backdrop");
const profileForm = document.querySelector("#profile-form");

const state = {
  activeView: "Home",
  activeProfile: "Default",
  activeAccount: "Steve",
  accountAvatar: "",
  theme: localStorage.getItem("vex-theme") || "blue",
  profiles: [
    { name: "Default", detail: "Balanced", modules: 24 },
    { name: "Movement", detail: "Speed + Utility", modules: 19 },
  ],
  modules: [
    { name: "HUD", detail: "Client status and coordinates", code: "HD", on: true },
    { name: "Fullbright", detail: "Improve visibility in dark areas", code: "FB", on: true },
    { name: "Velocity", detail: "Movement response controls", code: "VL", on: true },
    { name: "ESP", detail: "Entity overlay settings", code: "EP", on: false },
    { name: "Auto Sprint", detail: "Maintain sprint while moving", code: "AS", on: true },
    { name: "No Render", detail: "Hide selected visual effects", code: "NR", on: false },
  ],
};

let toastTimer;
let vexTimer;
let transitionTimer;

document.body.dataset.theme = state.theme;

function showToast(title, message) {
  toast.querySelector("strong").textContent = title;
  toast.querySelector("small").textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

function closePopovers(exception) {
  popovers.forEach((popover) => {
    if (popover !== exception) {
      popover.classList.remove("open");
      popover.setAttribute("aria-hidden", "true");
    }
  });
}

function togglePopover(id) {
  const popover = document.querySelector(id);
  const willOpen = !popover.classList.contains("open");
  closePopovers(popover);
  popover.classList.toggle("open", willOpen);
  popover.setAttribute("aria-hidden", String(!willOpen));
}

function setActiveNav(view) {
  navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.view === view);
  });
  sidebar.classList.remove("open");
}

function enabledModuleCount() {
  return 20 + state.modules.filter((module) => module.on).length;
}

function launchClient(name) {
  const hero = document.querySelector(".hero-card");
  if (hero) {
    hero.classList.remove("launching");
    window.requestAnimationFrame(() => hero.classList.add("launching"));
  }
  showToast("Launch demo", "Minecraft launching requires the desktop app.");
  window.setTimeout(() => {
    showToast("Desktop feature", "Download Vex to launch Minecraft.");
    hero?.classList.remove("launching");
  }, 2200);
}

function renderHome() {
  content.className = "content";
  content.innerHTML = homeTemplate;
  const count = enabledModuleCount();
  const countNode = content.querySelector("#hero-module-count");
  if (countNode) countNode.textContent = count;
  content.querySelector(".play-copy small").textContent = `${state.activeProfile} profile`;
}

function renderModules() {
  const rows = state.modules
    .map(
      (module, index) => `
        <div class="module-row">
          <span class="module-icon">${module.code}</span>
          <span class="row-copy">
            <strong>${module.name}</strong>
            <small>${module.detail}</small>
          </span>
          <button class="toggle ${module.on ? "on" : ""}" data-module-index="${index}"
            aria-label="Toggle ${module.name}" aria-pressed="${module.on}"></button>
        </div>`,
    )
    .join("");

  content.className = "content view-mode";
  content.innerHTML = `
    <div class="view-header">
      <div><h1>Modules</h1></div>
    </div>
    <div class="panel">
      <div class="panel-title"><strong>Active modules</strong><span id="module-summary">${enabledModuleCount()} ENABLED</span></div>
      <div class="module-list">${rows}</div>
    </div>`;
}

function renderConfigs() {
  const rows = state.profiles
    .map(
      (profile) => `
        <div class="config-row">
          <span class="config-badge">${profile.name.charAt(0).toUpperCase()}</span>
          <span class="row-copy">
            <strong>${profile.name}</strong>
            <small>${profile.detail} · ${profile.modules} modules</small>
          </span>
          <span class="row-actions">
            <button class="small-button ${state.activeProfile === profile.name ? "active" : ""}"
              data-select-profile="${profile.name}">
              ${state.activeProfile === profile.name ? "Active" : "Use profile"}
            </button>
            <button class="small-button" data-launch-profile="${profile.name}">Launch</button>
          </span>
        </div>`,
    )
    .join("");

  content.className = "content view-mode";
  content.innerHTML = `
    <div class="view-header">
      <div><h1>Configs</h1></div>
      <button class="primary-button" data-action="new-profile">New profile</button>
    </div>
    <div class="panel">
      <div class="panel-title"><strong>Your profiles</strong><span>${state.profiles.length} SAVED</span></div>
      ${rows}
    </div>`;
}

function renderSettings() {
  content.className = "content view-mode";
  content.innerHTML = `
    <div class="view-header">
      <div><h1>Settings</h1></div>
    </div>
    <div class="panel">
      <div class="panel-title"><strong>Client</strong><span>LOCAL SETTINGS</span></div>
      <div class="setting-row">
        <span class="row-copy"><strong>Game version</strong><small>Target Minecraft installation</small></span>
        <select data-setting="Game version"><option>1.21.5</option><option>1.21.4</option><option>1.20.6</option></select>
      </div>
      <div class="setting-row">
        <span class="row-copy"><strong>Memory</strong><small>Maximum client allocation</small></span>
        <select data-setting="Memory"><option>4 GB</option><option>6 GB</option><option>8 GB</option></select>
      </div>
      <div class="setting-row theme-setting">
        <span class="row-copy"><strong>Theme</strong><small>Client accent color</small></span>
        <span class="theme-options">
          <button class="theme-swatch blue ${state.theme === "blue" ? "active" : ""}" data-theme-value="blue" aria-label="Blue theme"></button>
          <button class="theme-swatch graphite ${state.theme === "graphite" ? "active" : ""}" data-theme-value="graphite" aria-label="Graphite theme"></button>
          <button class="theme-swatch emerald ${state.theme === "emerald" ? "active" : ""}" data-theme-value="emerald" aria-label="Emerald theme"></button>
          <button class="theme-swatch violet ${state.theme === "violet" ? "active" : ""}" data-theme-value="violet" aria-label="Violet theme"></button>
          <button class="theme-swatch crimson ${state.theme === "crimson" ? "active" : ""}" data-theme-value="crimson" aria-label="Crimson theme"></button>
          <button class="theme-swatch amber ${state.theme === "amber" ? "active" : ""}" data-theme-value="amber" aria-label="Amber theme"></button>
          <button class="theme-swatch frost ${state.theme === "frost" ? "active" : ""}" data-theme-value="frost" aria-label="Frost theme"></button>
        </span>
      </div>
      <div class="setting-row">
        <span class="row-copy"><strong>Close after launch</strong><small>Hide Vex when Minecraft starts</small></span>
        <button class="toggle on" data-setting-toggle="Close after launch" aria-pressed="true"></button>
      </div>
      <div class="setting-row">
        <span class="row-copy"><strong>Automatic updates</strong><small>Keep client files current</small></span>
        <button class="toggle on" data-setting-toggle="Automatic updates" aria-pressed="true"></button>
      </div>
    </div>`;
}

function navigate(view) {
  if (view === state.activeView && content.children.length) return;
  const order = ["Home", "Modules", "Configs", "Settings"];
  const direction = order.indexOf(view) >= order.indexOf(state.activeView) ? "forward" : "back";
  content.classList.remove("view-enter", "view-enter-back");
  content.classList.add(direction === "forward" ? "view-exit" : "view-exit-back");
  window.clearTimeout(transitionTimer);
  transitionTimer = window.setTimeout(() => {
  state.activeView = view;
  setActiveNav(view);
  closePopovers();
  if (view === "Home") renderHome();
  if (view === "Modules") renderModules();
  if (view === "Configs") renderConfigs();
  if (view === "Settings") renderSettings();
    content.classList.remove("view-exit", "view-exit-back");
    content.classList.add(direction === "forward" ? "view-enter" : "view-enter-back");
    window.setTimeout(() => content.classList.remove("view-enter", "view-enter-back"), 320);
  }, 150);
}

function setAngryVex() {
  const emblem = document.querySelector(".client-emblem");
  if (!emblem) return;
  emblem.src = "assets/angry-vex.webp";
  emblem.classList.add("angry");
  window.clearTimeout(vexTimer);
  vexTimer = window.setTimeout(() => {
    const current = document.querySelector(".client-emblem");
    if (current) {
      current.src = "assets/vex.gif";
      current.classList.remove("angry");
    }
  }, 5000);
}

function updateAccountUi() {
  document.querySelector(".profile-copy strong").textContent = state.activeAccount;
  document.querySelector(".profile-copy small").textContent =
    state.activeAccount === "Steve" ? "Microsoft account" : "Demo account";
  const avatar = document.querySelector("#active-account-avatar");
  avatar.innerHTML = state.accountAvatar ? `<img src="${state.accountAvatar}" alt="" />` : "S";
  document.querySelectorAll(".account-option").forEach((option) => {
    const active = option.dataset.account === state.activeAccount;
    option.classList.toggle("active", active);
    option.querySelector("small").textContent = active ? "Active" : "Demo account";
  });
}

function openProfileModal() {
  closePopovers();
  modalBackdrop.classList.add("open");
  modalBackdrop.setAttribute("aria-hidden", "false");
  window.setTimeout(() => document.querySelector("#profile-name").focus(), 0);
}

function closeModal() {
  modalBackdrop.classList.remove("open");
  modalBackdrop.setAttribute("aria-hidden", "true");
  profileForm.reset();
}

document.addEventListener("click", (event) => {
  const nav = event.target.closest(".nav-item");
  if (nav) {
    navigate(nav.dataset.view);
    return;
  }

  if (event.target.closest(".brand")) {
    navigate("Home");
    return;
  }

  if (event.target.closest("#notifications-button")) {
    togglePopover("#notifications-popover");
    return;
  }

  if (event.target.closest("#client-options-button")) {
    togglePopover("#options-popover");
    return;
  }

  if (event.target.closest(".profile")) {
    togglePopover("#profile-popover");
    return;
  }

  if (event.target.closest("#minimize-button")) {
    closePopovers();
    if (window.chrome?.webview) {
      window.chrome.webview.postMessage("minimize");
      return;
    }
    document.body.classList.add("window-minimized");
    return;
  }

  if (document.body.classList.contains("window-minimized")) {
    document.body.classList.remove("window-minimized");
    showToast("Vex restored", "Client window is active.");
    return;
  }

  if (event.target.closest("#close-button")) {
    if (window.chrome?.webview) {
      window.chrome.webview.postMessage("close");
      return;
    }
    content.className = "content view-mode";
    content.innerHTML = `
      <div class="view-header"><div><h1>Closed</h1></div></div>
      <div class="panel"><div class="panel-title"><button class="primary-button" data-action="reopen-client">Reopen</button></div></div>`;
    closePopovers();
    return;
  }

  const actionNode = event.target.closest("[data-action]");
  const action = actionNode?.dataset.action;
  if (action === "manage-configs" || action === "open-settings") navigate(action === "manage-configs" ? "Configs" : "Settings");
  if (action === "new-profile") openProfileModal();
  if (action === "close-modal") closeModal();
  if (action === "reopen-client") navigate("Home");
  if (action === "clear-notifications") {
    document.querySelector("#notifications-popover").innerHTML = '<div class="popover-heading"><strong>Notifications</strong></div><div class="notice-item"><div><small>You are all caught up.</small></div></div>';
    document.querySelector(".notification").style.display = "none";
  }
  if (action === "open-folder") showToast("Client folder", "Folder access will connect in the desktop build.");
  if (action === "repair-client") {
    closePopovers();
    showToast("Verifying files", "Client files are being checked...");
    window.setTimeout(() => showToast("Verification complete", "All client files look good."), 1800);
  }
  if (action === "copy-uuid") {
    navigator.clipboard?.writeText("vex-demo-steve-001");
    showToast("Profile ID copied", "vex-demo-steve-001");
    closePopovers();
  }
  if (action === "sign-out") {
    state.activeAccount = "Signed out";
    document.querySelector(".profile-copy strong").textContent = state.activeAccount;
    document.querySelector(".profile-copy small").textContent = "Select an account";
    document.querySelector("#active-account-avatar").textContent = "?";
    document.querySelectorAll(".account-option").forEach((option) => option.classList.remove("active"));
    showToast("Signed out", "Local demo session ended.");
    closePopovers();
  }

  if (event.target.closest("#play-button")) launchClient(`${state.activeProfile} profile`);
  if (event.target.closest("#play-button")) setAngryVex();
  if (event.target.closest(".vex-trigger")) setAngryVex();

  const instance = event.target.closest(".instance-card");
  if (instance) {
    state.activeProfile = instance.dataset.instance;
    launchClient(instance.dataset.instance);
    renderHome();
  }

  const moduleToggle = event.target.closest("[data-module-index]");
  if (moduleToggle) {
    const module = state.modules[Number(moduleToggle.dataset.moduleIndex)];
    module.on = !module.on;
    moduleToggle.classList.toggle("on", module.on);
    moduleToggle.setAttribute("aria-pressed", String(module.on));
    document.querySelector("#module-summary").textContent = `${enabledModuleCount()} ENABLED`;
    document.querySelector(".nav-count").textContent = enabledModuleCount();
    showToast(module.name, module.on ? "Module enabled." : "Module disabled.");
  }

  const selectProfile = event.target.closest("[data-select-profile]");
  if (selectProfile) {
    state.activeProfile = selectProfile.dataset.selectProfile;
    renderConfigs();
    showToast("Profile selected", `${state.activeProfile} is now active.`);
  }

  const launchProfile = event.target.closest("[data-launch-profile]");
  if (launchProfile) launchClient(launchProfile.dataset.launchProfile);

  const settingToggle = event.target.closest("[data-setting-toggle]");
  if (settingToggle) {
    const enabled = !settingToggle.classList.contains("on");
    settingToggle.classList.toggle("on", enabled);
    settingToggle.setAttribute("aria-pressed", String(enabled));
    showToast(settingToggle.dataset.settingToggle, enabled ? "Enabled." : "Disabled.");
  }

  const account = event.target.closest("[data-account]");
  if (account) {
    state.activeAccount = account.dataset.account;
    state.accountAvatar = account.dataset.avatar;
    updateAccountUi();
    closePopovers();
    showToast("Account switched", `${state.activeAccount} is now active.`);
  }

  const theme = event.target.closest("[data-theme-value]");
  if (theme) {
    state.theme = theme.dataset.themeValue;
    document.body.dataset.theme = state.theme;
    localStorage.setItem("vex-theme", state.theme);
    document.querySelectorAll(".theme-swatch").forEach((swatch) =>
      swatch.classList.toggle("active", swatch.dataset.themeValue === state.theme),
    );
    showToast("Theme updated", `${state.theme[0].toUpperCase()}${state.theme.slice(1)} selected.`);
  }

  if (!event.target.closest(".popover, #notifications-button, #client-options-button, .profile")) {
    closePopovers();
  }
});

document.addEventListener("change", (event) => {
  if (event.target.matches("[data-setting]")) {
    showToast(`${event.target.dataset.setting} updated`, event.target.value);
  }
});

document.querySelector(".mobile-menu").addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

document.querySelector(".topbar").addEventListener("pointerdown", (event) => {
  if (window.chrome?.webview && !event.target.closest("button")) {
    window.chrome.webview.postMessage("drag");
  }
});

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.querySelector("#profile-name").value.trim();
  const base = document.querySelector("#profile-base").value;
  if (!name) return;
  state.profiles.push({ name, detail: `Based on ${base}`, modules: base === "Blank" ? 0 : enabledModuleCount() });
  state.activeProfile = name;
  closeModal();
  navigate("Configs");
  showToast("Profile created", `${name} is ready to customize.`);
});

modalBackdrop.addEventListener("click", (event) => {
  if (event.target === modalBackdrop) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && state.activeView === "Home" && !event.target.matches("button, a, input, select")) {
    launchClient(`${state.activeProfile} profile`);
  }
  if (event.key === "Escape") {
    sidebar.classList.remove("open");
    closePopovers();
    closeModal();
  }
});
