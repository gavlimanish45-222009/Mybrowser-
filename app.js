const $ = (id) => document.getElementById(id);

const STORAGE = {
  theme: "mybrowser-theme",
  history: "mybrowser-history",
  bookmarks: "mybrowser-bookmarks",
  downloads: "mybrowser-downloads"
};

let tabs = [];
let activeTabId = null;
let nextTabId = 1;
let panelMode = "history";
let toastTimer = null;

function readStore(key, fallback = []) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}
function writeStore(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { showToast("Storage ભરાઈ ગયું હોઈ શકે છે."); }
}
function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.add("hidden"), 2600);
}
function activeTab() { return tabs.find(t => t.id === activeTabId); }

function normalizeInput(value) {
  const text = value.trim();
  if (!text) return null;
  if (/^(https?:\/\/|ftp:\/\/)/i.test(text)) return text;
  if (/^localhost(:\d+)?([/?#].*)?$/i.test(text) || /^(\d{1,3}\.){3}\d{1,3}(:\d+)?([/?#].*)?$/.test(text)) {
    return "http://" + text;
  }
  // Strings containing spaces, or without a domain-like suffix, are treated as searches.
  const looksLikeDomain = /^[^\s]+\.[a-z]{2,}([/:?#][^\s]*)?$/i.test(text);
  if (looksLikeDomain) return "https://" + text;
  return "https://www.google.com/search?q=" + encodeURIComponent(text);
}
function titleForUrl(url) {
  if (!url) return "New tab";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("google.com") && parsed.pathname === "/search") {
      return parsed.searchParams.get("q") || "Google Search";
    }
    return parsed.hostname.replace(/^www\./, "");
  } catch { return url; }
}
function openNewTab(url = null) {
  const tab = { id: nextTabId++, url, title: titleForUrl(url), history: [], historyIndex: -1 };
  tabs.push(tab);
  activeTabId = tab.id;
  renderTabs();
  showTabPage(tab);
  return tab;
}
function renderTabs() {
  const container = $("tabs");
  container.replaceChildren();
  tabs.forEach(tab => {
    const el = document.createElement("div");
    el.className = "tab" + (tab.id === activeTabId ? " active" : "");
    const title = document.createElement("button");
    title.className = "tab-title";
    title.type = "button";
    title.textContent = tab.title || "New tab";
    title.title = tab.url || "New tab";
    title.addEventListener("click", () => { activeTabId = tab.id; renderTabs(); showTabPage(tab); });
    const close = document.createElement("button");
    close.className = "close-tab";
    close.type = "button";
    close.textContent = "×";
    close.title = "Close tab";
    close.addEventListener("click", (event) => { event.stopPropagation(); closeTab(tab.id); });
    el.append(title, close);
    container.append(el);
  });
}
function closeTab(id) {
  const index = tabs.findIndex(t => t.id === id);
  if (index < 0) return;
  tabs.splice(index, 1);
  if (!tabs.length) {
    openNewTab();
    return;
  }
  if (activeTabId === id) activeTabId = tabs[Math.max(0, index - 1)].id;
  renderTabs();
  showTabPage(activeTab());
}
function showHome() {
  $("homePage").classList.remove("hidden");
  $("pageView").classList.add("hidden");
  $("addressInput").value = "";
  const tab = activeTab();
  if (tab) { tab.url = null; tab.title = "New tab"; }
  renderTabs();
}
function showTabPage(tab) {
  if (!tab || !tab.url) {
    $("homePage").classList.remove("hidden");
    $("pageView").classList.add("hidden");
    $("addressInput").value = "";
    return;
  }
  $("homePage").classList.add("hidden");
  $("pageView").classList.remove("hidden");
  $("addressInput").value = tab.url;
  $("pageTitle").textContent = titleForUrl(tab.url);
  $("pageDescription").textContent = tab.url;
  $("siteFrame").src = "about:blank";
  // Set after blank to make navigation intent explicit. Some sites will block framing.
  $("siteFrame").src = tab.url;
}
function addHistory(url) {
  const history = readStore(STORAGE.history);
  history.unshift({ url, title: titleForUrl(url), visitedAt: new Date().toISOString() });
  writeStore(STORAGE.history, history.slice(0, 300));
}
function navigate(raw) {
  const url = normalizeInput(raw);
  if (!url) { showToast("Search અથવા websiteનું સરનામું લખો."); return; }
  const tab = activeTab() || openNewTab();
  tab.url = url;
  tab.title = titleForUrl(url);
  if (tab.historyIndex < tab.history.length - 1) tab.history = tab.history.slice(0, tab.historyIndex + 1);
  tab.history.push(url);
  tab.historyIndex = tab.history.length - 1;
  addHistory(url);
  renderTabs();
  showTabPage(tab);
}
function goHomeForActiveTab() {
  const tab = activeTab();
  if (tab) { tab.url = null; tab.title = "New tab"; tab.historyIndex = -1; }
  showHome();
}
function moveHistory(delta) {
  const tab = activeTab();
  if (!tab) return;
  const next = tab.historyIndex + delta;
  if (next < 0 || next >= tab.history.length) { showToast("આ tabમાં વધુ browsing history નથી."); return; }
  tab.historyIndex = next;
  tab.url = tab.history[next];
  tab.title = titleForUrl(tab.url);
  renderTabs();
  showTabPage(tab);
}
function addBookmark(url) {
  if (!url) { showToast("પહેલા કોઈ website ખોલો."); return; }
  const bookmarks = readStore(STORAGE.bookmarks);
  if (bookmarks.some(item => item.url === url)) { showToast("આ bookmark પહેલેથી સાચવેલું છે."); return; }
  bookmarks.unshift({ url, title: titleForUrl(url), savedAt: new Date().toISOString() });
  writeStore(STORAGE.bookmarks, bookmarks);
  $("bookmarkCurrentBtn").textContent = "★";
  showToast("Bookmark સાચવ્યું.");
}
function openPanel(mode) {
  panelMode = mode;
  const names = { history: "Browsing History", bookmarks: "Bookmarks", downloads: "Downloads" };
  $("panelTitle").textContent = names[mode] || "History";
  $("clearPanelBtn").textContent = mode === "bookmarks" ? "Clear all" : "Clear";
  $("panelSearch").value = "";
  $("sidePanel").classList.remove("hidden");
  renderPanel();
}
function renderPanel() {
  const list = $("panelList");
  list.replaceChildren();
  const key = panelMode === "history" ? STORAGE.history : panelMode === "bookmarks" ? STORAGE.bookmarks : STORAGE.downloads;
  const query = $("panelSearch").value.trim().toLowerCase();
  const entries = readStore(key).filter(item => (item.title + " " + item.url).toLowerCase().includes(query));
  if (!entries.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = panelMode === "history" ? "હજુ browsing history નથી." : panelMode === "bookmarks" ? "હજુ bookmarks નથી." : "હજુ download links સાચવેલી નથી.";
    list.append(empty);
    return;
  }
  entries.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "panel-item";
    const main = document.createElement("div");
    main.className = "item-main";
    const title = document.createElement("div");
    title.className = "item-title";
    title.textContent = item.title || titleForUrl(item.url);
    const url = document.createElement("div");
    url.className = "item-url";
    url.textContent = item.url;
    const date = document.createElement("div");
    date.className = "item-date";
    const time = item.visitedAt || item.savedAt || item.addedAt;
    date.textContent = time ? new Date(time).toLocaleString() : "";
    main.append(title, url, date);
    main.addEventListener("click", () => {
      $("sidePanel").classList.add("hidden");
      if (panelMode === "downloads") {
        window.open(item.url, "_blank", "noopener,noreferrer");
      } else {
        if (!activeTab()) openNewTab();
        navigate(item.url);
      }
    });
    row.append(main);
    if (panelMode === "bookmarks" || panelMode === "downloads") {
      const remove = document.createElement("button");
      remove.className = "item-action";
      remove.title = "Remove";
      remove.textContent = "×";
      remove.addEventListener("click", () => {
        const all = readStore(key);
        const target = panelMode === "bookmarks" ? all.findIndex(x => x.url === item.url) : all.findIndex(x => x.url === item.url);
        if (target >= 0) all.splice(target, 1);
        writeStore(key, all);
        renderPanel();
      });
      row.append(remove);
    }
    list.append(row);
  });
}
function clearCurrentPanel() {
  const key = panelMode === "history" ? STORAGE.history : panelMode === "bookmarks" ? STORAGE.bookmarks : STORAGE.downloads;
  const label = panelMode === "history" ? "history" : panelMode === "bookmarks" ? "bookmarks" : "downloads";
  if (!confirm("બધી " + label + " સાફ કરવી છે?")) return;
  writeStore(key, []);
  renderPanel();
  showToast("સાફ થઈ ગયું.");
}
function toggleTheme() {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem(STORAGE.theme, isDark ? "dark" : "light");
  $("themeBtn").textContent = isDark ? "☀️" : "🌙";
}
function saveDownloadLink() {
  const url = activeTab()?.url;
  if (!url) { showToast("પહેલા website અથવા download link ખોલો."); return; }
  const downloads = readStore(STORAGE.downloads);
  if (!downloads.some(x => x.url === url)) {
    downloads.unshift({ url, title: titleForUrl(url), addedAt: new Date().toISOString() });
    writeStore(STORAGE.downloads, downloads);
  }
  openPanel("downloads");
  showToast("લિંક Downloads યાદીમાં સાચવી.");
}

