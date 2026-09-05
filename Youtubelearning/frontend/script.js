const token = localStorage.getItem("token");
let currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

if (!token || !currentUser) {
  window.location.href = "login.html";
}

const BACKEND = "http://localhost:5000";

let player = null;
let currentVideoId = "";
let currentVideoTitle = "Nothing playing";
let progressTimer = null;
let trendDays = 7;

let userPlaylists = [];
let selectedPlaylistId = null;

let history = JSON.parse(localStorage.getItem(`history::${currentUser.email}`) || "[]");
let localDailyStats = JSON.parse(localStorage.getItem(`dailyStats::${currentUser.email}`) || "{}");
let dbProgressMap = {}; // backend source of truth

function saveLocalBits() {
  localStorage.setItem(`history::${currentUser.email}`, JSON.stringify(history));
  localStorage.setItem(`dailyStats::${currentUser.email}`, JSON.stringify(localDailyStats));
}

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1800);
}

function formatHMS(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function ensureToday() {
  const key = todayKey();
  if (!localDailyStats[key]) {
    localDailyStats[key] = { watchSec: 0 };
  }
  return key;
}

function extractVideoID(url) {
  const match = String(url || "").trim().match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([^&\n?#]+)/);
  if (!match) return null;
  return match[1].replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 11);
}

function extractPlaylistID(url) {
  const match = String(url || "").trim().match(/[?&]list=([^&]+)/);
  if (!match) return null;
  return match[1].replace(/[^a-zA-Z0-9_-]/g, "");
}

function showUser() {
  document.getElementById("userName").textContent = currentUser.name || "User";
  document.getElementById("userEmail").textContent = currentUser.email || "";
  const avatar = document.getElementById("userAvatar");
  if (avatar) avatar.textContent = (currentUser.name || "U").slice(0, 1).toUpperCase();
}

function getSelectedPlaylist() {
  return userPlaylists.find(p => p.id === selectedPlaylistId) || null;
}

function updateSelectedName() {
  const selected = getSelectedPlaylist();
  document.getElementById("selectedName").textContent = selected ? selected.name : "—";
}

async function createPlaylist() {
  const name = prompt("Playlist name?");
  if (!name) return;

  try {
    const res = await fetch(`${BACKEND}/api/playlists/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ name: name.trim() })
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.error || data.details || "Failed to create playlist");
    }

    toast("Playlist created ✅");
    await loadPlaylistsFromDB(false);
  } catch (err) {
    console.error("createPlaylist error:", err);
    alert(err.message);
  }
}
async function renameSelected() {
  const selected = getSelectedPlaylist();
  if (!selected) return alert("Select a playlist first");

  const name = prompt("New playlist name?", selected.name);
  if (!name) return;

  try {
    const res = await fetch(`${BACKEND}/api/playlists/${selected.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ name: name.trim() })
    });

    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || data.details || "Rename failed");

    toast("Playlist renamed");
    await loadPlaylistsFromDB();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteSelected() {
  const selected = getSelectedPlaylist();
  if (!selected) return alert("Select a playlist first");
  if (!confirm(`Delete "${selected.name}"?`)) return;

  try {
    const res = await fetch(`${BACKEND}/api/playlists/${selected.id}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || data.details || "Delete failed");

    toast("Playlist deleted");
    await loadPlaylistsFromDB();
  } catch (err) {
    alert(err.message);
  }
}

async function addVideoToSelected() {
  const selected = getSelectedPlaylist();
  if (!selected) return alert("Select a playlist first");

  const url = document.getElementById("addVideoUrl").value.trim();
  const videoId = extractVideoID(url);
  if (!videoId) return alert("Invalid video URL");

  try {
    const meta = await fetchVideoMeta(videoId);

    const res = await fetch(`${BACKEND}/api/playlists/${selected.id}/videos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        videoId: meta.videoId,
        title: meta.title,
        durationSec: meta.durationSec || 0
      })
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || data.details || "Add video failed");
    }

    document.getElementById("addVideoUrl").value = "";
    toast("Video added ✅");
    await loadPlaylistsFromDB(false);
  } catch (err) {
    alert(err.message);
  }
}
async function removeVideoFromSelected(videoId) {
  const selected = getSelectedPlaylist();

  if (!selected) {
    alert("Select a playlist first");
    return;
  }

  if (!confirm("Remove this video from playlist?")) {
    return;
  }

  try {
    const res = await fetch(`${BACKEND}/api/playlists/${selected.id}/videos/${videoId}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.error || data.details || "Remove failed");
    }

    toast("Video removed ✅");

    await loadPlaylistsFromDB(false);
    await loadProgressFromDB();
  } catch (err) {
    console.error("REMOVE VIDEO ERROR:", err);
    alert(err.message);
  }
}
async function importYoutubePlaylist() {
  const selected = getSelectedPlaylist();
  if (!selected) return alert("Select a playlist first");

  const url = document.getElementById("ytPlaylistUrl").value.trim();
  const youtubePlaylistId = extractPlaylistID(url);
  if (!youtubePlaylistId) return alert("Invalid playlist URL");

  try {
    const res = await fetch(`${BACKEND}/api/playlists/${selected.id}/import-youtube`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ youtubePlaylistId })
    });

    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || data.details || "Import failed");

    toast(`Imported ${data.addedCount} videos ✅`);
    await loadPlaylistsFromDB();
  } catch (err) {
    alert(err.message);
  }
}

async function loadPlaylistsFromDB(showErrorToast = false) {
  try {
    const res = await fetch(`${BACKEND}/api/playlists`, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.error || data.details || "Failed to load playlists");
    }

    userPlaylists = (data.playlists || []).map(p => ({
      id: p._id,
      name: p.name || "Untitled Playlist",
      videos: Array.isArray(p.videos)
        ? p.videos.map(v => ({
            id: v.videoId || v.id || "",
            title: v.title || "Video",
            durationSec: Number(v.durationSec) || 0
          })).filter(v => v.id)
        : []
    }));

    if (userPlaylists.length > 0) {
      if (!selectedPlaylistId || !userPlaylists.some(p => p.id === selectedPlaylistId)) {
        selectedPlaylistId = userPlaylists[0].id;
      }
    } else {
      selectedPlaylistId = null;
    }

    // render errors alag handle honge
    try { renderPlaylistList(); } catch (e) { console.error("renderPlaylistList error:", e); }
    try { renderSelectedPlaylist(); } catch (e) { console.error("renderSelectedPlaylist error:", e); }
    try { updateSelectedName(); } catch (e) { console.error("updateSelectedName error:", e); }
    try { updatePlaylistProgressUI(); } catch (e) { console.error("updatePlaylistProgressUI error:", e); }
    try { renderAnalytics(); } catch (e) { console.error("renderAnalytics error:", e); }

    return true;
  } catch (err) {
    console.error("loadPlaylistsFromDB error:", err);
    if (showErrorToast) {
      toast("Playlist load failed");
    }
    return false;
  }
}
async function loadProgressFromDB() {
  try {
    const res = await fetch(`${BACKEND}/api/progress`, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || data.details || "Failed to load progress");

    dbProgressMap = {};
    (data.progress || []).forEach(p => {
      dbProgressMap[p.videoId] = p;
    });

    renderSelectedPlaylist();
    updatePlaylistProgressUI();
    renderAnalytics();
  } catch (err) {
    console.error(err);
  }
}

function renderPlaylistList() {
  const wrap = document.getElementById("playlistList");
  wrap.innerHTML = "";

  if (!userPlaylists.length) {
    wrap.innerHTML = `<div class="listSub">No playlists yet</div>`;
    return;
  }

  userPlaylists.forEach(p => {
    const active = p.id === selectedPlaylistId;
    const div = document.createElement("div");
    div.className = "listItem";
    div.onclick = () => {
      selectedPlaylistId = p.id;
      renderPlaylistList();
      renderSelectedPlaylist();
      updateSelectedName();
      updatePlaylistProgressUI();
      renderAnalytics();
    };

    div.innerHTML = `
      <div class="listRow">
        <div>
          <div class="listTitle">${p.name}</div>
          <div class="listSub">${p.videos.length} videos</div>
        </div>
        <div class="badge ${active ? "badgeGood" : ""}">${active ? "Selected" : "Open"}</div>
      </div>
    `;
    wrap.appendChild(div);
  });
}

function renderSelectedPlaylist() {
  const wrap = document.getElementById("videoList");
  wrap.innerHTML = "";

  const selected = getSelectedPlaylist();
  if (!selected) {
    wrap.innerHTML = `<div class="listSub">No playlist selected</div>`;
    return;
  }

  if (!selected.videos.length) {
    wrap.innerHTML = `<div class="listSub">No videos in this playlist yet</div>`;
    return;
  }

  selected.videos.forEach((video, index) => {
    const pr = dbProgressMap[video.id];
    const percent = getVideoPercent(pr);

    const div = document.createElement("div");
    div.className = "listItem";

    div.innerHTML = `
      <div class="listRow">
        <div style="flex:1;min-width:0;">
          <div class="listTitle">${index + 1}. ${video.title || "Untitled video"}</div>
          <div class="listSub">
            ${pr ? `Real watchtime ${formatHMS(pr.watchTimeSec || 0)} • Progress ${percent}%` : "Not started"}
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <div class="badge ${percent >= 90 ? "badgeGood" : ""}">${percent}%</div>
          <button class="btn btnMini btnDanger removeVideoBtn">Remove</button>
        </div>
      </div>
    `;

    div.addEventListener("click", (e) => {
      const removeBtn = e.target.closest(".removeVideoBtn");
      if (removeBtn) return;
      loadOrPlay(video.id, video.title || `Video ${index + 1}`);
    });

    const removeBtn = div.querySelector(".removeVideoBtn");
    removeBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await removeVideoFromSelected(video.id);
    });

    wrap.appendChild(div);
  });
}

function renderHistory() {
  const wrap = document.getElementById("historyList");
  wrap.innerHTML = "";

  if (!history.length) {
    wrap.innerHTML = `<div class="listSub">No history yet</div>`;
    return;
  }

  history.slice(0, 20).forEach(item => {
    const div = document.createElement("div");
    div.className = "listItem";
    div.onclick = () => loadOrPlay(item.id, item.title);

    div.innerHTML = `
      <div class="listTitle">${item.completed ? "✅ " : ""}${item.title}</div>
      <div class="listSub">${item.date}</div>
    `;

    wrap.appendChild(div);
  });
}

function saveToHistory(videoId, title) {
  if (history.length > 0 && history[0].id === videoId) return;

  history.unshift({
    id: videoId,
    title,
    date: new Date().toLocaleString(),
    ts: Date.now(),
    completed: false
  });

  history = history.slice(0, 50);
  saveLocalBits();
  renderHistory();
}

function markHistoryCompleted(videoId) {
  const idx = history.findIndex(h => h.id === videoId);
  if (idx !== -1) {
    history[idx].completed = true;
    saveLocalBits();
    renderHistory();
  }
}

function updateResumeButton(videoId) {
  const btn = document.getElementById("resumeBtn");
  const pr = dbProgressMap[videoId];

  if (pr && pr.lastPositionSec > 5) {
    btn.style.display = "inline-block";
    btn.textContent = `Resume ${formatHMS(pr.lastPositionSec)}`;
  } else {
    btn.style.display = "none";
  }
}

function resumeVideo() {
  const pr = dbProgressMap[currentVideoId];
  if (!pr || !pr.lastPositionSec || !player) return;
  player.seekTo(pr.lastPositionSec, true);
  player.playVideo();
}

function loadOrPlay(videoId, titleForHistory) {
  currentVideoId = videoId;
  currentVideoTitle = titleForHistory || "Video";
  document.getElementById("nowPlaying").textContent = currentVideoTitle;

  updateResumeButton(videoId);

  if (player) {
    player.loadVideoById(videoId);
  } else {
    player = new YT.Player("player", {
      height: "450",
      width: "100%",
      videoId,
      events: {
        onReady: (e) => e.target.playVideo(),
        onStateChange: onPlayerStateChange
      }
    });
  }

  saveToHistory(videoId, currentVideoTitle);
}

function onYouTubeIframeAPIReady() {}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    startProgressTracking();
  }

  if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
    stopProgressTracking();
  }

  if (event.data === YT.PlayerState.ENDED) {
    markHistoryCompleted(currentVideoId);
  }
}

// anti-seek-cheat watchtime:
// only add real elapsed wall-clock seconds while video is actually playing
function startProgressTracking() {
  stopProgressTracking();

  let lastTick = Date.now();

  progressTimer = setInterval(async () => {
    if (!player || !player.getDuration || !currentVideoId) return;

    const now = Date.now();
    const elapsedSec = Math.max(0, Math.min(10, (now - lastTick) / 1000));
    lastTick = now;

    const duration = Number(player.getDuration() || 0);
    const currentPos = Number(player.getCurrentTime() || 0);

    const deltaWatchSec = Math.floor(elapsedSec);

    if (deltaWatchSec <= 0) return;

    try {
      const res = await fetch(`${BACKEND}/api/progress/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
          videoId: currentVideoId,
          title: currentVideoTitle,
          deltaWatchSec,
          currentPositionSec: currentPos,
          durationSec: duration
        })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) return;

      dbProgressMap[currentVideoId] = data.progress;

      document.getElementById("watchtime").innerText = formatHMS(data.progress.watchTimeSec || 0);
      document.getElementById("percent").innerText = getVideoPercent(data.progress);
      document.getElementById("progressBar").style.width = `${getVideoPercent(data.progress)}%`;

      const t = ensureToday();
      localDailyStats[t].watchSec += deltaWatchSec;
      saveLocalBits();

      updateResumeButton(currentVideoId);
      updatePlaylistProgressUI();
      renderSelectedPlaylist();
      renderAnalytics();
    } catch (err) {
      console.error(err);
    }
  }, 5000);
}

