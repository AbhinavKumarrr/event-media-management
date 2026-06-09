const API_BASE = "http://localhost:5000/api";
const STORAGE_KEY = "emmp_local_cache_v2";
const GALLERY_PAGE_SIZE = 6;

const defaultData = {
  users: [],
  currentUserEmail: null,
  events: [
    {
      id: 1,
      name: "Freshers Party",
      date: "2026-08-12",
      category: "Cultural",
      description: "Welcome event for new students.",
      visibility: "public",
      club: "Cultural Club",
      cover: "linear-gradient(135deg,#6366f1,#a78bfa)"
    },
    {
      id: 2,
      name: "Workshop on Web Dev",
      date: "2026-08-18",
      category: "Workshop",
      description: "Hands-on frontend and backend session.",
      visibility: "private",
      club: "Tech Club",
      cover: "linear-gradient(135deg,#0f766e,#34d399)"
    }
  ],
  media: [],
  notifications: []
};

const permissions = {
  Admin: ["public", "private"],
  Photographer: ["public", "private"],
  "Club Member": ["public", "private"],
  Viewer: ["public"]
};

const state = {
  authTab: "login",
  search: "",
  sortBy: "date",
  selectedEventId: 1,
  referenceText: "Aman",
  previewFiles: [],
  uploadEventId: 1,
  galleryPage: 1,
  galleryDone: false,
  cloudOnline: true,
  deferredInstallPrompt: null
};

let data = loadLocalCache() || structuredClone(defaultData);
let scrollObserver = null;

const els = {
  authView: document.getElementById("authView"),
  appView: document.getElementById("appView"),
  toastContainer: document.getElementById("toastContainer"),

  loginTabBtn: document.getElementById("loginTabBtn"),
  registerTabBtn: document.getElementById("registerTabBtn"),
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  authMessage: document.getElementById("authMessage"),

  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  registerName: document.getElementById("registerName"),
  registerEmail: document.getElementById("registerEmail"),
  registerPassword: document.getElementById("registerPassword"),
  registerRole: document.getElementById("registerRole"),

  logoutBtn: document.getElementById("logoutBtn"),
  welcomeText: document.getElementById("welcomeText"),
  userBadge: document.getElementById("userBadge"),
  searchInput: document.getElementById("searchInput"),
  cloudStatus: document.getElementById("cloudStatus"),
  installPwaBtn: document.getElementById("installPwaBtn"),

  eventCount: document.getElementById("eventCount"),
  mediaCount: document.getElementById("mediaCount"),
  publicCount: document.getElementById("publicCount"),
  privateCount: document.getElementById("privateCount"),
  likeCount: document.getElementById("likeCount"),
  favCount: document.getElementById("favCount"),

  storiesStrip: document.getElementById("storiesStrip"),

  eventName: document.getElementById("eventName"),
  eventDate: document.getElementById("eventDate"),
  eventCategory: document.getElementById("eventCategory"),
  eventClub: document.getElementById("eventClub"),
  eventDesc: document.getElementById("eventDesc"),
  eventVisibility: document.getElementById("eventVisibility"),
  addEventBtn: document.getElementById("addEventBtn"),

  dropzone: document.getElementById("dropzone"),
  fileInput: document.getElementById("fileInput"),
  uploadEventSelect: document.getElementById("uploadEventSelect"),
  referenceInput: document.getElementById("referenceInput"),
  matchCount: document.getElementById("matchCount"),
  previewArea: document.getElementById("previewArea"),

  sortSelect: document.getElementById("sortSelect"),
  eventFilterSelect: document.getElementById("eventFilterSelect"),
  eventGrid: document.getElementById("eventGrid"),
  mediaGrid: document.getElementById("mediaGrid"),
  discoverGrid: document.getElementById("discoverGrid"),
  galleryCount: document.getElementById("galleryCount"),
  scrollSentinel: document.getElementById("scrollSentinel"),

  profileCard: document.getElementById("profileCard"),
  analyticsBox: document.getElementById("analyticsBox"),
  analyticsChart: document.getElementById("analyticsChart"),
  notificationArea: document.getElementById("notificationArea"),

  qrModal: document.getElementById("qrModal"),
  qrCodeBox: document.getElementById("qrCodeBox"),
  qrShareUrl: document.getElementById("qrShareUrl"),
  qrShareBtn: document.getElementById("qrShareBtn"),
  copyShareLinkBtn: document.getElementById("copyShareLinkBtn"),

  storyModal: document.getElementById("storyModal"),
  storyContent: document.getElementById("storyContent")
};

/* ── Utilities ── */

function loadLocalCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveLocalCache() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function token() {
  return localStorage.getItem("token");
}

function currentUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function applyRoleBasedVisibility() {
  const user = currentUser();
  const role = user?.role || "Viewer";

  const createEventSection = document.getElementById("createEventSection");
  const uploadSection = document.getElementById("uploadSection");

  if (createEventSection) {
    createEventSection.style.display =
      role === "Admin" ? "block" : "none";
  }

  if (uploadSection) {
    uploadSection.style.display =
      role === "Admin" || role === "Photographer"
        ? "block"
        : "none";
  }
}

function setCurrentUser(user, authToken) {
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("token", authToken);
}

function clearAuth() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
}

function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return h;
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  els.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function setAuthMessage(text, type = "info") {
  els.authMessage.textContent = text;
  els.authMessage.style.color = type === "error" ? "#f87171" : "#9b93b0";
}

