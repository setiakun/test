const FAIL_KEY = "pw_fail_timestamps";
const COOLDOWN_KEY = "pw_cooldown_until";
const FAIL_WINDOW_MS = 10 * 60 * 1000; // 10 menit
const COOLDOWN_MS = 5 * 60 * 1000;     // 5 menit
const FAIL_THRESHOLD = 3;
const LOGIN_COOKIE = "loginhash";
const EXPIRE_SUFFIX = "_expire";
const BLOCK_PREFIX = "blockhash_";

// encoded hashes
const encodedHashes = [
  "Mjc1NWY0MjFlMDhiNjNmNWQ4NDdiMmU0ZDA1NTA5NTUyOTIwNjEyYjY3Y2NhNzRkN2ExZGE5MDZiODNmYjQ2Yg==",
  "YjE0NGYzZGUxODhiYzc3YTAyZjM0NTkzNjRmYWIzNTQyN2M2N2M0Y2Q5MzJiM2NhODE2ZjlmNDExMGUxYTNkYg==",
  "MTE3ZTI0N2Y4Mjg5YTg1NmJhZGJmMmRmODIwMDc0NTkyZTJkMGEyNjIwZjE1NmM1NmM4NzA2ZDQwNjg1MGQ5Ng==",
  "Y2RhZmNiYjNhODFlNGQwZGZlMTU3NjgwODM1MGFhOGY3MmI4NTliMDlkNTY5ZThlYWRiNDJhMDE0NWU5YWIzOA==",
  "NjdhMTNkMWVhNmRkNjFmZWIyNjY5ODczMDdlMDIxZjU1M2Q4NzM3NzZlNWU0Mjc2YWU4N2MzYjQ1NGQxNjkxNA==",
  "YjRkZDA2MjAwOGU3NGJkNTNiMzcwM2ZkN2U5MWU0MmQ0OGVmN2JhYjEzMTg1Y2NlYTkwZGUxY2Y1ODE0MjkyNg==",
  "NmQ0YjllZTYyMDI4YjgwOTgxOTg4NDg0ZTc5MGJhYzFmZGQ1YTllYjlmMzAwMjJjNjI2ODM5N2U1ZGQyYjc5Zg=="
];
const hashes = encodedHashes.map(h => atob(h));
const [ hash1hour, hash1d, hash3d, hash7d, hash14d, hash30d, hash60d ] = hashes;
const hashToLevel = {
  [hash1hour]: "pawn",
  [hash1d]:    "bishop",
  [hash3d]:    "knight",
  [hash7d]:    "rook",
  [hash14d]:   "queen",
  [hash30d]:   "king",
  [hash60d]:   "maou"
};

// promote data-level
const levelOrder = ["pawn","bishop","knight","rook","queen","king","maou"];
function showByLevel(userLevel){
  const userRank = levelOrder.indexOf(userLevel);
  document.querySelectorAll(".realcontent").forEach(box=>{
    box.style.display = "block";
    box.querySelectorAll("[data-level]").forEach(el=>{
      const baseLevel = el.getAttribute("data-level");
      const baseRank = levelOrder.indexOf(baseLevel);

      if(baseRank === -1){
        el.style.display = "none";
        return;
      }
      if(userRank >= baseRank){
        // boleh melihat → naikkan level UI
        el.style.display = "block";
        el.classList.remove("pawn","bishop","knight","rook","queen","king","maou");
        el.classList.add(userLevel);
      } else {
        el.style.display = "none";
      }
    });
  });
  document.body.setAttribute("data-user-level", userLevel);
}

// DURATION
const sessionDurations = {
  [hash1hour]:   1 * 60 * 60 * 1000, // 1 jam
  [hash1d]:     1 * 24 * 60 * 60 * 1000, // 1 hari
  [hash3d]:     3 * 24 * 60 * 60 * 1000, // 3 hari
  [hash7d]:     7 * 24 * 60 * 60 * 1000, // 7 hari
  [hash14d]:   14 * 24 * 60 * 60 * 1000, // 14 hari
  [hash30d]:   30 * 24 * 60 * 60 * 1000, // 30 hari
  [hash60d]:   60 * 24 * 60 * 60 * 1000  // 60 hari
};

