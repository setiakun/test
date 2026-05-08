// ======================
// CONFIG
// ======================
const FAIL_KEY = "pw_fail_timestamps";
const COOLDOWN_KEY = "pw_cooldown_until";
const FAIL_WINDOW_MS = 10 * 60 * 1000; // 10 menit
const COOLDOWN_MS = 5 * 60 * 1000;     // 5 menit
const FAIL_THRESHOLD = 3;

const LOGIN_COOKIE = "loginhash";
const EXPIRE_SUFFIX = "_expire";
const BLOCK_PREFIX = "blockhash_";

const encodedHashes = [
  "Mjc1NWY0MjFlMDhiNjNmNWQ4NDdiMmU0ZDA1NTA5NTUyOTIwNjEyYjY3Y2NhNzRkN2ExZGE5MDZiODNmYjQ2Yg==",
  "YjE0NGYzZGUxODhiYzc3YTAyZjM0NTkzNjRmYWIzNTQyN2M2N2M0Y2Q5MzJiM2NhODE2ZjlmNDExMGUxYTNkYg==",
  "MTE3ZTI0N2Y4Mjg5YTg1NmJhZGJmMmRmODIwMDc0NTkyZTJkMGEyNjIwZjE1NmM1NmM4NzA2ZDQwNjg1MGQ5Ng==",
  "Y2RhZmNiYjNhODFlNGQwZGZlMTU3NjgwODM1MGFhOGY3MmI4NTliMDlkNTY5ZThlYWRiNDJhMDE0NWU5YWIzOA==",
  "NjdhMTNkMWVhNmRkNjFmZWIyNjY5ODczMDdlMDIxZjU1M2Q4NzM3NzZlNWU0Mjc2YWU4N2MzYjQ1NGQxNjkxNA==",
  "YjRkZDA2MjAwOGU3NGJkNTNiMzcwM2ZkN2U5MWU0MmQ0OGVmN2JhYjEzMTg1Y2NlYTkwZGUxY2Y1ODE0MjkyNg==",
  "NmQ0YjllZTYyMDI4YjgwOTgxOTg4NDg0ZTc5MGJhYzFmZGQ1YTllYjlmMzAwMjJjNjI2ODM5N2U1ZGQyYjc5Zg=="
].map(h => atob(h));

const [hash1hour, hash1d, hash3d, hash7d, hash14d, hash30d, hash60d] = encodedHashes;

const levelOrder = ["pawn","bishop","knight","rook","queen","king","maou"];
const hashToLevel = {
  [hash1hour]: "pawn",
  [hash1d]:    "bishop",
  [hash3d]:    "knight",
  [hash7d]:    "rook",
  [hash14d]:   "queen",
  [hash30d]:   "king",
  [hash60d]:   "maou"
};

const sessionDurations = {
  [hash1hour]:  1*60*60*1000,
  [hash1d]:     24*60*60*1000,
  [hash3d]:     3*24*60*60*1000,
  [hash7d]:     7*24*60*60*1000,
  [hash14d]:    14*24*60*60*1000,
  [hash30d]:    30*24*60*60*1000,
  [hash60d]:    60*24*60*60*1000
};

const blockTimes = {
  [hash1hour]:  30*24*60*60*1000,
  [hash1d]:     14*24*60*60*1000,
  [hash3d]:     7*24*60*60*1000,
  [hash7d]:     3*24*60*60*1000,
  [hash14d]:    1*60*60*1000,
  [hash30d]:    30*60*1000,
  [hash60d]:    5*60*1000
};

// ======================
// UTILS
// ======================
const nowMs = () => Date.now();

function readCookie(name){
  const raw = document.cookie || "";
  const parts = raw.split(/;\s*/);
  const entry = parts.find(p => p.startsWith(name + "="));
  return entry ? entry.substring(name.length+1) : "";
}

function setCookie(name, value, expiresMs){
  let cookie = `${name}=${value}; path=/; SameSite=Lax`;
  if(expiresMs) cookie += `; expires=${new Date(expiresMs).toUTCString()}`;
  if(location.protocol === "https:") cookie += "; Secure";
  document.cookie = cookie;
}