function switchAuthTab(tab) {
  state.authTab = tab;
  const loginActive = tab === "login";
  els.loginTabBtn.classList.toggle("active", loginActive);
  els.registerTabBtn.classList.toggle("active", !loginActive);
  els.loginForm.classList.toggle("hidden", !loginActive);
  els.registerForm.classList.toggle("hidden", loginActive);
  setAuthMessage(loginActive ? "Use your account to continue." : "Create a new account.");
}

function showApp() {
  els.authView.classList.add("hidden");
  els.appView.classList.remove("hidden");
  renderAll();
}

function showAuth() {
  els.appView.classList.add("hidden");
  els.authView.classList.remove("hidden");
  switchAuthTab(state.authTab);
}

function canSeeVisibility(visibility) {
  const user = currentUser();
  const role = user?.role || "Viewer";
  return permissions[role].includes(visibility || "public");
}

/* ── AI Captions & Smart Tags ── */

function smartTags(text = "") {
  const s = text.toLowerCase();
  const tags = [];
  if (/(mountain|hill|trek|trip|travel)/.test(s)) tags.push("mountains");
  if (/(beach|sea|ocean|water)/.test(s)) tags.push("beach");
  if (/(sport|match|game|football|cricket|basketball)/.test(s)) tags.push("sports");
  if (/(crowd|people|group|fest|party)/.test(s)) tags.push("crowd");
  if (/(code|dev|workshop|tech|computer|laptop)/.test(s)) tags.push("workshop");
  if (/(dance|music|stage|performance|concert)/.test(s)) tags.push("stage");
  return tags.length ? [...new Set(tags)] : ["event"];
}

function generateAICaption(fileName, event, tags) {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
  const tag = tags[0] || "event";
  const templates = [
    `A memorable moment from ${event?.name || "the event"} — ${tag} vibes captured perfectly.`,
    `${event?.club || "Club"} spotlight: "${base}" at the ${event?.category || "event"} gathering.`,
    `Captured during ${event?.name || "an amazing event"}. Feels like pure ${tag} energy!`,
    `Highlights from ${event?.name || "today"}: ${base} tells the story.`
  ];
  return templates[Math.abs(hashCode(base)) % templates.length];
}

/* ── Duplicate Detection ── */

async function computeFileHash(file) {
  const buffer = await file.arrayBuffer();
  const view = new Uint8Array(buffer.slice(0, 2048));
  let hash = `${file.size}:${file.name}`;
  for (let i = 0; i < view.length; i += 64) hash += `:${view[i]}`;
  return hash;
}

function isDuplicateHash(fileHash) {
  return data.media.some(m => m.fileHash === fileHash);
}

/* ── API ── */

