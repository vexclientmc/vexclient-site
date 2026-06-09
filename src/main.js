import "./styles.css";

const CLIENT_ID = "5cd54c95-8b6e-4e72-868b-fe7f52a12fcb";
const sidebar = document.querySelector(".sidebar");
const content = document.querySelector("#view-content");
const homeTemplate = content.innerHTML;
const toast = document.querySelector(".toast");
const modal = document.querySelector("#modal-backdrop");
const profileForm = document.querySelector("#profile-form");
const navItems = [...document.querySelectorAll(".nav-item")];

const defaults = {
  theme: "blue", memory: 4, selectedProfile: "default", selectedAccount: null,
  clientId: CLIENT_ID,
  authScope: "offline_access openid profile email",
  closeAfterLaunch: false, allowPrereleaseMods: false,
  profiles: [
    { id: "default", name: "Default", version: "1.21.5", loader: "Vanilla", memory: 4, mods: [], lastPlayed: null },
    { id: "fabric", name: "Fabric", version: "1.21.5", loader: "Fabric", memory: 4, mods: [], lastPlayed: null },
  ],
  accounts: [],
};
const saved = JSON.parse(localStorage.getItem("vex-state") || "{}");
const state = { ...defaults, ...saved, profiles: saved.profiles || defaults.profiles, accounts: saved.accounts || [] };
let view = "Home";
let toastTimer;

const save = () => localStorage.setItem("vex-state", JSON.stringify(state));
const activeProfile = () => state.profiles.find((p) => p.id === state.selectedProfile) || state.profiles[0];
const activeAccount = () => state.accounts.find((a) => a.id === state.selectedAccount);
const hasNativeBridge = Boolean(window.chrome?.webview);
const native = (type, payload = {}) => {
  if (hasNativeBridge) return window.chrome.webview.postMessage(JSON.stringify({ type, ...payload }));
  if (["auth.start", "launch", "mod.toggle"].includes(type)) {
    notify("Desktop app required", "Download Vex for Windows to sign in, install mods, and launch Minecraft.");
  }
};
const isInside = (selector, event) => Boolean(event.target.closest(selector));

function notify(title, message) {
  toast.querySelector("strong").textContent = title;
  toast.querySelector("small").textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 3000);
}

function applyTheme(themeName) {
  state.theme = themeName;
  document.body.dataset.theme = state.theme;
  save();
  document.querySelectorAll("[data-theme]").forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === state.theme);
  });
}

function updateAccount() {
  const account = activeAccount();
  document.querySelector(".profile-copy strong").textContent = account?.username || "Sign in";
  document.querySelector(".profile-copy small").textContent = account ? "Microsoft account" : "Microsoft account";
  const avatar = document.querySelector("#active-account-avatar");
  avatar.innerHTML = account?.head ? `<img src="${account.head}" alt="" />` : "+";
}

function setNav(name) {
  view = name;
  navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === name));
  sidebar.classList.remove("open");
}

function renderHome() {
  content.className = "content";
  content.innerHTML = homeTemplate;
  const profile = activeProfile();
  content.querySelector("#hero-version").textContent = profile?.version || "No profile";
  content.querySelector("#hero-loader").textContent = profile?.loader || "";
  content.querySelector(".play-copy small").textContent = profile?.name || "Create a profile";
  if (!hasNativeBridge) content.querySelector(".keycap").textContent = "APP";
}

function renderProfiles() {
  content.className = "content view-mode";
  content.innerHTML = `
    <div class="view-header"><h1>Profiles</h1><button class="primary-button" data-action="new-profile">New profile</button></div>
    <div class="panel"><div class="panel-title"><strong>Installations</strong><span>${state.profiles.length} PROFILES</span></div>
    ${state.profiles.map((p) => `<div class="config-row">
      <span class="config-badge">${p.name[0]}</span><span class="row-copy"><strong>${p.name}</strong><small>${p.version} · ${p.loader} · ${p.memory} GB</small></span>
      <span class="row-actions"><button class="small-button ${p.id === state.selectedProfile ? "active" : ""}" data-select="${p.id}">${p.id === state.selectedProfile ? "Selected" : "Select"}</button><button class="small-button" data-launch="${p.id}">Launch</button><button class="small-button" data-delete="${p.id}">Delete</button></span>
    </div>`).join("") || `<div class="empty-state"><h3>No profiles</h3><p>Create a profile to install Minecraft.</p></div>`}</div>`;
}

function modCard(mod) {
  const installed = activeProfile()?.mods?.some((item) => item.project_id === mod.project_id);
  return `<article class="mod-card"><img src="${mod.icon_url || "/assets/vex-face.png"}" alt="" /><div><strong>${mod.title}</strong><small>${mod.description}</small><span>${mod.author} · ${Number(mod.downloads).toLocaleString()} downloads</span></div><button class="small-button ${installed ? "active" : ""}" data-mod="${mod.project_id}" data-slug="${mod.slug}">${installed ? "Remove" : "Install"}</button></article>`;
}

