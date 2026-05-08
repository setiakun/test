const FAIL_KEY = &quot;pw_fail_timestamps&quot;;
const COOLDOWN_KEY = &quot;pw_cooldown_until&quot;;
const FAIL_WINDOW_MS = 10 * 60 * 1000; // 10 menit
const COOLDOWN_MS = 5 * 60 * 1000;     // 5 menit
const FAIL_THRESHOLD = 3;
const LOGIN_COOKIE = &quot;loginhash&quot;;
const EXPIRE_SUFFIX = &quot;_expire&quot;;
const BLOCK_PREFIX = &quot;blockhash_&quot;;

// encoded hashes
const encodedHashes = [
  &quot;Mjc1NWY0MjFlMDhiNjNmNWQ4NDdiMmU0ZDA1NTA5NTUyOTIwNjEyYjY3Y2NhNzRkN2ExZGE5MDZiODNmYjQ2Yg==&quot;,
  &quot;YjE0NGYzZGUxODhiYzc3YTAyZjM0NTkzNjRmYWIzNTQyN2M2N2M0Y2Q5MzJiM2NhODE2ZjlmNDExMGUxYTNkYg==&quot;,
  &quot;MTE3ZTI0N2Y4Mjg5YTg1NmJhZGJmMmRmODIwMDc0NTkyZTJkMGEyNjIwZjE1NmM1NmM4NzA2ZDQwNjg1MGQ5Ng==&quot;,
  &quot;Y2RhZmNiYjNhODFlNGQwZGZlMTU3NjgwODM1MGFhOGY3MmI4NTliMDlkNTY5ZThlYWRiNDJhMDE0NWU5YWIzOA==&quot;,
  &quot;NjdhMTNkMWVhNmRkNjFmZWIyNjY5ODczMDdlMDIxZjU1M2Q4NzM3NzZlNWU0Mjc2YWU4N2MzYjQ1NGQxNjkxNA==&quot;,
  &quot;YjRkZDA2MjAwOGU3NGJkNTNiMzcwM2ZkN2U5MWU0MmQ0OGVmN2JhYjEzMTg1Y2NlYTkwZGUxY2Y1ODE0MjkyNg==&quot;,
  &quot;NmQ0YjllZTYyMDI4YjgwOTgxOTg4NDg0ZTc5MGJhYzFmZGQ1YTllYjlmMzAwMjJjNjI2ODM5N2U1ZGQyYjc5Zg==&quot;
];
const hashes = encodedHashes.map(h =&gt; atob(h));
const [ hash1hour, hash1d, hash3d, hash7d, hash14d, hash30d, hash60d ] = hashes;
const hashToLevel = {
  [hash1hour]: &quot;pawn&quot;,
  [hash1d]:    &quot;bishop&quot;,
  [hash3d]:    &quot;knight&quot;,
  [hash7d]:    &quot;rook&quot;,
  [hash14d]:   &quot;queen&quot;,
  [hash30d]:   &quot;king&quot;,
  [hash60d]:   &quot;maou&quot;
};

// promote data-level
const levelOrder = [&quot;pawn&quot;,&quot;bishop&quot;,&quot;knight&quot;,&quot;rook&quot;,&quot;queen&quot;,&quot;king&quot;,&quot;maou&quot;];
function showByLevel(userLevel){
  const userRank = levelOrder.indexOf(userLevel);
  document.querySelectorAll(&quot;.realcontent&quot;).forEach(box=&gt;{
    box.style.display = &quot;block&quot;;
    box.querySelectorAll(&quot;[data-level]&quot;).forEach(el=&gt;{
      const baseLevel = el.getAttribute(&quot;data-level&quot;);
      const baseRank = levelOrder.indexOf(baseLevel);

      if(baseRank === -1){
        el.style.display = &quot;none&quot;;
        return;
      }
      if(userRank &gt;= baseRank){
        // boleh melihat &#8594; naikkan level UI
        el.style.display = &quot;block&quot;;
        el.classList.remove(&quot;pawn&quot;,&quot;bishop&quot;,&quot;knight&quot;,&quot;rook&quot;,&quot;queen&quot;,&quot;king&quot;,&quot;maou&quot;);
        el.classList.add(userLevel);
      } else {
        el.style.display = &quot;none&quot;;
      }
    });
  });
  document.body.setAttribute(&quot;data-user-level&quot;, userLevel);
}