async function apiFetch(path, options = {}) {
  const headers = options.headers ? { ...options.headers } : {};
  const t = token();
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Request failed: ${res.status}`);
  }
  return res;
}

async function apiJson(path, options = {}) {
  const res = await apiFetch(path, options);
  return res.json();
}

async function checkCloudStatus() {
  try {
    const res = await fetch("http://localhost:5000/", { signal: AbortSignal.timeout(3000) });
    state.cloudOnline = res.ok;
  } catch {
    state.cloudOnline = false;
  }
  if (els.cloudStatus) {
    els.cloudStatus.textContent = state.cloudOnline ? "☁️ S3 Online" : "📴 Offline Mode";
    els.cloudStatus.className = `cloud-badge ${state.cloudOnline ? "online" : "offline"}`;
  }
}

async function login(email, password) {
  try {
    const result = await apiJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    setCurrentUser(result.user, result.token);
    return result.user;
  } catch {
    const localUser = data.users.find(u => u.email === email && u.password === password);
    if (!localUser) throw new Error("Invalid local credentials");
    const sessionUser = { name: localUser.name, email: localUser.email, role: localUser.role };
    setCurrentUser(sessionUser, "mock-local-jwt-token");
    return sessionUser;
  }
}

async function registerUser(name, email, password, role) {
  try {
    const result = await apiJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role })
    });
    setCurrentUser(result.user, result.token);
    return result.user;
  } catch {
    if (data.users.some(u => u.email === email)) throw new Error("User already exists locally");
    const newUser = { name, email, password, role };
    data.users.push(newUser);
    const sessionUser = { name, email, role };
    setCurrentUser(sessionUser, "mock-local-jwt-token");
    saveLocalCache();
    return sessionUser;
  }
}

async function fetchMe() {
  if (!token()) return null;
  try {
    return await apiJson("/me");
  } catch {
    return null;
  }
}

async function loadEvents() {
  try {
    const events = await apiJson("/events");
    data.events = events.map(e => ({ ...e, cover: e.cover || makeCover(e.name) }));
    if (!data.events.length) data.events = structuredClone(defaultData.events);
    return data.events;
  } catch {
    return data.events;
  }
}

async function loadMedia(eventId = "all") {
  try {
    const q = eventId ? `?eventId=${encodeURIComponent(eventId)}` : "";
    const media = await apiJson(`/media${q}`);
    data.media = media;
    return data.media;
  } catch {
    return data.media;
  }
}

async function loadNotifications() {
  try {
    const notes = await apiJson("/notifications");
    data.notifications = notes.map(n => n.message || n);
    return data.notifications;
  } catch {
    return data.notifications;
  }
}

function makeCover(name) {
  const palette = [
    "linear-gradient(135deg,#6366f1,#a78bfa)",
    "linear-gradient(135deg,#0f766e,#34d399)",
    "linear-gradient(135deg,#dc2626,#f97316)",
    "linear-gradient(135deg,#4c1d95,#ec4899)",
    "linear-gradient(135deg,#1e3a5f,#334155)"
  ];
  let sum = 0;
  for (const ch of name) sum += ch.charCodeAt(0);
  return palette[sum % palette.length];
}

function selectedEvent() {
  return data.events.find(e => e.id === state.selectedEventId) || data.events[0] || null;
}

function visibleEvents() {
  const q = state.search.toLowerCase();
  return [...data.events]
    .filter(e => !q || [e.name, e.category, e.description, e.club, e.date].join(" ").toLowerCase().includes(q))
    .filter(e => canSeeVisibility(e.visibility))
    .sort((a, b) => {
      if (state.sortBy === "name") return a.name.localeCompare(b.name);
      if (state.sortBy === "category") return a.category.localeCompare(b.category);
      return new Date(a.date) - new Date(b.date);
    });
}

function visibleMedia() {
  const q = state.search.toLowerCase();
  return data.media.filter(m => {
    if (!canSeeVisibility(m.visibility)) return false;
    const event = data.events.find(e => String(e.id) === String(m.eventId));
    const text = [
      m.title, m.caption, m.uploader,
      (m.tags || []).join(" "), m.visibility, m.uploadedAt,
      event?.name || "", event?.category || "", event?.club || ""
    ].join(" ").toLowerCase();
    return !q || text.includes(q);
  });
}

function filteredGalleryMedia() {
  const all = visibleMedia();
  return state.selectedEventId === "all"
    ? all
    : all.filter(m => Number(m.eventId) === Number(state.selectedEventId));
}

function resetGalleryPagination() {
  state.galleryPage = 1;
  state.galleryDone = false;
  if (els.scrollSentinel) els.scrollSentinel.classList.remove("done");
}

/* ── Renderers ── */

function updateAnalytics() {
  const likes = data.media.reduce((sum, m) => sum + (m.likes || 0), 0);
  const favs = data.media.filter(m => m.favourites).length;
  const publicMedia = data.media.filter(m => m.visibility === "public").length;
  const privateMedia = data.media.filter(m => m.visibility === "private").length;

  els.eventCount.textContent = data.events.length;
  els.mediaCount.textContent = data.media.length;
  els.publicCount.textContent = publicMedia;
  els.privateCount.textContent = privateMedia;
  els.likeCount.textContent = likes;
  els.favCount.textContent = favs;
}

function renderProfile() {
  const user = currentUser();
  if (!user) return;

  const uploads = data.media.filter(m => m.uploaderEmail === user.email).length;
  const myLikes = data.media.filter(m => m.uploaderEmail === user.email).reduce((sum, m) => sum + (m.likes || 0), 0);
  const visibleEventsCount = data.events.filter(e => canSeeVisibility(e.visibility)).length;

  els.profileCard.innerHTML = `
    <div class="profile-top">
      <div class="avatar">${escapeHTML(user.name.slice(0, 1).toUpperCase())}</div>
      <div>
        <div class="profile-name">${escapeHTML(user.name)}</div>
        <div class="profile-role">${escapeHTML(user.email)} • ${escapeHTML(user.role)}</div>
      </div>
    </div>
    <div class="profile-metrics">
      <div class="metric"><div class="num">${uploads}</div><div class="cap">Uploads</div></div>
      <div class="metric"><div class="num">${myLikes}</div><div class="cap">Likes received</div></div>
      <div class="metric"><div class="num">${visibleEventsCount}</div><div class="cap">Visible events</div></div>
      <div class="metric"><div class="num">${data.notifications.length}</div><div class="cap">Alerts</div></div>
    </div>
  `;
}

function renderAnalytics() {
  const totalLikes = data.media.reduce((sum, m) => sum + (m.likes || 0), 0);
  const totalFavs = data.media.filter(m => m.favourites).length;
  const privateRatio = data.media.length ? Math.round((data.media.filter(m => m.visibility === "private").length / data.media.length) * 100) : 0;
  const publicRatio = data.media.length ? Math.round((data.media.filter(m => m.visibility === "public").length / data.media.length) * 100) : 0;
  const engagement = data.media.length ? Math.min(100, Math.round((totalLikes + totalFavs * 2) / data.media.length * 10)) : 0;

  const bars = [
    { label: "Public media", value: publicRatio },
    { label: "Private media", value: privateRatio },
    { label: "Engagement score", value: engagement },
    { label: "Total likes", value: Math.min(100, totalLikes * 5) }
  ];

  els.analyticsBox.innerHTML = bars.map(b => `
    <div class="bar-item">
      <div class="bar-label"><span>${escapeHTML(b.label)}</span><strong>${b.value}%</strong></div>
      <div class="bar-track"><div class="bar-fill" style="width:${b.value}%"></div></div>
    </div>
  `).join("");

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const uploadsByDay = days.map((_, i) => {
    const count = data.media.filter(m => {
      const d = new Date(m.uploadedAt || Date.now());
      return d.getDay() === (i + 1) % 7;
    }).length;
    return count;
  });
  const maxVal = Math.max(...uploadsByDay, 1);

  els.analyticsChart.innerHTML = uploadsByDay.map((val, i) => `
    <div class="chart-bar" style="height:${Math.max(8, (val / maxVal) * 100)}%" title="${val} uploads">
      <span>${days[i]}</span>
    </div>
  `).join("");
}

function renderNotifications() {
  els.notificationArea.innerHTML = data.notifications.length
    ? data.notifications.map(n => `<div class="note">${escapeHTML(n)}</div>`).join("")
    : `<div class="locked">No notifications yet.</div>`;
}

function renderStories() {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = visibleMedia()
    .filter(m => m.type === "image")
    .filter(m => {
      const t = new Date(m.uploadedAt || Date.now()).getTime();
      return t >= cutoff || !m.uploadedAt;
    })
    .slice(0, 12);

  if (!recent.length) {
    els.storiesStrip.innerHTML = `<div class="locked" style="border:none;background:transparent;padding:12px;">No recent stories. Upload media to see highlights here.</div>`;
    return;
  }

  els.storiesStrip.innerHTML = recent.map(item => `
    <div class="story-item" data-story-id="${item.id}">
      <div class="story-ring">
        ${item.src
          ? `<img src="${item.src}" alt="${escapeHTML(item.title)}" loading="lazy" />`
          : `<div class="story-placeholder">📷</div>`}
      </div>
      <span class="story-label">${escapeHTML(item.title)}</span>
    </div>
  `).join("");

  document.querySelectorAll("[data-story-id]").forEach(el => {
    el.addEventListener("click", () => {
      const item = data.media.find(m => Number(m.id) === Number(el.dataset.storyId));
      if (item) openStoryViewer(item);
    });
  });
}

function openStoryViewer(item) {
  els.storyContent.innerHTML = `
    ${item.type === "video"
      ? `<video src="${item.src}" controls autoplay></video>`
      : `<img src="${item.src}" alt="${escapeHTML(item.title)}" />`}
    <div class="story-info">
      <div class="media-title">${escapeHTML(item.title)}</div>
      ${item.caption ? `<div class="media-caption">${escapeHTML(item.caption)}</div>` : ""}
      <div class="media-meta">By ${escapeHTML(item.uploader)} • ${escapeHTML(item.uploadedAt || "")}</div>
    </div>
  `;
  els.storyModal.classList.remove("hidden");
}

function updateVisibilityOptions() {
  const visible = data.events.filter(e => canSeeVisibility(e.visibility));
  const opts = visible.map(e => `<option value="${e.id}">${escapeHTML(e.name)}</option>`).join("");

  els.uploadEventSelect.innerHTML = opts;
  els.eventFilterSelect.innerHTML = `<option value="all">All Events</option>${opts}`;

  if (!visible.some(e => e.id === state.uploadEventId) && visible[0]) state.uploadEventId = visible[0].id;
  if (!visible.some(e => e.id === state.selectedEventId) && visible[0]) state.selectedEventId = visible[0].id;

  els.uploadEventSelect.value = String(state.uploadEventId || "");
  els.eventFilterSelect.value = state.selectedEventId === "all" ? "all" : String(state.selectedEventId || "all");
}

function renderEvents() {
  const list = visibleEvents();
  els.eventGrid.innerHTML = list.length
    ? list.map(event => `
      <article class="event-card${Number(event.id) === Number(state.selectedEventId) ? " selected" : ""}" data-event-id="${event.id}">
        <div class="event-cover" style="background:${event.cover || makeCover(event.name)}">${escapeHTML(event.name)}</div>
        <div class="event-body">
          <div class="event-title">${escapeHTML(event.name)}</div>
          <div class="event-meta">${escapeHTML(event.category)} • ${escapeHTML(event.date)}</div>
          <div class="event-desc">${escapeHTML(event.description)}</div>
          <div class="event-meta" style="margin-top:8px;">Club: ${escapeHTML(event.club)}</div>
          <span class="badge ${event.visibility}">${escapeHTML(event.visibility)}</span>
        </div>
      </article>
    `).join("")
    : `<div class="locked">No events available for your role or filters.</div>`;

  document.querySelectorAll("[data-event-id]").forEach(card => {
    card.addEventListener("click", () => {
      state.selectedEventId = Number(card.dataset.eventId);
      state.uploadEventId = Number(card.dataset.eventId);
      resetGalleryPagination();
      els.uploadEventSelect.value = String(state.uploadEventId);
      els.eventFilterSelect.value = String(state.selectedEventId);
      renderAll();
    });
  });
}

function renderMediaCard(item) {
  const comments = item.comments?.length
    ? item.comments.map(c => `<div class="comment-item"><strong>${escapeHTML(c.user)}:</strong> ${escapeHTML(c.text)}</div>`).join("")
    : `<div class="comment-item" style="color:#8b98ad;">No comments yet.</div>`;

  const tags = (item.tags || []).map(tag => `<span class="tag">#${escapeHTML(tag)}</span>`).join("");

  return `
    <article class="media-card" data-media-id="${item.id}">
      <div class="media-visual">
        ${item.type === "video"
          ? `<video src="${item.src}" controls preload="metadata"></video>`
          : `<img src="${item.src}" alt="${escapeHTML(item.title)}" loading="lazy" />`}
      </div>
      <div class="media-body">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
          <div>
            <div class="media-title">${escapeHTML(item.title)}</div>
            <div class="media-meta">By ${escapeHTML(item.uploader)} • ${escapeHTML(item.uploadedAt)} • ${escapeHTML(item.visibility)}</div>
          </div>
          <button class="action-btn${item.favourites ? " favourited" : ""}" data-fav-id="${item.id}">
            ${item.favourites ? "★ Favourited" : "☆ Favourite"}
          </button>
        </div>
        ${item.caption ? `<div class="media-caption">✨ ${escapeHTML(item.caption)}</div>` : ""}
        <div class="tag-row">${tags}</div>
        <div class="action-row">
          <button class="action-btn liked" data-like-id="${item.id}">♥ Like (${item.likes || 0})</button>
          <button class="action-btn" data-share-id="${item.id}">Share</button>
          <button class="action-btn" data-download-id="${item.id}">Download</button>
        </div>
        <div class="comments">
          <div style="font-size:13px;color:#dce6f5;font-weight:700;">Comments</div>
          ${comments}
          <div class="comment-row">
            <input type="text" data-comment-input="${item.id}" placeholder="Write a comment..." />
            <button class="primary-btn" data-comment-btn="${item.id}">Post</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderMedia(append = false) {
  const current = filteredGalleryMedia();
  const end = state.galleryPage * GALLERY_PAGE_SIZE;
  const page = current.slice(0, end);

  state.galleryDone = end >= current.length;
  if (els.galleryCount) els.galleryCount.textContent = `${current.length} item${current.length !== 1 ? "s" : ""}`;
  if (els.scrollSentinel) els.scrollSentinel.classList.toggle("done", state.galleryDone);

  if (!current.length) {
    els.mediaGrid.innerHTML = `<div class="locked">No media found for this event.</div>`;
    return;
  }

  if (append) {
    const existing = page.length - GALLERY_PAGE_SIZE;
    const newItems = page.slice(Math.max(0, existing));
    els.mediaGrid.insertAdjacentHTML("beforeend", newItems.map(renderMediaCard).join(""));
  } else {
    els.mediaGrid.innerHTML = page.map(renderMediaCard).join("");
  }

  bindMediaActions();
}

function bindMediaActions() {
  document.querySelectorAll("[data-like-id]").forEach(btn => {
    if (btn._bound) return;
    btn._bound = true;
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.likeId);
      try {
        await apiJson(`/media/${id}/like`, { method: "POST" });
        await loadMedia("all");
        notifyLocal("Someone liked your photo");
        renderAll();
      } catch {
        fallbackLike(id);
        renderAll();
      }
    });
  });

  document.querySelectorAll("[data-fav-id]").forEach(btn => {
    if (btn._bound) return;
    btn._bound = true;
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.favId);
      try {
        await apiJson(`/media/${id}/favourite`, { method: "POST" });
        await loadMedia("all");
        renderAll();
      } catch {
        fallbackFavourite(id);
      }
    });
  });

  document.querySelectorAll("[data-comment-btn]").forEach(btn => {
    if (btn._bound) return;
    btn._bound = true;
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.commentBtn);
      const input = document.querySelector(`[data-comment-input="${id}"]`);
      const text = input.value.trim();
      if (!text) return;
      try {
        await apiJson(`/media/${id}/comment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });
        input.value = "";
        await loadMedia("all");
        notifyLocal("Someone commented on your upload");
        renderAll();
      } catch {
        fallbackComment(id, text);
        input.value = "";
        renderAll();
      }
    });
  });

  document.querySelectorAll("[data-share-id]").forEach(btn => {
    if (btn._bound) return;
    btn._bound = true;
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.shareId);
      const item = data.media.find(m => Number(m.id) === id);
      if (!item) return;
      const text = `Check out "${item.title}" on EventLens`;
      if (navigator.share) {
        try { await navigator.share({ title: item.title, text }); } catch {}
      } else {
        try {
          await navigator.clipboard.writeText(text);
          showToast("Share text copied!");
        } catch {}
      }
    });
  });

  document.querySelectorAll("[data-download-id]").forEach(btn => {
    if (btn._bound) return;
    btn._bound = true;
    btn.addEventListener("click", () => downloadWatermarked(Number(btn.dataset.downloadId)));
  });
}