// BLOCK TIMES
const blockTimes = {
  [hash1hour]:  30 * 24 * 60 * 60 * 1000, // 30 hari
  [hash1d]:     14 * 24 * 60 * 60 * 1000, // 14 hari
  [hash3d]:      7 * 24 * 60 * 60 * 1000, // 7 hari
  [hash7d]:      3 * 24 * 60 * 60 * 1000, // 3 hari
  [hash14d]:      1 * 60 * 60 * 1000, // 1 jam
  [hash30d]:          30 * 60 * 1000, // 30 menit
  [hash60d]:           5 * 60 * 1000  // 5 menit
};

// UTIL FUNCTIONS
function nowMs(){ return Date.now(); }
function showNotif(msg){
  const nt = document.getElementById("notifText");
  const overlay = document.getElementById("notifikasi");
  if(nt) nt.innerHTML = String(msg).replace(/\n/g,"<br>");
  if(overlay) overlay.style.display = "flex";
}
function closeNotif(){
  const overlay = document.getElementById("notifikasi");
  if(overlay) overlay.style.display = "none";
}

// cookie helpers
function readCookie(name){
  const raw = document.cookie || "";
  const parts = raw.split(";").map(s => s.trim());
  const entry = parts.find(p => p.startsWith(name + "="));
  return entry ? entry.substring(name.length + 1) : "";
}
function setCookie(name, value, expiresMs){
  // expiresMs: absolute timestamp (ms) or undefined/null for session cookie
  let cookie = `${name}=${value}; path=/; SameSite=Lax`;
  if(expiresMs){
    cookie += `; expires=${new Date(expiresMs).toUTCString()}`;
  }
  if(location.protocol === "https:") cookie += "; Secure";
  document.cookie = cookie;
}
function eraseCookie(name){
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

// helper to set cookie + a <name>_expire cookie with timestamp
function setCookieWithExpire(name, value, durationMs){
  const expireTs = nowMs() + Math.max(0, durationMs);
  setCookie(name, value, expireTs);
  setCookie(name + EXPIRE_SUFFIX, String(expireTs), expireTs);
  return expireTs;
}
function getCookieExpire(name){
  const v = readCookie(name + EXPIRE_SUFFIX);
  return v ? parseInt(v,10) || null : null;
}

// format ms -> human
function formatMs(ms){
  ms = Math.max(0, Math.floor(ms));
  const d = Math.floor(ms / (1000*60*60*24));
  const h = Math.floor((ms % (1000*60*60*24)) / (1000*60*60));
  const m = Math.floor((ms % (1000*60*60)) / (1000*60));
  const s = Math.floor((ms % (1000*60)) / 1000);
  if(d > 0) return `${d} hari ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// sha256 util
async function sha256(msg){
  const buf = new TextEncoder().encode(msg);
  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(hashBuf)].map(b => b.toString(16).padStart(2,"0")).join("");
}

// COOLDOWN (global after fails)
function getFailTimestamps(){
  try { return JSON.parse(localStorage.getItem(FAIL_KEY) || "[]"); }
  catch(e){ return []; }
}
function setFailTimestamps(arr){ localStorage.setItem(FAIL_KEY, JSON.stringify(arr)); }
function clearFailTimestamps(){ localStorage.removeItem(FAIL_KEY); }
function getCooldownUntil(){ return parseInt(localStorage.getItem(COOLDOWN_KEY) || "0",10) || 0; }
function setCooldownUntil(ts){
  localStorage.setItem(COOLDOWN_KEY, String(ts));
  startCooldownUI(ts);
}
function clearCooldownData(){
  localStorage.removeItem(COOLDOWN_KEY);
  const el = document.getElementById("cooldownTimer");
  if(el) el.textContent = "";
}

// record fail; returns true if triggered cooldown
function recordFailedAttempt(){
  const now = nowMs();
  let arr = getFailTimestamps();
  arr.push(now);
  arr = arr.filter(t => now - t <= FAIL_WINDOW_MS);
  setFailTimestamps(arr);
  if(arr.length >= FAIL_THRESHOLD){
    const until = now + COOLDOWN_MS;
    setCooldownUntil(until);
    clearFailTimestamps();
    return true;
  }
  return false;
}
function isInCooldown(){ return nowMs() < getCooldownUntil(); }
function getCooldownRemaining(){ return Math.max(0, getCooldownUntil() - nowMs()); }
let cooldownIntervalId = null;
function startCooldownUI(untilTs){
  const el = document.getElementById("cooldownTimer");
  if(!el) return;
  if(cooldownIntervalId) clearInterval(cooldownIntervalId);
  function tick(){
    const left = untilTs - nowMs();
    if(left <= 0){
      el.textContent = "";
      clearInterval(cooldownIntervalId);
      cooldownIntervalId = null;
      clearCooldownData();
      return;
    }
    el.textContent = `Cooldown: ${formatMs(left)}`;
  }
  tick();
  cooldownIntervalId = setInterval(tick, 1000);
}

// BLOCK PER-PASSWORD
function isBlocked(hash){
  if(!hash) return false;
  const val = readCookie(BLOCK_PREFIX + hash);
  const expire = getCookieExpire(BLOCK_PREFIX + hash);
  if(!val || !expire) return false;
  return nowMs() < expire;
}
function setBlock(hash){
  const duration = blockTimes[hash];
  if(!duration) return null;
  const expireTs = setCookieWithExpire(BLOCK_PREFIX + hash, hash, duration);
  startBlockUIUpdater(expireTs);
  return expireTs;
}

let blockIntervalId = null;
function startBlockUIUpdater(expireTs){
  const el = document.getElementById("cooldownTimer");
  if(!el) return;
  if(blockIntervalId) clearInterval(blockIntervalId);
  function tick(){
    const left = expireTs - nowMs();
    if(left <= 0){
      el.textContent = "";
      clearInterval(blockIntervalId);
      blockIntervalId = null;
      return;
    }
    el.textContent = formatMs(left);
  }
  tick();
  blockIntervalId = setInterval(tick, 1000);
}
function showBlockCountdown(expire){
  const left = expire - nowMs();
  if(left <= 0){ showNotif("Blokir sudah selesai."); return; }
  showNotif(`Password ini sedang diblokir selama:\n${formatMs(left)}`);
}

// SESSION (login_start + login_duration)
function saveSessionWithStart(hash, durationMs){
  const start = nowMs();
  const expire = start + durationMs;
  // keep old names used elsewhere (loginhash + loginhash_expire) for compatibility
  setCookie(LOGIN_COOKIE, hash, expire);
  setCookie(LOGIN_COOKIE + EXPIRE_SUFFIX, String(expire), expire);
  // additionally store start timestamp and duration so progress bar survives refresh
  setCookie(LOGIN_COOKIE + "_start", String(start), expire);
  setCookie(LOGIN_COOKIE + "_dur", String(durationMs), expire);
  return { start, expire };
}

function loadSession(){
  const hash = readCookie(LOGIN_COOKIE);
  if(!hash) return null;
  const expire = getCookieExpire(LOGIN_COOKIE);
  if(!expire || nowMs() >= expire) {
    // expired
    eraseCookie(LOGIN_COOKIE);
    eraseCookie(LOGIN_COOKIE + EXPIRE_SUFFIX);
    eraseCookie(LOGIN_COOKIE + "_start");
    eraseCookie(LOGIN_COOKIE + "_dur");
    return null;
  }
  const start = parseInt(readCookie(LOGIN_COOKIE + "_start") || "0",10) || null;
  const dur = parseInt(readCookie(LOGIN_COOKIE + "_dur") || "0",10) || null;
  return { hash, start, dur, expire };
}

// COUNTDOWN and PROGRESS
let countdownTimer = null;
function startCountdown(expireTime, startTime, durationMs){
  const countdownEl = document.getElementById("countdown");
  const fill = document.getElementById("countdownfill");
  if(!countdownEl || !fill) return;
  if(countdownTimer) clearInterval(countdownTimer);
  function update(){
    const now = nowMs();
    const remain = expireTime - now;
    if(remain <= 0){
      if(countdownEl) countdownEl.textContent = "0 hari 0:00:00";
      if(fill){ fill.style.width = "100%"; fill.style.background = "#ff4444"; }
      logout();
      return;
    }
    // human text
    const days  = Math.floor(remain / (1000*60*60*24));
    const hours = Math.floor((remain % (1000*60*60*24)) / (1000*60*60));
    const mins  = Math.floor((remain % (1000*60*60)) / (1000*60));
    const secs  = Math.floor((remain % (1000*60)) / 1000);
    if(countdownEl) countdownEl.textContent = `${days} hari ${hours}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;

    // progress: use startTime + durationMs
    if(fill && startTime && durationMs && durationMs > 0){
      const elapsed = now - startTime;
      const pct = Math.max(0, Math.min(100, (elapsed / durationMs) * 100));
      fill.style.width = pct + "%";
      fill.style.background = pct < 40 ? "#4caf50" : pct < 70 ? "#ffbb33" : "#ff4444";
    }
  }
  update();
  countdownTimer = setInterval(update, 1000);
}