function stopProgressTracking() {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
}

function playSingleVideo() {
  const url = document.getElementById("singleVideoUrl").value.trim();
  const videoId = extractVideoID(url);

  if (!videoId) {
    alert("Invalid YouTube URL");
    return;
  }

  loadOrPlay(videoId, "Single Video");
}

function prevInSelected() {
  const selected = getSelectedPlaylist();
  if (!selected || !selected.videos.length) return;

  const idx = selected.videos.findIndex(v => v.id === currentVideoId);
  const prevIdx = idx <= 0 ? selected.videos.length - 1 : idx - 1;
  const target = selected.videos[prevIdx];

  loadOrPlay(target.id, target.title);
}

function nextInSelected() {
  const selected = getSelectedPlaylist();
  if (!selected || !selected.videos.length) return;

  const idx = selected.videos.findIndex(v => v.id === currentVideoId);
  const nextIdx = idx === -1 ? 0 : (idx + 1) % selected.videos.length;
  const target = selected.videos[nextIdx];

  loadOrPlay(target.id, target.title);
}

function clearHistory() {
  if (!confirm("Clear history?")) return;
  history = [];
  saveLocalBits();
  renderHistory();
  toast("History cleared");
}

function getVideoPercent(progress) {
  if (!progress) return 0;
  const watch = Number(progress.watchTimeSec || 0);
  const duration = Number(progress.durationSec || 0);
  if (duration <= 0) return 0;
  return Math.min(100, Math.floor((watch / duration) * 100));
}