function renderDiscovery() {
  const ref = state.referenceText.toLowerCase();
  const all = visibleMedia();
  const matches = all.filter(m =>
    (m.uploader || "").toLowerCase().includes(ref) ||
    (m.caption || "").toLowerCase().includes(ref) ||
    (m.tags || []).some(t => t.toLowerCase().includes(ref))
  );
  els.matchCount.textContent = matches.length;

  els.discoverGrid.innerHTML = matches.length
    ? matches.map(item => `
      <article class="discover-card">
        <img src="${item.src}" alt="${escapeHTML(item.title)}" loading="lazy" />
        <div class="discover-body">
          <div class="media-title" style="font-size:14px;">${escapeHTML(item.title)}</div>
          <div class="discover-meta">Matched: ${escapeHTML(state.referenceText)}</div>
        </div>
      </article>
    `).join("")
    : `<div class="locked">No personalized matches yet.</div>`;
}

function renderPreview() {
  if (!state.previewFiles.length) {
    els.previewArea.innerHTML = "";
    return;
  }

  els.previewArea.innerHTML = `
    <div style="font-size:13px;color:#c4b5fd;font-weight:700;margin-top:10px;">Preview before upload</div>
    ${state.previewFiles.map(p => `
      <div class="preview-card">
        ${p.type === "video"
          ? `<video src="${p.preview}" controls></video>`
          : `<img src="${p.preview}" alt="${escapeHTML(p.name)}" />`}
        <div class="preview-meta">
          <strong>${escapeHTML(p.name)}</strong>
          <small>${escapeHTML(p.tags.join(", "))}</small>
          <div class="preview-caption">✨ ${escapeHTML(p.caption)}</div>
          ${p.isDuplicate ? `<div class="duplicate-warn">⚠ Possible duplicate detected</div>` : ""}
        </div>
      </div>
    `).join("")}
    <button id="uploadBtn" class="primary-btn">Upload to ${escapeHTML(selectedEvent()?.name || "Selected Event")}</button>
  `;

  document.getElementById("uploadBtn")?.addEventListener("click", uploadPreviewFiles);
}