function eraseCookie(name){
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

function setCookieWithExpire(name, value, durationMs){
  const expireTs = nowMs() + Math.max(0, durationMs);
  setCookie(name, value, expireTs);
  setCookie(name+EXPIRE_SUFFIX, String(expireTs), expireTs);
  return expireTs;
}

function getCookieExpire(name){
  const v = readCookie(name+EXPIRE_SUFFIX);
  return v ? parseInt(v,10) || null : null;
}

function formatMs(ms){
  ms = Math.max(0, Math.floor(ms));
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000)/3600000);
  const m = Math.floor((ms % 3600000)/60000);
  const s = Math.floor((ms % 60000)/1000);
  return d>0 ? `${d} hari ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

async function sha256(msg){
  const buf = new TextEncoder().encode(msg);
  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(hashBuf)].map(b=>b.toString(16).padStart(2,"0")).join("");
}

// ======================
// FAIL / COOLDOWN
// ======================
function getFailTimestamps(){ return JSON.parse(localStorage.getItem(FAIL_KEY)||"[]"); }
function setFailTimestamps(arr){ localStorage.setItem(FAIL_KEY, JSON.stringify(arr)); }
function clearFailTimestamps(){ localStorage.removeItem(FAIL_KEY); }

function getCooldownUntil(){ return parseInt(localStorage.getItem(COOLDOWN_KEY)||"0",10)||0; }
function setCooldownUntil(ts){ localStorage.setItem(COOLDOWN_KEY,String(ts)); startCooldownUI(ts); }
function clearCooldownData(){ localStorage.removeItem(COOLDOWN_KEY); const el=document.getElementById("cooldownTimer"); if(el) el.textContent=""; }

function recordFailedAttempt(){
  const now = nowMs();
  let arr = getFailTimestamps();
  arr.push(now);
  arr = arr.filter(t=>now-t <= FAIL_WINDOW_MS);
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
function getCooldownRemaining(){ return Math.max(0,getCooldownUntil()-nowMs()); }

let cooldownIntervalId = null;
function startCooldownUI(untilTs){
  const el = document.getElementById("cooldownTimer");
  if(!el) return;
  if(cooldownIntervalId) clearInterval(cooldownIntervalId);

  function tick(){
    const left = untilTs-nowMs();
    if(left<=0){ el.textContent=""; clearInterval(cooldownIntervalId); cooldownIntervalId=null; clearCooldownData(); return; }
    el.textContent=`Cooldown: ${formatMs(left)}`;
  }
  tick();
  cooldownIntervalId = setInterval(tick,1000);
}

// ======================
// BLOCK PER PASSWORD
// ======================
function isBlocked(hash){
  if(!hash) return false;
  const val = readCookie(BLOCK_PREFIX+hash);
  const expire = getCookieExpire(BLOCK_PREFIX+hash);
  return !!val && !!expire && nowMs()<expire;
}

function setBlock(hash){
  const duration = blockTimes[hash]; if(!duration) return null;
  const expire = setCookieWithExpire(BLOCK_PREFIX+hash, hash, duration);
  return expire;
}

// ======================
// PASSWORD CHECK
// ======================
async function checkPassword(input){
  if(isInCooldown()){ alert("Global cooldown aktif!"); return false; }
  const trimmed = input.trim();
  const hash = await sha256(trimmed);
  if(!hashToLevel[hash]) { 
    const blocked = recordFailedAttempt();
    if(blocked) alert("Terlalu banyak gagal! Cooldown aktif.");
    else alert("Password salah!");
    return false;
  }
  if(isBlocked(hash)){ alert(`Password level ${hashToLevel[hash]} sedang diblokir.`); return false; }
  // valid
  const duration = sessionDurations[hash] || 0;
  setCookieWithExpire(LOGIN_COOKIE, hash, duration);
  setBlock(hash); // optional: block after use
  applyAccessLevel(hashToLevel[hash]);
  return true;
}

// ======================
// ACCESS / UI
// ======================
function applyAccessLevel(level){
  levelOrder.forEach(l=>{
    const els = document.querySelectorAll(`.show-${l}`);
    els.forEach(el=>el.style.display=(levelOrder.indexOf(level)>=levelOrder.indexOf(l))?"":"none");
  });
}

// ======================
// PASSWORD TOGGLE
// ======================
function togglePassword(){
  const p=document.getElementById("password");
  const path=document.getElementById("eyeIcon");
  if(!p || !path) return;
  const hidden=p.type==="password";
  p.type = hidden ? "text":"password";
  const showPath = "M3.933 13.909A4.357 4.357 0 0 1 3 12c0-1 4-6 9-6s9 4.8 9 6c0 1-3 6-9 6-.314 0-.62-.014-.918-.04M5 19 19 5m-4 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z";
  const hidePath = "M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z";
  path.setAttribute("d", hidden ? showPath : hidePath);
}