function computePlaylistWatchtimeSec(playlist) {
  if (!playlist || !playlist.videos || !playlist.videos.length) return 0;

  let total = 0;
  playlist.videos.forEach(video => {
    const pr = dbProgressMap[video.id];
    if (pr) total += Number(pr.watchTimeSec || 0);
  });
  return total;
}

function computePlaylistProgressPercent(playlist) {
  if (!playlist || !playlist.videos || !playlist.videos.length) return 0;

  let watched = 0;
  let duration = 0;

  playlist.videos.forEach(video => {
    const pr = dbProgressMap[video.id];
    if (!pr) return;
    watched += Number(pr.watchTimeSec || 0);
    duration += Number(pr.durationSec || 0);
  });

  if (duration <= 0) return 0;
  return Math.min(100, Math.floor((watched / duration) * 100));
}

function updatePlaylistProgressUI() {
  const selected = getSelectedPlaylist();
  const percent = computePlaylistProgressPercent(selected);
  const wt = computePlaylistWatchtimeSec(selected);

  document.getElementById("plistProgress").innerText = percent;
  document.getElementById("plistWatchtime").innerText = formatHMS(wt);
}

function getTodayWatchSec() {
  return localDailyStats[todayKey()]?.watchSec || 0;
}

function getLifetimeWatchSec() {
  return Object.values(dbProgressMap).reduce((sum, p) => sum + Number(p.watchTimeSec || 0), 0);
}