function renderTopUser() {
  const user = currentUser();
  if (!user) return;
  els.userBadge.textContent = `${user.name} • ${user.role}`;
  els.welcomeText.textContent = `Welcome back, ${user.name}`;
}

function notifyLocal(message) {
  data.notifications.unshift(message);
  data.notifications = data.notifications.slice(0, 8);
  saveLocalCache();
  renderNotifications();
  showToast(message);
}

function fallbackLike(id) {
  const item = data.media.find(m => Number(m.id) === Number(id));
  if (!item) return;
  item.likes = (item.likes || 0) + 1;
  notifyLocal("Someone liked your photo");
  saveLocalCache();
}

function fallbackFavourite(id) {
  const item = data.media.find(m => Number(m.id) === Number(id));
  if (!item) return;
  item.favourites = !item.favourites;
  saveLocalCache();
  renderAll();
}

function fallbackComment(id, text) {
  const item = data.media.find(m => Number(m.id) === Number(id));
  if (!item) return;
  item.comments = item.comments || [];
  item.comments.push({ user: currentUser()?.name || "Guest", text });
  notifyLocal("Someone commented on your upload");
  saveLocalCache();
}

/* ── QR Sharing ── */

function getShareUrl() {
  const event = selectedEvent();
  const base = window.location.origin + window.location.pathname;
  return `${base}?event=${event?.id || "all"}`;
}

