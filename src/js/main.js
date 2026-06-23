import { initAuth, initAuthButtonHandlers } from "./classics/reader-account.js";
import { loadPlan } from "./classics/reading-world.js";

let bootHasRun = false;

function bootClassicsApp() {
  if (bootHasRun) return;
  bootHasRun = true;
  initAuth();
  initAuthButtonHandlers();
  loadPlan();
}

window.onFirebaseReady = bootClassicsApp;
if (window.firebaseReady) {
  bootClassicsApp();
}

(() => {
  const darkModeKey = "classicsDarkMode";
  const html = document.documentElement;
  const metaColorScheme = document.querySelector('meta[name="color-scheme"]');

  function applyTheme(dark) {
    if (dark) {
      html.classList.add("dark");
      if (metaColorScheme) metaColorScheme.content = "dark";
    } else {
      html.classList.remove("dark");
      if (metaColorScheme) metaColorScheme.content = "light";
    }
  }

  try {
    applyTheme(localStorage.getItem(darkModeKey) === "true");
  } catch (error) {
    void error;
  }

  const darkModeButton = document.getElementById("darkModeBtn");
  if (darkModeButton) {
    darkModeButton.addEventListener("click", () => {
      const willUseDarkMode = !html.classList.contains("dark");
      applyTheme(willUseDarkMode);
      try {
        localStorage.setItem(darkModeKey, String(willUseDarkMode));
      } catch (error) {
        void error;
      }
    });
  }
})();