// SHOW / HIDE PASSWORD
function togglePassword() {
  const p = document.getElementById("password");
  const svg = document.querySelector(".showpassicon");
  const path = document.getElementById("eyeIcon");
  if (!p || !svg || !path) return;
  const hidePath = "M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z";
  const showPath = "M3.933 13.909A4.357 4.357 0 0 1 3 12c0-1 4-6 9-6s9 4.8 9 6c0 1-3 6-9 6-.314 0-.62-.014-.918-.04M5 19 19 5m-4 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z";
  if (p.type === "password") {
    p.type = "text";
    path.setAttribute("d", showPath);
  } else {
    p.type = "password";
    path.setAttribute("d", hidePath);
  }
}

// LOGIN / VERIFY
async function verify(){
  // check cooldown
  if(isInCooldown()){
    const left = getCooldownRemaining();
    const el = document.getElementById("cooldownTimer");
    if(el) el.textContent = `Cooldown aktif: ${formatMs(left)}`;
    showNotif(`Terlalu banyak percobaan salah. Anda sedang cooldown selama ${formatMs(left)}.`);
    return;
  }
  const pass = (document.getElementById("password").value || "");
  const hash = await sha256(pass);
  // per-password blocked?
  if(isBlocked(hash)){
    const expire = getCookieExpire(BLOCK_PREFIX + hash);
    showBlockCountdown(expire);
    return;
  }
  // match known hash -> set session duration using sessionDurations map
  const duration = sessionDurations[hash];
  if(!duration){
    // wrong
    const triggered = recordFailedAttempt();
    if(triggered){
      const until = getCooldownUntil();
      startCooldownUI(until);
      showNotif(`Salah password 3×. Anda diblokir sementara selama ${formatMs(COOLDOWN_MS)}.`);
    } else {
      const arr = getFailTimestamps();
      const rem = FAIL_THRESHOLD - arr.length;
      showNotif(`Password salah! Sisa percobaan sebelum cooldown: ${rem}`);
    }
    return;
  }
  // success -> clear fails/cooldown
  clearFailTimestamps();
  clearCooldownData();
  // set cookies (loginhash + loginhash_expire) and also login_start + login_duration for progress
  const { start, expire } = saveSessionWithStart(hash, duration);
  // show messages similar to original
  if(hash === hash1hour) showNotif("Opppppppaaaaaaaaaiiiii!!!!!! Pawn-sama!");
  else if(hash === hash1d) showNotif("Ayo Terus Cari, Bishop-kun!!!");
  else if(hash === hash3d) showNotif("Bolehlahhhhh, Knight-san!!!");
  else if(hash === hash7d) showNotif("Maaf! Anda Kurang Beruntung, Rook-chan!!!");
  else if(hash === hash14d) showNotif("Ugh! Sedikit Lagi, Queen-dono!!!");
  else if(hash === hash30d) showNotif("Selamat! Anda Menemukan Jackpot, King-dono!!!");
  else if(hash === hash60d) showNotif("Kenapa Lama-Lama, 30d Juga Cukup, kan, Maou-sama?");
  toggleLogin(true);
  const level = hashToLevel[hash] || "guest";
  showByLevel(level);
  startCountdown(expire, start, duration);
}