function openQrModal() {
  const url = getShareUrl();
  const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=6366f1`;
  els.qrCodeBox.innerHTML = `<img src="${qrApi}" alt="QR Code for album sharing" width="220" height="220" />`;
  els.qrShareUrl.textContent = url;
  els.qrModal.classList.remove("hidden");
}

function closeModal(modal) {
  modal.classList.add("hidden");
}

/* ── Infinite Scroll ── */

function setupInfiniteScroll() {
  if (scrollObserver) scrollObserver.disconnect();

  scrollObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !state.galleryDone) {
      state.galleryPage++;
      renderMedia(true);
    }
  }, { rootMargin: "200px" });

  if (els.scrollSentinel) scrollObserver.observe(els.scrollSentinel);
}

/* ── Upload & S3 ── */

async function addEvent() {
    const role = currentUser()?.role || "Viewer";

    if (role !== "Admin") {
    showToast("Only Admin can create events", "error");
    return;
    }

  const name = els.eventName.value.trim();
  const date = els.eventDate.value;
  const category = els.eventCategory.value.trim();
  const club = els.eventClub.value.trim();
  const description = els.eventDesc.value.trim();
  const visibility = els.eventVisibility.value;
  if (!name || !date || !category) return;

  const event = { name, date, category, description, club: club || "Club", visibility };

  try {
    const created = await apiJson("/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event)
    });
    state.selectedEventId = created.id;
    state.uploadEventId = created.id;
    els.eventName.value = els.eventDate.value = els.eventCategory.value = "";
    els.eventClub.value = els.eventDesc.value = "";
    els.eventVisibility.value = "public";
    await refreshEverything();
    notifyLocal(`New event created: ${created.name}`);
    renderAll();
  } catch {
    const fallbackEvent = { id: Date.now(), ...event, cover: makeCover(name) };
    data.events.push(fallbackEvent);
    state.selectedEventId = fallbackEvent.id;
    state.uploadEventId = fallbackEvent.id;
    els.eventName.value = els.eventDate.value = els.eventCategory.value = "";
    els.eventClub.value = els.eventDesc.value = "";
    els.eventVisibility.value = "public";
    notifyLocal(`New event created: ${fallbackEvent.name}`);
    saveLocalCache();
    renderAll();
  }
}

async function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handleFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;

  const event = data.events.find(e => Number(e.id) === Number(els.uploadEventSelect.value)) || selectedEvent();

  state.previewFiles = await Promise.all(files.map(async (file, idx) => {
    const preview = await fileToDataURL(file);
    const isVideo = file.type.startsWith("video");
    const tags = smartTags(`${file.name} ${event?.name || ""} ${event?.category || ""} ${event?.club || ""}`);
    const fileHash = await computeFileHash(file);
    return {
      id: `${Date.now()}-${idx}`,
      file,
      preview,
      name: file.name,
      type: isVideo ? "video" : "image",
      tags,
      caption: generateAICaption(file.name, event, tags),
      fileHash,
      isDuplicate: isDuplicateHash(fileHash)
    };
  }));

  const dupes = state.previewFiles.filter(p => p.isDuplicate);
  if (dupes.length) showToast(`${dupes.length} possible duplicate(s) detected`, "warn");

  renderPreview();
}

async function uploadFiles(files, eventId) {
  const event = data.events.find(e => Number(e.id) === Number(eventId));
  const uploadedMediaObjects = [];
  const tokenHeader = token() ? { Authorization: `Bearer ${token()}` } : {};

  for (const preview of state.previewFiles) {
    const file = preview.file;
    if (!file) continue;

    const signResponse = await fetch(`${API_BASE}/media/request-presigned-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...tokenHeader },
      body: JSON.stringify({ fileName: file.name, fileType: file.type, eventId })
    });

    if (!signResponse.ok) throw new Error("Failed getting presigned URL");
    const { uploadUrl, key, localMode } = await signResponse.json();

    let localSrc = null;

    if (localMode) {
      localSrc = await fileToDataURL(file);
    } else {
      const s3PutResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });
      if (!s3PutResponse.ok) throw new Error("S3 upload failed");
    }

    const confirmResponse = await fetch(`${API_BASE}/media/confirm-upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...tokenHeader },
      body: JSON.stringify({
        s3Key: key,
        localSrc,
        eventId,
        title: file.name.replace(/\.[^.]+$/, ""),
        type: file.type.startsWith("video") ? "video" : "image",
        visibility: event?.visibility || "public",
        uploaderName: currentUser()?.name || "Guest",
        caption: preview.caption,
        tags: preview.tags,
        fileHash: preview.fileHash
      })
    });

    if (!confirmResponse.ok) throw new Error("Cloud sync failed");
    uploadedMediaObjects.push(await confirmResponse.json());
  }

  return { media: uploadedMediaObjects };
}

async function uploadPreviewFiles() {
    const role = currentUser()?.role || "Viewer";

    if (role !== "Admin" && role !== "Photographer") {
    showToast("You are not allowed to upload media", "error");
    return;
    }
    
  if (!state.previewFiles.length) return;

  const nonDupes = state.previewFiles.filter(p => !p.isDuplicate);
  if (!nonDupes.length) {
    showToast("All files are duplicates — upload skipped", "warn");
    return;
  }

  if (nonDupes.length < state.previewFiles.length) {
    showToast(`Skipping ${state.previewFiles.length - nonDupes.length} duplicate(s)`, "warn");
    state.previewFiles = nonDupes;
  }

  try {
    const result = await uploadFiles(nonDupes.map(p => p.file), state.uploadEventId);
    state.previewFiles = [];
    els.previewArea.innerHTML = "";
    await refreshEverything();
    resetGalleryPagination();
    notifyLocal(`Uploaded ${result.media?.length || nonDupes.length} file(s) to AWS S3`);
    renderAll();
  } catch (err) {
    console.warn("S3 unavailable, using local fallback:", err);
    const event = data.events.find(e => Number(e.id) === Number(state.uploadEventId)) || selectedEvent();
    const user = currentUser();
    const newItems = state.previewFiles.map((p, idx) => ({
      id: Date.now() + idx,
      eventId: event?.id || 1,
      type: p.type,
      src: p.preview,
      title: p.name.replace(/\.[^.]+$/, ""),
      caption: p.caption,
      uploader: user?.name || "Guest",
      uploaderEmail: user?.email || "",
      tags: p.tags,
      fileHash: p.fileHash,
      likes: 0,
      comments: [],
      favourites: false,
      visibility: event?.visibility || "public",
      uploadedAt: new Date().toISOString().slice(0, 10)
    }));

    data.media = [...newItems, ...data.media];
    state.previewFiles = [];
    resetGalleryPagination();
    saveLocalCache();
    notifyLocal(`Uploaded ${newItems.length} file(s) locally`);
    renderAll();
  }
}

async function downloadWatermarked(id) {
  try {
    const res = await apiFetch(`/media/${id}/download`);
    const payload = await res.json();
    const url = payload.url || payload.downloadUrl;
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
      return;
    }
    throw new Error("No download url");
  } catch {
    const item = data.media.find(m => Number(m.id) === Number(id));
    if (!item) return;

    if (item.type !== "image") {
      const a = document.createElement("a");
      a.href = item.src;
      a.download = `${item.title}.mp4`;
      a.click();
      showToast("Video downloaded");
      return;
    }

    try {
      const img = await loadImage(item.src);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const event = data.events.find(e => Number(e.id) === Number(item.eventId));
      const user = currentUser();
      const watermark = `${event?.club || "Club"} • ${event?.name || ""} • ${user?.role || "Viewer"}`;
      const pad = Math.max(18, Math.round(canvas.width * 0.02));
      const bannerH = Math.max(56, Math.round(canvas.height * 0.08));

      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, canvas.height - bannerH, canvas.width, bannerH);
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.max(18, Math.round(canvas.width * 0.022))}px Outfit, Arial`;
      ctx.fillText(watermark, pad, canvas.height - Math.max(20, Math.round(bannerH * 0.35)));
      ctx.font = `${Math.max(14, Math.round(canvas.width * 0.016))}px Outfit, Arial`;
      ctx.fillText("EventLens Platform", pad, canvas.height - Math.max(5, Math.round(bannerH * 0.12)));

      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `${item.title}-watermarked.png`;
      a.click();
      showToast("Image downloaded with watermark");
    } catch {
      const a = document.createElement("a");
      a.href = item.src;
      a.download = `${item.title}.png`;
      a.click();
    }
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function renderAll() {
  applyRoleBasedVisibility();
  renderTopUser();
  updateAnalytics();
  updateVisibilityOptions();
  renderProfile();
  renderAnalytics();
  renderNotifications();
  renderStories();
  renderEvents();
  renderMedia(false);
  renderDiscovery();
  renderPreview();
}