async function searchMods(query = "") {
  const profile = activeProfile();
  const loader = profile.loader.toLowerCase();
  const facets = [["project_type:mod"], [`versions:${profile.version}`]];
  if (loader !== "vanilla") facets.push([`categories:${loader}`]);
  const params = new URLSearchParams({ query, limit: "20", facets: JSON.stringify(facets) });
  const results = document.querySelector("#mod-results");
  results.innerHTML = `<div class="empty-state">Searching...</div>`;
  try {
    const response = await fetch(`https://api.modrinth.com/v2/search?${params}`);
    if (!response.ok) throw new Error("Search failed");
    const data = await response.json();
    results.innerHTML = data.hits.map(modCard).join("") || `<div class="empty-state">No compatible mods found.</div>`;
  } catch {
    results.innerHTML = `<div class="empty-state">Mod search failed. Check your connection.</div>`;
  }
}

function renderMods() {
  const profile = activeProfile();
  content.className = "content view-mode";
  content.innerHTML = `<div class="view-header"><h1>Mods</h1><p>${profile.version} · ${profile.loader}</p></div>
    <div class="mod-toolbar"><input id="mod-search" placeholder="Search compatible mods" /><button class="primary-button" data-action="search-mods">Search</button></div>
    <div id="mod-results" class="mods-grid"></div>`;
  searchMods();
}

function renderSettings() {
  content.className = "content view-mode";
  content.innerHTML = `<div class="view-header"><h1>Settings</h1></div><div class="panel">
    <div class="setting-row"><span class="row-copy"><strong>Microsoft Client ID</strong><small>Must be approved for Minecraft Services</small></span><input id="client-id-input" value="${state.clientId || CLIENT_ID}" spellcheck="false" /></div>
    <div class="setting-row"><span class="row-copy"><strong>Microsoft Scope</strong><small>OAuth Device Code scopes</small></span><input id="auth-scope-input" value="${state.authScope || defaults.authScope}" spellcheck="false" /></div>
    <div class="setting-row"><span class="row-copy"><strong>Memory</strong><small id="memory-label">${state.memory} GB allocated</small></span><input type="range" id="memory-slider" min="1" max="16" value="${state.memory}" /></div>
    <div class="setting-row"><span class="row-copy"><strong>Theme</strong><small>Launcher appearance</small></span><span class="theme-options">${["blue","graphite","emerald","violet","crimson","amber","frost"].map((t) => `<button class="theme-swatch ${t} ${state.theme === t ? "active" : ""}" data-theme="${t}" aria-label="${t} theme"></button>`).join("")}</span></div>
    <div class="setting-row"><span class="row-copy"><strong>Close after launch</strong><small>Hide Vex when Minecraft starts</small></span><button class="toggle ${state.closeAfterLaunch ? "on" : ""}" data-toggle="closeAfterLaunch"></button></div>
    <div class="setting-row"><span class="row-copy"><strong>Prerelease mods</strong><small>Allow beta and alpha versions</small></span><button class="toggle ${state.allowPrereleaseMods ? "on" : ""}" data-toggle="allowPrereleaseMods"></button></div>
  </div>`;
}

function renderVexPlus() {
  content.className = "content view-mode";
  content.innerHTML = `<div class="view-header"><h1>Vex+</h1></div><div class="pricing-grid">
    <article class="pricing-card"><span>MONTHLY</span><h2>$4.99</h2><p>No ads, premium themes, cloud-ready profiles, priority updates.</p><button class="primary-button" data-purchase="monthly">Subscribe</button></article>
    <article class="pricing-card featured"><span>LIFETIME</span><h2>$39</h2><p>Permanent customization, profile icons, and advanced modpack tools.</p><button class="primary-button" data-purchase="lifetime">Buy Lifetime</button></article>
  </div><button class="text-button" data-purchase="restore">Restore Purchase</button>`;
}

function navigate(name, source = "") {
  if (name === "Settings" && source !== "settings-button") return;
  setNav(name);
  if (name === "Home") renderHome();
  if (name === "Profiles") renderProfiles();
  if (name === "Mods") renderMods();
  if (name === "Settings") renderSettings();
  if (name === "Vex+") renderVexPlus();
}

function launch(profileId = state.selectedProfile) {
  const profile = state.profiles.find((p) => p.id === profileId);
  if (!hasNativeBridge) return native("launch", { profileId });
  if (!activeAccount()) return notify("Not signed in", "Sign in with Microsoft before launching.");
  notify("Preparing launch", `${profile.name} · ${profile.version}`);
  native("launch", { profileId, accountId: activeAccount().id, username: activeAccount().username, version: profile.version, loader: profile.loader, memory: profile.memory || state.memory });
}

