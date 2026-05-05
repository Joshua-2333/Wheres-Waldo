// client/scripts/app.js
import { validateGuess, postScore, getLeaderboard } from "./api.js";
import confetti from "https://cdn.skypack.dev/canvas-confetti";

const image = document.getElementById("game-image");
const targetBox = document.getElementById("target-box");
const select = document.getElementById("character-select");
const gameContainer = document.getElementById("game-container");

const timerEl = document.getElementById("timer");
const winMessage = document.getElementById("win-message");
const toast = document.getElementById("toast");

const leaderboardModal = document.getElementById("leaderboard-modal");
const leaderboardList = document.getElementById("leaderboard-list");
const leaderboardTitle = document.getElementById("leaderboard-title");
const leaderboardLoading = document.getElementById("leaderboard-loading");
const bestBadge = document.getElementById("best-badge");

const rotateOverlay = document.getElementById("rotate-overlay");

const playerName = sessionStorage.getItem("playerName") || "Player";

const params = new URLSearchParams(window.location.search);
const scene = params.get("scene") || "winter";

const SCENE_TO_FILE = {
  winter: "winter.jpg",
  beach: "beach.jpeg",
  space: "space.jpg",
};

const SCENE_TO_IMAGE_NAME = {
  winter: "Winter Scene",
  beach: "Beach Scene",
  space: "Space Scene",
};

const SCENE_TO_TITLE = {
  winter: "Winter Scene",
  beach: "Beach Scene",
  space: "Space Scene",
};

image.src = `./assets/${SCENE_TO_FILE[scene]}`;

let lastClick = null;
let clickLocked = false;
const foundCharacters = new Set();

let seconds = 0;
let timerInterval = null;

/* ===== ORIENTATION LOCK ===== */
function checkOrientation() {
  const isMobile = window.innerWidth < 1024;
  const isPortrait = window.innerHeight > window.innerWidth;
  rotateOverlay.classList.toggle("show", isMobile && isPortrait);
}

window.addEventListener("resize", checkOrientation);
window.addEventListener("orientationchange", checkOrientation);
checkOrientation();

/* ===== TIMER ===== */
function startTimer() {
  timerInterval = setInterval(() => {
    seconds++;
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    timerEl.textContent = `Time: ${mins}:${secs}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

/* ===== UI HELPERS ===== */
function showToast(message, type = "success") {
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => (toast.className = "toast"), 1500);
}

function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

/* ===== LEADERBOARD ===== */
async function showLeaderboard(finalTime) {
  leaderboardTitle.textContent = `${SCENE_TO_TITLE[scene]} Leaderboard`;
  leaderboardModal.classList.remove("hidden");
  leaderboardLoading.classList.remove("hidden");
  leaderboardList.innerHTML = "";
  bestBadge.classList.add("hidden");

  try {
    const scores = await getLeaderboard(scene);
    leaderboardLoading.classList.add("hidden");

    const bestTime = scores[0]?.time_seconds ?? Infinity;
    if (finalTime < bestTime) bestBadge.classList.remove("hidden");

    scores.forEach((score, i) => {
      const li = document.createElement("li");
      li.style.animationDelay = `${i * 0.05}s`;
      li.innerHTML = `<span>${score.name}</span><span>${formatTime(score.time_seconds)}</span>`;
      if (score.name === playerName && score.time_seconds === finalTime) {
        li.classList.add("highlight");
      }
      leaderboardList.appendChild(li);
    });
  } catch {
    leaderboardLoading.classList.add("hidden");
    showToast("Leaderboard offline — using local", "error");

    const fallback = JSON.parse(localStorage.getItem(`scores_${scene}`)) || [];
    fallback.push({ name: playerName, time_seconds: finalTime });
    fallback.sort((a, b) => a.time_seconds - b.time_seconds);
    localStorage.setItem(`scores_${scene}`, JSON.stringify(fallback.slice(0, 10)));

    bestBadge.classList.remove("hidden");
    fallback.forEach((score) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${score.name}</span><span>${formatTime(score.time_seconds)}</span>`;
      leaderboardList.appendChild(li);
    });
  }
}

/* ===== WIN CHECK ===== */
function checkWin() {
  if (foundCharacters.size === 4) {
    stopTimer();
    winMessage.classList.remove("hidden");

    confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });

    postScore(playerName, scene, seconds)
      .finally(() => showLeaderboard(seconds));
  }
}

/* ===== MARKERS ===== */
function drawMarker(x, y, color = "green", temporary = false) {
  const rect = image.getBoundingClientRect();
  const containerRect = gameContainer.getBoundingClientRect();

  const marker = document.createElement("div");
  marker.className = "marker";
  marker.style.borderColor = color;
  marker.style.left = `${rect.left - containerRect.left + x * rect.width}px`;
  marker.style.top = `${rect.top - containerRect.top + y * rect.height}px`;

  gameContainer.appendChild(marker);
  if (temporary) setTimeout(() => marker.remove(), 800);
}

startTimer();

/* ===== CLICK LOGIC ===== */
image.addEventListener("click", (e) => {
  if (clickLocked) return;

  const rect = image.getBoundingClientRect();
  const containerRect = gameContainer.getBoundingClientRect();

  lastClick = {
    x: (e.clientX - rect.left) / rect.width,
    y: (e.clientY - rect.top) / rect.height,
  };

  targetBox.style.left = `${rect.left - containerRect.left + lastClick.x * rect.width}px`;
  targetBox.style.top = `${rect.top - containerRect.top + lastClick.y * rect.height}px`;

  targetBox.classList.remove("hidden");
  clickLocked = true;
});

select.addEventListener("change", async (e) => {
  if (!lastClick || !e.target.value) return;

  const character = e.target.value;

  try {
    if (foundCharacters.has(character)) {
      showToast("Already found", "error");
      return;
    }

    drawMarker(lastClick.x, lastClick.y, "red", true);

    const result = await validateGuess(
      character,
      lastClick.x,
      lastClick.y,
      SCENE_TO_IMAGE_NAME[scene]
    );

    if (result.correct) {
      drawMarker(lastClick.x, lastClick.y, "lime");
      foundCharacters.add(character);
      select.querySelector(`option[value="${character}"]`).disabled = true;
      showToast(`${character.toUpperCase()} found! 🎉`);
      checkWin();
    } else {
      showToast("Close, but not quite 👀", "error");
    }
  } finally {
    targetBox.classList.add("hidden");
    select.value = "";
    lastClick = null;
    clickLocked = false;
  }
});

document.getElementById("replay-btn").onclick = () => location.reload();
document.getElementById("home-btn").onclick = () => (location.href = "index.html");