async function refreshEverything() {
  await checkCloudStatus();
  const me = await fetchMe();
  if (me && !currentUser()) {
    setCurrentUser({ id: me._id || me.id, name: me.name, email: me.email, role: me.role }, token());
  }
  await Promise.all([loadEvents(), loadMedia("all"), loadNotifications()]);
  if (data.events.length && !data.events.some(e => Number(e.id) === Number(state.selectedEventId))) {
    state.selectedEventId = data.events[0].id;
  }
  if (data.events.length && !data.events.some(e => Number(e.id) === Number(state.uploadEventId))) {
    state.uploadEventId = data.events[0].id;
  }
  saveLocalCache();
}

/* ── PWA ── */

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

function setupPwa() {
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    state.deferredInstallPrompt = e;
    els.installPwaBtn?.classList.remove("hidden");
  });

  els.installPwaBtn?.addEventListener("click", async () => {
    if (!state.deferredInstallPrompt) return;
    state.deferredInstallPrompt.prompt();
    await state.deferredInstallPrompt.userChoice;
    state.deferredInstallPrompt = null;
    els.installPwaBtn.classList.add("hidden");
  });
}

/* ── Event Handlers ── */

function setupAuth() {
  switchAuthTab(state.authTab);
  els.loginTabBtn.addEventListener("click", () => switchAuthTab("login"));
  els.registerTabBtn.addEventListener("click", () => switchAuthTab("register"));

  els.loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    try {
      await login(els.loginEmail.value.trim(), els.loginPassword.value);
      setAuthMessage("Login successful.");
      await refreshEverything();
      showApp();
    } catch {
      setAuthMessage("Invalid email or password.", "error");
    }
  });

  els.registerForm.addEventListener("submit", async e => {
    e.preventDefault();
    const name = els.registerName.value.trim();
    const email = els.registerEmail.value.trim();
    const password = els.registerPassword.value;
    const role = els.registerRole.value;
    if (!name || !email || !password) {
      setAuthMessage("Fill every register field.", "error");
      return;
    }
    try {
      await registerUser(name, email, password, role);
      setAuthMessage("Account created successfully.");
      await refreshEverything();
      showApp();
    } catch {
      setAuthMessage("Registration failed.", "error");
    }
  });
}

