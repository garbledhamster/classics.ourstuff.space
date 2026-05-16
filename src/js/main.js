/* main.js — boot(): entry point; dark mode toggle. Loaded last by index.html. */
/* =========================================================
   BOOT
   ========================================================= */
// Wait for Firebase to be ready before initializing auth
let bootCalled = false;
function boot() {
  if (bootCalled) return;
  bootCalled = true;
  initAuth();
  initAuthButtonHandlers();
  loadPlan();
}

// Set callback first, then check if already ready
window.onFirebaseReady = boot;
if (window.firebaseReady) {
  boot();
}

/* =========================================================
   DARK MODE
   ========================================================= */
(()=> {
  const DARK_KEY = "classicsDarkMode";
  const html = document.documentElement;
  const metaColorScheme = document.querySelector('meta[name="color-scheme"]');

  function applyTheme(dark){
    if(dark){
      html.classList.add("dark");
      if(metaColorScheme) metaColorScheme.content = "dark";
    } else {
      html.classList.remove("dark");
      if(metaColorScheme) metaColorScheme.content = "light";
    }
  }

  // Initialize from localStorage (also handles the case where the anti-flash
  // script already added the class; we just keep it in sync)
  try{ applyTheme(localStorage.getItem(DARK_KEY) === "true"); }catch(e){}

  const btn = document.getElementById("darkModeBtn");
  if(btn) btn.addEventListener("click", ()=> {
    const isDark = html.classList.contains("dark");
    applyTheme(!isDark);
    try{ localStorage.setItem(DARK_KEY, String(!isDark)); }catch(e){}
  });
})();

/* =========================================================
   FEATURE LOADERS
   ========================================================= */
(()=> {
  function addStylesheet(href){
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function addScript(src){
    if (document.querySelector(`script[src="${src}"]`)) return;
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    document.body.appendChild(script);
  }

  addStylesheet("src/css/glossary.css");
  addStylesheet("src/css/glossary-overrides.css");
  addStylesheet("src/css/get-started.css");
  addScript("src/js/views/glossary.js");
  addScript("src/js/views/get-started.js");
})();