document.addEventListener("click", async (event) => {
  if (event.target.closest(".profile")) return native("auth.start", { clientId: state.clientId || CLIENT_ID, scope: state.authScope || defaults.authScope });
  if (event.target.closest("#play-button")) return launch();
  if (event.target.closest("[data-action='manage-configs']")) return navigate("Profiles");
  if (event.target.closest("[data-action='new-profile']")) return modal.classList.add("open");
  if (event.target.closest("[data-action='close-modal']")) return modal.classList.remove("open");
  if (event.target.closest("[data-action='search-mods']")) return searchMods(document.querySelector("#mod-search").value);
  const select = event.target.closest("[data-select]");
  if (select) { state.selectedProfile = select.dataset.select; save(); return renderProfiles(); }
  const launchButton = event.target.closest("[data-launch]");
  if (launchButton) return launch(launchButton.dataset.launch);
  const remove = event.target.closest("[data-delete]");
  if (remove) { native("profile.delete", { profileId: remove.dataset.delete }); state.profiles = state.profiles.filter((p) => p.id !== remove.dataset.delete); state.selectedProfile = state.profiles[0]?.id || null; save(); return renderProfiles(); }
  const mod = event.target.closest("[data-mod]");
  if (mod) { const p = activeProfile(); native("mod.toggle", { profileId: state.selectedProfile, projectId: mod.dataset.mod, slug: mod.dataset.slug, version: p.version, loader: p.loader, allowPrerelease: state.allowPrereleaseMods }); return notify("Mod queued", mod.textContent === "Install" ? "Checking compatibility and dependencies." : "Removing mod."); }
  const theme = event.target.closest("[data-theme]");
  if (theme) return applyTheme(theme.dataset.theme);
  const toggle = event.target.closest("[data-toggle]");
  if (toggle) { state[toggle.dataset.toggle] = !state[toggle.dataset.toggle]; toggle.classList.toggle("on", state[toggle.dataset.toggle]); return save(); }
  if (event.target.closest("[data-purchase]")) notify("Vex+", "Payment integration is not connected yet.");
  if (event.target.closest("#minimize-button")) native("window.minimize");
  if (event.target.closest("#close-button")) native("window.close");
});

document.querySelector(".brand")?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  navigate("Home");
});

navItems.forEach((item) => {
  item.type = "button";
  item.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const destination = item.dataset.view;
    if (destination === "Settings") navigate(destination, "settings-button");
    else if (["Home", "Mods", "Profiles", "Vex+"].includes(destination)) navigate(destination);
  });
});

document.addEventListener("input", (event) => {
  if (event.target.id === "memory-slider") {
    state.memory = Number(event.target.value);
    document.querySelector("#memory-label").textContent = `${state.memory} GB allocated`;
    save();
  }
  if (event.target.id === "client-id-input") {
    state.clientId = event.target.value.trim();
    save();
  }
  if (event.target.id === "auth-scope-input") {
    state.authScope = event.target.value.trim();
    save();
  }
});

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const profile = {
    id: crypto.randomUUID(), name: document.querySelector("#profile-name").value.trim(),
    version: document.querySelector("#profile-version").value,
    loader: document.querySelector("#profile-loader").value,
    memory: state.memory, mods: [], lastPlayed: null,
  };
  state.profiles.push(profile); state.selectedProfile = profile.id; save();
  native("profile.save", { profile });
  modal.classList.remove("open"); profileForm.reset(); navigate("Profiles");
});

window.chrome?.webview?.addEventListener("message", (event) => {
  let message;
  try {
    message = typeof event.data === "string" ? JSON.parse(event.data.replace(/^\uFEFF/, "")) : event.data;
  } catch {
    return notify("Native message failed", "Vex received an unreadable launcher response.");
  }
  if (message.type === "auth.deviceCode") notify("Microsoft sign in", `Go to ${message.url} and enter ${message.code}`);
  if (message.type === "auth.success") {
    state.accounts = [...state.accounts.filter((a) => a.id !== message.account.id), message.account];
    state.selectedAccount = message.account.id; save(); updateAccount(); notify("Signed in", message.account.username);
  }
  if (message.type === "error") notify(message.title || "Error", message.message);
  if (message.type === "operation.success") { notify("Done", message.message); if (view === "Mods") searchMods(document.querySelector("#mod-search")?.value || ""); }
  if (message.type === "operation.error") notify("Operation failed", message.message);
  if (message.type === "profiles.updated") { state.profiles = message.profiles; save(); navigate(view); }
});

document.body.dataset.theme = state.theme;
updateAccount();
renderHome();
setInterval(() => native("auth.result"), 2000);
setInterval(() => native("operation.result"), 1500);