function setupApp() {
  els.logoutBtn.addEventListener("click", () => {
    clearAuth();
    state.previewFiles = [];
    state.search = "";
    els.searchInput.value = "";
    showAuth();
  });

  els.searchInput.addEventListener("input", e => {
    state.search = e.target.value;
    resetGalleryPagination();
    renderAll();
  });

  els.sortSelect.addEventListener("change", e => {
    state.sortBy = e.target.value;
    renderAll();
  });

  els.uploadEventSelect.addEventListener("change", e => {
    state.uploadEventId = Number(e.target.value);
  });

  els.eventFilterSelect.addEventListener("change", e => {
    state.selectedEventId = e.target.value === "all" ? "all" : Number(e.target.value);
    resetGalleryPagination();
    renderAll();
  });

  els.referenceInput.addEventListener("input", e => {
    state.referenceText = e.target.value.trim() || "Aman";
    renderDiscovery();
  });

  els.addEventBtn.addEventListener("click", addEvent);
  els.fileInput.addEventListener("change", e => handleFiles(e.target.files));
  els.dropzone.addEventListener("click", () => els.fileInput.click());
  els.dropzone.addEventListener("keydown", e => { if (e.key === "Enter") els.fileInput.click(); });
  els.dropzone.addEventListener("dragover", e => { e.preventDefault(); els.dropzone.classList.add("dragover"); });
  els.dropzone.addEventListener("dragleave", () => els.dropzone.classList.remove("dragover"));
  els.dropzone.addEventListener("drop", e => {
    e.preventDefault();
    els.dropzone.classList.remove("dragover");
    handleFiles(e.dataTransfer.files);
  });

  els.qrShareBtn?.addEventListener("click", openQrModal);
  els.copyShareLinkBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      showToast("Share link copied!");
    } catch {
      showToast("Could not copy link", "error");
    }
  });

  document.querySelectorAll("[data-close-modal]").forEach(el => {
    el.addEventListener("click", () => closeModal(els.qrModal));
  });

  document.querySelectorAll("[data-close-story]").forEach(el => {
    el.addEventListener("click", () => closeModal(els.storyModal));
  });

  const urlParams = new URLSearchParams(window.location.search);
  const eventParam = urlParams.get("event");
  if (eventParam && eventParam !== "all") {
    state.selectedEventId = Number(eventParam);
    state.uploadEventId = Number(eventParam);
  }
}

function initFallbackAuth() {
  const user = currentUser();
  if (user) {
    data.currentUserEmail = user.email;
    showApp();
  } else {
    showAuth();
  }
}

async function init() {
  setupAuth();
  setupApp();
  setupInfiniteScroll();
  setupPwa();
  registerServiceWorker();

  if (token()) {
    await refreshEverything();
    const me = await fetchMe();
    if (me) {
      setCurrentUser({ id: me._id || me.id, name: me.name, email: me.email, role: me.role }, token());
      showApp();
    } else {
      initFallbackAuth();
    }
  } else {
    initFallbackAuth();
  }

  if (!data.events.length) data.events = structuredClone(defaultData.events);
  if (!data.notifications.length) data.notifications = [];

  if (!state.selectedEventId && data.events[0]) state.selectedEventId = data.events[0].id;
  if (!state.uploadEventId && data.events[0]) state.uploadEventId = data.events[0].id;

  saveLocalCache();
  renderAll();
}

init();
