/* components/timer.js — Pomodoro study timer: presets, custom input, Web Audio alarms, persist settings */
/* =========================================================
   TIMER
   ========================================================= */
(()=> {
  let _timerInterval = null;
  let _timerRemaining = 25 * 60; // seconds
  let _timerRunning = false;
  let _timerOriginal = 25 * 60;

  const display = document.getElementById("timerDisplay");
  const startBtn = document.getElementById("timerStartBtn");
  const resetBtn = document.getElementById("timerResetBtn");
  const setCustomBtn = document.getElementById("timerSetCustomBtn");
  const alarmSelect = document.getElementById("timerAlarmSelect");
  const testSoundBtn = document.getElementById("timerTestSoundBtn");
  const volumeSlider = document.getElementById("timerVolumeSlider");
  const volumeLabel = document.getElementById("timerVolumeLabel");

  // ── Persist alarm/volume settings ─────────────────────────────
  function applyTimerSettings(settings) {
    if (!settings) return;
    if (settings.alarm && alarmSelect) alarmSelect.value = settings.alarm;
    if (typeof settings.volume === "number" && volumeSlider) {
      volumeSlider.value = settings.volume;
      if (volumeLabel) volumeLabel.textContent = `${settings.volume}%`;
    }
  }

  function saveTimerSettings() {
    if (!alarmSelect || !volumeSlider) return;
    const settings = { alarm: alarmSelect.value, volume: parseInt(volumeSlider.value, 10) };
    localStorage.setItem(LS_TIMER_SETTINGS, JSON.stringify(settings));
    triggerAutoSync();
  }

  // Expose so Firestore sync can push loaded remote settings into the UI
  window.applyTimerSettings = applyTimerSettings;

  // Load saved settings on startup
  const _savedTimerSettings = safeJsonParse(localStorage.getItem(LS_TIMER_SETTINGS) || "null", null);
  applyTimerSettings(_savedTimerSettings);

  // ── Audio helpers ──────────────────────────────────────────────
  function getAudioCtx(){
    if (!window._timerAudioCtx){
      window._timerAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (autoplay policy)
    if (window._timerAudioCtx.state === "suspended") window._timerAudioCtx.resume();
    return window._timerAudioCtx;
  }

  function getVolume(){
    return Math.max(0, Math.min(1, (parseInt(volumeSlider.value, 10) || 0) / 100));
  }

  function playBell(ctx, vol, when){
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, when);
    osc.frequency.exponentialRampToValueAtTime(440, when + 1.2);
    gain.gain.setValueAtTime(vol, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 1.8);
    osc.start(when);
    osc.stop(when + 1.8);
  }

  function playChime(ctx, vol, when){
    [[523, 0], [659, 0.25], [784, 0.5], [1047, 0.75]].forEach(([freq, offset]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.value = freq;
      const t = when + offset;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.start(t);
      osc.stop(t + 0.8);
    });
  }

  function playBeep(ctx, vol, when){
    [0, 0.35, 0.7].forEach(offset => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.value = 1000;
      const t = when + offset;
      gain.gain.setValueAtTime(vol * 0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  function playDing(ctx, vol, when){
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(1318, when);
    gain.gain.setValueAtTime(vol, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 1.4);
    osc.start(when);
    osc.stop(when + 1.4);
  }

  function playAlarm(){
    try {
      const ctx = getAudioCtx();
      const vol = getVolume();
      const when = ctx.currentTime + 0.05;
      const type = alarmSelect.value;
      if (type === "bell")  playBell(ctx, vol, when);
      else if (type === "chime") playChime(ctx, vol, when);
      else if (type === "beep")  playBeep(ctx, vol, when);
      else if (type === "ding")  playDing(ctx, vol, when);
    } catch(e) { /* audio not supported */ }
  }
  // ── End audio helpers ──────────────────────────────────────────

  function pad(n){ return String(n).padStart(2, "0"); }

  function updateDisplay(){
    const m = Math.floor(_timerRemaining / 60);
    const s = _timerRemaining % 60;
    display.textContent = `${pad(m)}:${pad(s)}`;
    if (_timerRunning){
      display.classList.add("running");
      startBtn.textContent = "Pause";
    } else {
      display.classList.remove("running");
      startBtn.textContent = _timerRemaining < _timerOriginal && _timerRemaining > 0 ? "Resume" : "Start";
    }
  }

  function tick(){
    if (_timerRemaining <= 0){
      clearInterval(_timerInterval);
      _timerInterval = null;
      _timerRunning = false;
      _timerRemaining = 0;
      updateDisplay();
      playAlarm();
      // Notify when done (request permission once on first tick-end if not granted)
      if (typeof Notification !== "undefined"){
        if (Notification.permission === "granted"){
          try { new Notification("Timer done! ⏰"); } catch(e){}
        } else if (Notification.permission !== "denied"){
          Notification.requestPermission().then(p => {
            if (p === "granted") try { new Notification("Timer done! ⏰"); } catch(e){}
          });
        }
      }
      startBtn.textContent = "Start";
      display.classList.remove("running");
      return;
    }
    _timerRemaining--;
    updateDisplay();
  }

  function setTimer(seconds){
    clearInterval(_timerInterval);
    _timerInterval = null;
    _timerRunning = false;
    _timerRemaining = seconds;
    _timerOriginal = seconds;
    updateDisplay();
  }

  function openTimerModal(){
    const modal = $("#timerModal");
    const backdrop = $("#modalBackdrop");
    modal.classList.add("open");
    backdrop.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeTimerModal(){
    const modal = $("#timerModal");
    const backdrop = $("#modalBackdrop");
    modal.classList.remove("open");
    backdrop.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  }

  // Expose so backdrop/escape handler can close it
  window._closeTimerModal = closeTimerModal;

  document.getElementById("timerBtn").addEventListener("click", openTimerModal);
  document.getElementById("closeTimerModalBtn").addEventListener("click", closeTimerModal);

  startBtn.addEventListener("click", ()=> {
    if (_timerRemaining <= 0) return;
    if (_timerRunning){
      clearInterval(_timerInterval);
      _timerInterval = null;
      _timerRunning = false;
    } else {
      _timerRunning = true;
      _timerInterval = setInterval(tick, 1000);
    }
    updateDisplay();
  });

  resetBtn.addEventListener("click", ()=> {
    setTimer(_timerOriginal);
  });

  testSoundBtn.addEventListener("click", ()=> {
    playAlarm();
  });

  volumeSlider.addEventListener("input", ()=> {
    volumeLabel.textContent = `${volumeSlider.value}%`;
  });

  if (volumeSlider) volumeSlider.addEventListener("change", saveTimerSettings);
  if (alarmSelect) alarmSelect.addEventListener("change", saveTimerSettings);

  // Preset buttons
  document.getElementById("timerModal").addEventListener("click", (e)=> {
    const btn = e.target.closest("[data-timerpreset]");
    if (!btn) return;
    setTimer(Number(btn.dataset.timerpreset));
  });

  // Custom set
  setCustomBtn.addEventListener("click", ()=> {
    const mins = Math.max(0, Math.min(99, parseInt(document.getElementById("timerCustomMins").value, 10) || 0));
    const secs = Math.max(0, Math.min(59, parseInt(document.getElementById("timerCustomSecs").value, 10) || 0));
    const total = mins * 60 + secs;
    if (total <= 0) return;
    setTimer(total);
  });

  updateDisplay();
})();