// DURATION
const sessionDurations = {
  [hash1hour]:  	 1 * 60 * 60 * 1000, // 1 jam
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
  [hash14d]:     	  1 * 60 * 60 * 1000, // 1 jam
  [hash30d]:    		  30 * 60 * 1000, // 30 menit
  [hash60d]:    		   5 * 60 * 1000  // 5 menit
};

// UTIL FUNCTIONS
function nowMs(){ return Date.now(); }
function showNotif(msg){
  const nt = document.getElementById(&quot;notifText&quot;);
  const overlay = document.getElementById(&quot;notifikasi&quot;);
  if(nt) nt.innerHTML = String(msg).replace(/\n/g,&quot;&lt;br&gt;&quot;);
  if(overlay) overlay.style.display = &quot;flex&quot;;
}
function closeNotif(){
  const overlay = document.getElementById(&quot;notifikasi&quot;);
  if(overlay) overlay.style.display = &quot;none&quot;;
}

// cookie helpers
function readCookie(name){
  const raw = document.cookie || &quot;&quot;;
  const parts = raw.split(&quot;;&quot;).map(s =&gt; s.trim());
  const entry = parts.find(p =&gt; p.startsWith(name + &quot;=&quot;));
  return entry ? entry.substring(name.length + 1) : &quot;&quot;;
}
function setCookie(name, value, expiresMs){
  // expiresMs: absolute timestamp (ms) or undefined/null for session cookie
  let cookie = `${name}=${value}; path=/; SameSite=Lax`;
  if(expiresMs){
    cookie += `; expires=${new Date(expiresMs).toUTCString()}`;
  }
  if(location.protocol === &quot;https:&quot;) cookie += &quot;; Secure&quot;;
  document.cookie = cookie;
}
function eraseCookie(name){
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

// helper to set cookie + a &lt;name&gt;_expire cookie with timestamp
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

// format ms -&gt; human
function formatMs(ms){
  ms = Math.max(0, Math.floor(ms));
  const d = Math.floor(ms / (1000*60*60*24));
  const h = Math.floor((ms % (1000*60*60*24)) / (1000*60*60));
  const m = Math.floor((ms % (1000*60*60)) / (1000*60));
  const s = Math.floor((ms % (1000*60)) / 1000);
  if(d &gt; 0) return `${d} hari ${String(h).padStart(2,&#39;0&#39;)}:${String(m).padStart(2,&#39;0&#39;)}:${String(s).padStart(2,&#39;0&#39;)}`;
  return `${h}:${String(m).padStart(2,&#39;0&#39;)}:${String(s).padStart(2,&#39;0&#39;)}`;
}

// sha256 util
async function sha256(msg){
  const buf = new TextEncoder().encode(msg);
  const hashBuf = await crypto.subtle.digest(&quot;SHA-256&quot;, buf);
  return [...new Uint8Array(hashBuf)].map(b =&gt; b.toString(16).padStart(2,&quot;0&quot;)).join(&quot;&quot;);
}

// COOLDOWN (global after fails)
function getFailTimestamps(){
  try { return JSON.parse(localStorage.getItem(FAIL_KEY) || &quot;[]&quot;); }
  catch(e){ return []; }
}
function setFailTimestamps(arr){ localStorage.setItem(FAIL_KEY, JSON.stringify(arr)); }
function clearFailTimestamps(){ localStorage.removeItem(FAIL_KEY); }
function getCooldownUntil(){ return parseInt(localStorage.getItem(COOLDOWN_KEY) || &quot;0&quot;,10) || 0; }
function setCooldownUntil(ts){
  localStorage.setItem(COOLDOWN_KEY, String(ts));
  startCooldownUI(ts);
}
function clearCooldownData(){
  localStorage.removeItem(COOLDOWN_KEY);
  const el = document.getElementById(&quot;cooldownTimer&quot;);
  if(el) el.textContent = &quot;&quot;;
}

// record fail; returns true if triggered cooldown
function recordFailedAttempt(){
  const now = nowMs();
  let arr = getFailTimestamps();
  arr.push(now);
  arr = arr.filter(t =&gt; now - t &lt;= FAIL_WINDOW_MS);
  setFailTimestamps(arr);
  if(arr.length &gt;= FAIL_THRESHOLD){
    const until = now + COOLDOWN_MS;
    setCooldownUntil(until);
    clearFailTimestamps();
    return true;
  }
  return false;
}
function isInCooldown(){ return nowMs() &lt; getCooldownUntil(); }
function getCooldownRemaining(){ return Math.max(0, getCooldownUntil() - nowMs()); }
let cooldownIntervalId = null;
function startCooldownUI(untilTs){
  const el = document.getElementById(&quot;cooldownTimer&quot;);
  if(!el) return;
  if(cooldownIntervalId) clearInterval(cooldownIntervalId);
  function tick(){
    const left = untilTs - nowMs();
    if(left &lt;= 0){
      el.textContent = &quot;&quot;;
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
  return nowMs() &lt; expire;
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
  const el = document.getElementById(&quot;cooldownTimer&quot;);
  if(!el) return;
  if(blockIntervalId) clearInterval(blockIntervalId);
  function tick(){
    const left = expireTs - nowMs();
    if(left &lt;= 0){
      el.textContent = &quot;&quot;;
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
  if(left &lt;= 0){ showNotif(&quot;Blokir sudah selesai.&quot;); return; }
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
  setCookie(LOGIN_COOKIE + &quot;_start&quot;, String(start), expire);
  setCookie(LOGIN_COOKIE + &quot;_dur&quot;, String(durationMs), expire);
  return { start, expire };
}

function loadSession(){
  const hash = readCookie(LOGIN_COOKIE);
  if(!hash) return null;
  const expire = getCookieExpire(LOGIN_COOKIE);
  if(!expire || nowMs() &gt;= expire) {
    // expired
    eraseCookie(LOGIN_COOKIE);
    eraseCookie(LOGIN_COOKIE + EXPIRE_SUFFIX);
    eraseCookie(LOGIN_COOKIE + &quot;_start&quot;);
    eraseCookie(LOGIN_COOKIE + &quot;_dur&quot;);
    return null;
  }
  const start = parseInt(readCookie(LOGIN_COOKIE + &quot;_start&quot;) || &quot;0&quot;,10) || null;
  const dur = parseInt(readCookie(LOGIN_COOKIE + &quot;_dur&quot;) || &quot;0&quot;,10) || null;
  return { hash, start, dur, expire };
}

// COUNTDOWN and PROGRESS
let countdownTimer = null;
function startCountdown(expireTime, startTime, durationMs){
  const countdownEl = document.getElementById(&quot;countdown&quot;);
  const fill = document.getElementById(&quot;countdownfill&quot;);
  if(!countdownEl || !fill) return;
  if(countdownTimer) clearInterval(countdownTimer);
  function update(){
    const now = nowMs();
    const remain = expireTime - now;
    if(remain &lt;= 0){
      if(countdownEl) countdownEl.textContent = &quot;0 hari 0:00:00&quot;;
      if(fill){ fill.style.width = &quot;100%&quot;; fill.style.background = &quot;#ff4444&quot;; }
      logout();
      return;
    }
    // human text
    const days  = Math.floor(remain / (1000*60*60*24));
    const hours = Math.floor((remain % (1000*60*60*24)) / (1000*60*60));
    const mins  = Math.floor((remain % (1000*60*60)) / (1000*60));
    const secs  = Math.floor((remain % (1000*60)) / 1000);
    if(countdownEl) countdownEl.textContent = `${days} hari ${hours}:${String(mins).padStart(2,&#39;0&#39;)}:${String(secs).padStart(2,&#39;0&#39;)}`;

    // progress: use startTime + durationMs
    if(fill &amp;&amp; startTime &amp;&amp; durationMs &amp;&amp; durationMs &gt; 0){
      const elapsed = now - startTime;
      const pct = Math.max(0, Math.min(100, (elapsed / durationMs) * 100));
      fill.style.width = pct + &quot;%&quot;;
      fill.style.background = pct &lt; 40 ? &quot;#4caf50&quot; : pct &lt; 70 ? &quot;#ffbb33&quot; : &quot;#ff4444&quot;;
    }
  }
  update();
  countdownTimer = setInterval(update, 1000);
}

// SHOW / HIDE PASSWORD
function togglePassword() {
  const p = document.getElementById(&quot;password&quot;);
  const svg = document.querySelector(&quot;.showpassicon&quot;);
  const path = document.getElementById(&quot;eyeIcon&quot;);
  if (!p || !svg || !path) return;
  const hidePath = &quot;M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z&quot;;
  const showPath = &quot;M3.933 13.909A4.357 4.357 0 0 1 3 12c0-1 4-6 9-6s9 4.8 9 6c0 1-3 6-9 6-.314 0-.62-.014-.918-.04M5 19 19 5m-4 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z&quot;;
  if (p.type === &quot;password&quot;) {
    p.type = &quot;text&quot;;
    path.setAttribute(&quot;d&quot;, showPath);
  } else {
    p.type = &quot;password&quot;;
    path.setAttribute(&quot;d&quot;, hidePath);
  }
}

// LOGIN / VERIFY
async function verify(){
  // check cooldown
  if(isInCooldown()){
    const left = getCooldownRemaining();
    const el = document.getElementById(&quot;cooldownTimer&quot;);
    if(el) el.textContent = `Cooldown aktif: ${formatMs(left)}`;
    showNotif(`Terlalu banyak percobaan salah. Anda sedang cooldown selama ${formatMs(left)}.`);
    return;
  }
  const pass = (document.getElementById(&quot;password&quot;).value || &quot;&quot;);
  const hash = await sha256(pass);
  // per-password blocked?
  if(isBlocked(hash)){
    const expire = getCookieExpire(BLOCK_PREFIX + hash);
    showBlockCountdown(expire);
    return;
  }
  // match known hash -&gt; set session duration using sessionDurations map
  const duration = sessionDurations[hash];
  if(!duration){
    // wrong
    const triggered = recordFailedAttempt();
    if(triggered){
      const until = getCooldownUntil();
      startCooldownUI(until);
      showNotif(`Salah password 3&#215;. Anda diblokir sementara selama ${formatMs(COOLDOWN_MS)}.`);
    } else {
      const arr = getFailTimestamps();
      const rem = FAIL_THRESHOLD - arr.length;
      showNotif(`Password salah! Sisa percobaan sebelum cooldown: ${rem}`);
    }
    return;
  }
  // success -&gt; clear fails/cooldown
  clearFailTimestamps();
  clearCooldownData();
  // set cookies (loginhash + loginhash_expire) and also login_start + login_duration for progress
  const { start, expire } = saveSessionWithStart(hash, duration);
  // show messages similar to original
  if(hash === hash1hour) showNotif(&quot;Opppppppaaaaaaaaaiiiii!!!!!! Pawn-sama!&quot;);
  else if(hash === hash1d) showNotif(&quot;Ayo Terus Cari, Bishop-kun!!!&quot;);
  else if(hash === hash3d) showNotif(&quot;Bolehlahhhhh, Knight-san!!!&quot;);
  else if(hash === hash7d) showNotif(&quot;Maaf! Anda Kurang Beruntung, Rook-chan!!!&quot;);
  else if(hash === hash14d) showNotif(&quot;Ugh! Sedikit Lagi, Queen-dono!!!&quot;);
  else if(hash === hash30d) showNotif(&quot;Selamat! Anda Menemukan Jackpot, King-dono!!!&quot;);
  else if(hash === hash60d) showNotif(&quot;Kenapa Lama-Lama, 30d Juga Cukup, kan, Maou-sama?&quot;);
  toggleLogin(true);
  const level = hashToLevel[hash] || &quot;guest&quot;;
  showByLevel(level);
  startCountdown(expire, start, duration);
}

// LOGOUT
function logout(){
  const lastHash = readCookie(LOGIN_COOKIE);
  if(countdownTimer){ clearInterval(countdownTimer); countdownTimer = null; }
  // if this password has configured blockTimes (old mapping), set block
  if(lastHash &amp;&amp; blockTimes[lastHash]){
    const expire = setBlock(lastHash);
    const left = expire - nowMs();
    const d = Math.floor(left/(1000*60*60*24));
    const h = Math.floor((left%(1000*60*60*24))/(1000*60*60));
    const m = Math.floor((left%(1000*60*60))/(1000*60));
    const s = Math.floor((left%(1000*60))/1000);
    showNotif(`Logout berhasil.\nPassword ini diblokir selama ${d} hari ${h}:${String(m).padStart(2,&#39;0&#39;)}:${String(s).padStart(2,&#39;0&#39;)}`);
  } else {
    showNotif(&quot;Anda telah logout&quot;);
  }
  // erase session cookies
  eraseCookie(LOGIN_COOKIE);
  eraseCookie(LOGIN_COOKIE + EXPIRE_SUFFIX);
  eraseCookie(LOGIN_COOKIE + &quot;_start&quot;);
  eraseCookie(LOGIN_COOKIE + &quot;_dur&quot;);
  toggleLogin(false);
  document.body.removeAttribute(&quot;data-user-level&quot;);
}

// toggle UI
function toggleLogin(isLogin){
  const lb = document.getElementById(&quot;loginbox&quot;);
  // loginbox
  if(lb){lb.style.display = isLogin ? &quot;none&quot; : &quot;block&quot;;}
  // semua realcontent
  document.querySelectorAll(&quot;.realcontent&quot;).forEach(rc=&gt;{rc.style.display = isLogin ? &quot;block&quot; : &quot;none&quot;;});
}

// AUTO-LOGIN ON LOAD
window.addEventListener(&quot;DOMContentLoaded&quot;, () =&gt; {
  // start cooldown UI if active
  const cooldownUntil = getCooldownUntil();
  if(nowMs() &lt; cooldownUntil) startCooldownUI(cooldownUntil);
  // if cookie exists but the hash is currently blocked -&gt; clear
  const currentHash = readCookie(LOGIN_COOKIE);
  if(currentHash &amp;&amp; isBlocked(currentHash)){
    const expire = getCookieExpire(BLOCK_PREFIX + currentHash);
    if(expire) showBlockCountdown(expire);
    // remove login cookie if blocked
    eraseCookie(LOGIN_COOKIE);
    eraseCookie(LOGIN_COOKIE + EXPIRE_SUFFIX);
    eraseCookie(LOGIN_COOKIE + &quot;_start&quot;);
    eraseCookie(LOGIN_COOKIE + &quot;_dur&quot;);
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
      setCookie(LOGIN_COOKIE + &quot;_start&quot;, String(start), expire);
      setCookie(LOGIN_COOKIE + &quot;_dur&quot;, String(dur), expire);
    }
    if(expire &amp;&amp; nowMs() &lt; expire){
      toggleLogin(true);
  	  const level = hashToLevel[hash] || &quot;guest&quot;;
      showByLevel(level);   
      startCountdown(expire, start, dur);
    } else {
      // expired
      eraseCookie(LOGIN_COOKIE);
      eraseCookie(LOGIN_COOKIE + EXPIRE_SUFFIX);
      eraseCookie(LOGIN_COOKIE + &quot;_start&quot;);
      eraseCookie(LOGIN_COOKIE + &quot;_dur&quot;);
      toggleLogin(false);
    }
  }
  // ENTER key binding
  const pw = document.getElementById(&quot;password&quot;);
  if(pw) pw.addEventListener(&quot;keydown&quot;, e =&gt; { if(e.key === &quot;Enter&quot;) verify(); });
});

// expose closeNotif to HTML button if present
window.closeNotif = closeNotif;
window.logout = logout;