function getCompletedCountAll() {
  return Object.values(dbProgressMap).filter(p => p.completed).length;
}

function getTrackedVideosCount() {
  return Object.keys(dbProgressMap).length;
}

function getTopWatchedVideos(limit = 5) {
  return Object.values(dbProgressMap)
    .sort((a, b) => (b.watchTimeSec || 0) - (a.watchTimeSec || 0))
    .slice(0, limit);
}

function getTrendData(days) {
  const out = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${day}`;

    out.push({
      label: `${m}-${day}`,
      sec: localDailyStats[key]?.watchSec || 0
    });
  }

  return out;
}

function drawTrendChart(data) {
  const canvas = document.getElementById("trendChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = rect.width * dpr;
  canvas.height = 220 * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = 220;
  ctx.clearRect(0, 0, W, H);

  const padL = 14;
  const padR = 14;
  const padT = 18;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const max = Math.max(60, ...data.map(d => d.sec));
  const barW = innerW / data.length;

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  for (let i = 0; i < 3; i++) {
    const y = padT + (innerH * i / 2);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + innerW, y);
    ctx.stroke();
  }

  data.forEach((item, i) => {
    const x = padL + i * barW + 6;
    const h = Math.max(2, (item.sec / max) * innerH);
    const y = padT + innerH - h;
    const w = Math.max(8, barW - 12);

    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, "#7a5cff");
    grad.addColorStop(1, "#5b8cff");
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = "#aab5d6";
    ctx.font = "12px Arial";
    ctx.fillText(item.label, x, H - 8);
  });
}

function renderAnalytics() {
  document.getElementById("aToday").textContent = formatHMS(getTodayWatchSec());
  document.getElementById("aLife").textContent = formatHMS(getLifetimeWatchSec());
  document.getElementById("aDone").textContent = getCompletedCountAll();
  document.getElementById("aTracked").textContent = getTrackedVideosCount();

  drawTrendChart(getTrendData(trendDays));

  const topWrap = document.getElementById("topVideos");
  topWrap.innerHTML = "";

  const top = getTopWatchedVideos(5);
  if (!top.length) {
    topWrap.innerHTML = `<div class="listSub">No analytics yet</div>`;
  } else {
    top.forEach((item, idx) => {
      const div = document.createElement("div");
      div.className = "listItem";
      div.onclick = () => loadOrPlay(item.videoId, item.title || "Video");

      div.innerHTML = `
        <div class="listTitle">${idx + 1}. ${item.title || "Video"}</div>
        <div class="listSub">Real watchtime ${formatHMS(item.watchTimeSec || 0)} • Progress ${getVideoPercent(item)}%</div>
      `;

      topWrap.appendChild(div);
    });
  }

  const playlistWrap = document.getElementById("playlistStats");
  playlistWrap.innerHTML = "";

  if (!userPlaylists.length) {
    playlistWrap.innerHTML = `<div class="listSub">No playlists</div>`;
  } else {
    userPlaylists.forEach(p => {
      const div = document.createElement("div");
      div.className = "listItem";
      div.onclick = () => {
        selectedPlaylistId = p.id;
        renderPlaylistList();
        renderSelectedPlaylist();
        updateSelectedName();
        updatePlaylistProgressUI();
      };

      div.innerHTML = `
        <div class="listTitle">${p.name}</div>
        <div class="listSub">Progress ${computePlaylistProgressPercent(p)}% • Watchtime ${formatHMS(computePlaylistWatchtimeSec(p))} • Videos ${p.videos.length}</div>
      `;

      playlistWrap.appendChild(div);
    });
  }
}

function setTrendDays(days) {
  trendDays = days;
  renderAnalytics();
}

window.addEventListener("DOMContentLoaded", async () => {
  showUser();
  renderHistory();
  await loadPlaylistsFromDB(false);
  await loadProgressFromDB();
  renderAnalytics();
});
async function fetchVideoMeta(videoId) {
  const res = await fetch(`${BACKEND}/api/videos/meta/${videoId}`, {
    headers: {
      "Authorization": "Bearer " + token
    }
  });

  const data = await res.json();

  if (!res.ok || !data.ok) {
    throw new Error(data.error || data.details || "Failed to fetch video metadata");
  }

  return data.video;
}