// LOGOUT
function logout(){
  const lastHash = readCookie(LOGIN_COOKIE);
  if(countdownTimer){ clearInterval(countdownTimer); countdownTimer = null; }
  // if this password has configured blockTimes (old mapping), set block
  if(lastHash && blockTimes[lastHash]){
    const expire = setBlock(lastHash);
    const left = expire - nowMs();
    const d = Math.floor(left/(1000*60*60*24));
    const h = Math.floor((left%(1000*60*60*24))/(1000*60*60));
    const m = Math.floor((left%(1000*60*60))/(1000*60));
    const s = Math.floor((left%(1000*60))/1000);
    showNotif(`Logout berhasil.\nPassword ini diblokir selama ${d} hari ${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
  } else {
    showNotif("Anda telah logout");
  }
  // erase session cookies
  eraseCookie(LOGIN_COOKIE);
  eraseCookie(LOGIN_COOKIE + EXPIRE_SUFFIX);
  eraseCookie(LOGIN_COOKIE + "_start");
  eraseCookie(LOGIN_COOKIE + "_dur");
  toggleLogin(false);
  document.body.removeAttribute("data-user-level");
}

// toggle UI
function toggleLogin(isLogin){
  const lb = document.getElementById("loginbox");
  // loginbox
  if(lb){lb.style.display = isLogin ? "none" : "block";}
  // semua realcontent
  document.querySelectorAll(".realcontent").forEach(rc=>{rc.style.display = isLogin ? "block" : "none";});
}

// AUTO-LOGIN ON LOAD
window.addEventListener("DOMContentLoaded", () => {
  // start cooldown UI if active
  const cooldownUntil = getCooldownUntil();
  if(nowMs() < cooldownUntil) startCooldownUI(cooldownUntil);
  // if cookie exists but the hash is currently blocked -> clear
  const currentHash = readCookie(LOGIN_COOKIE);
  if(currentHash && isBlocked(currentHash)){
    const expire = getCookieExpire(BLOCK_PREFIX + currentHash);
    if(expire) showBlockCountdown(expire);
    // remove login cookie if blocked
    eraseCookie(LOGIN_COOKIE);
    eraseCookie(LOGIN_COOKIE + EXPIRE_SUFFIX);
    eraseCookie(LOGIN_COOKIE + "_start");
    eraseCookie(LOGIN_COOKIE + "_dur");
    toggleLogin(false);
    return;
  }
  // restore session if valid
  const session = loadSession();
  if(session){
    // if start/dur missing, attempt to reconstruct: if we only have expire, set start = expire - sessionDurations[hash] (fallback)
    let { hash, start, dur, expire } = session;
    if(!dur || !start){
      dur = sessionDurations[hash] || (expire - nowMs());
      start = expire - dur;
      // persist reconstructed values
      setCookie(LOGIN_COOKIE + "_start", String(start), expire);
      setCookie(LOGIN_COOKIE + "_dur", String(dur), expire);
    }
    if(expire && nowMs() < expire){
      toggleLogin(true);
      const level = hashToLevel[hash] || "guest";
      showByLevel(level);
      startCountdown(expire, start, dur);
    } else {
      // expired
      eraseCookie(LOGIN_COOKIE);
      eraseCookie(LOGIN_COOKIE + EXPIRE_SUFFIX);
      eraseCookie(LOGIN_COOKIE + "_start");
      eraseCookie(LOGIN_COOKIE + "_dur");
      toggleLogin(false);
    }
  }
  // ENTER key binding
  const pw = document.getElementById("password");
  if(pw) pw.addEventListener("keydown", e => { if(e.key === "Enter") verify(); });
});

// expose closeNotif to HTML button if present
window.closeNotif = closeNotif;
window.logout = logout;