$("addressForm").addEventListener("submit", e => { e.preventDefault(); navigate($("addressInput").value); });
$("homeSearchForm").addEventListener("submit", e => { e.preventDefault(); navigate($("homeSearchInput").value); $("homeSearchInput").value = ""; });
$("newTabBtn").addEventListener("click", () => openNewTab());
$("backBtn").addEventListener("click", () => moveHistory(-1));
$("forwardBtn").addEventListener("click", () => moveHistory(1));
$("reloadBtn").addEventListener("click", () => {
  const tab = activeTab();
  if (!tab?.url) { showToast("આ New Tab છે."); return; }
  $("siteFrame").src = tab.url;
});
$("homeBtn").addEventListener("click", goHomeForActiveTab);
$("showHomeBtn").addEventListener("click", goHomeForActiveTab);
$("openExternalBtn").addEventListener("click", () => {
  const url = activeTab()?.url;
  if (url) window.open(url, "_blank", "noopener,noreferrer");
});
$("bookmarkCurrentBtn").addEventListener("click", () => addBookmark(activeTab()?.url));
$("themeBtn").addEventListener("click", toggleTheme);
$("historyBtn").addEventListener("click", () => openPanel("history"));
$("bookmarksBtn").addEventListener("click", () => openPanel("bookmarks"));
$("downloadsBtn").addEventListener("click", saveDownloadLink);
$("closePanelBtn").addEventListener("click", () => $("sidePanel").classList.add("hidden"));
$("clearPanelBtn").addEventListener("click", clearCurrentPanel);
$("panelSearch").addEventListener("input", renderPanel);
document.querySelectorAll(".quick-link").forEach(button => button.addEventListener("click", () => navigate(button.dataset.url)));
document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
    e.preventDefault(); $("addressInput").focus(); $("addressInput").select();
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "t") {
    e.preventDefault(); openNewTab();
  }
  if (e.key === "Escape") $("sidePanel").classList.add("hidden");
});

if (localStorage.getItem(STORAGE.theme) === "dark") {
  document.body.classList.add("dark");
  $("themeBtn").textContent = "☀️";
}
openNewTab();
