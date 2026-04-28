/* firebase/auth.js — Firebase authentication: initAuth, login, signup, logout, auth button UI */
/* =========================================================
   FIREBASE AUTHENTICATION
   ========================================================= */
let currentUser = null;
const RECAPTCHA_SITE_KEY = "6LdVslAsAAAAAAwyU1wyjAxIG_K187E82ID2C7Re";

// Initialize auth state observer
function initAuth() {
  if (!window.firebaseAuth || !window.firebaseOnAuthStateChanged) {
    console.error("Firebase not loaded");
    // Show auth button even if Firebase fails
    $("#authBtn").style.display = "inline-flex";
    return;
  }

  window.firebaseOnAuthStateChanged(window.firebaseAuth, async (user) => {
    currentUser = user; // Keep for backward compatibility with existing code
    state.currentUser = user; // Store in state for sync functions
    updateAuthUI();
    
    // Perform sync when user logs in
    if (user) {
      await performFullSync(user.uid);
      renderAll();
      updateSyncStatus();
    } else {
      // Clear sync state when user logs out
      state.sync.enabled = false;
      state.sync.lastSync = null;
      updateSyncStatus();
    }
  });
}

// SVG icon paths as constants for safety
const LOGIN_ICON_PATH = 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4';
const LOGIN_ICON_POLYLINE = '10 17 15 12 10 7';
const LOGIN_ICON_LINE = {x1: '15', y1: '12', x2: '3', y2: '12'};
const LOGOUT_ICON_PATH = 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4';
const LOGOUT_ICON_POLYLINE = '16 17 21 12 16 7';
const LOGOUT_ICON_LINE = {x1: '21', y1: '12', x2: '9', y2: '12'};

function setSVGIcon(iconElement, isLogout) {
  // Clear existing content
  while (iconElement.firstChild) {
    iconElement.removeChild(iconElement.firstChild);
  }
  
  // Create SVG elements safely using DOM methods
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  
  if (isLogout) {
    path.setAttribute('d', LOGOUT_ICON_PATH);
    polyline.setAttribute('points', LOGOUT_ICON_POLYLINE);
    line.setAttribute('x1', LOGOUT_ICON_LINE.x1);
    line.setAttribute('y1', LOGOUT_ICON_LINE.y1);
    line.setAttribute('x2', LOGOUT_ICON_LINE.x2);
    line.setAttribute('y2', LOGOUT_ICON_LINE.y2);
  } else {
    path.setAttribute('d', LOGIN_ICON_PATH);
    polyline.setAttribute('points', LOGIN_ICON_POLYLINE);
    line.setAttribute('x1', LOGIN_ICON_LINE.x1);
    line.setAttribute('y1', LOGIN_ICON_LINE.y1);
    line.setAttribute('x2', LOGIN_ICON_LINE.x2);
    line.setAttribute('y2', LOGIN_ICON_LINE.y2);
  }
  
  iconElement.appendChild(path);
  iconElement.appendChild(polyline);
  iconElement.appendChild(line);
}

function updateAuthUI() {
  const authBtn = $("#authBtn");
  const authBtnText = $("#authBtnText");
  const authBtnIcon = $("#authBtnIcon");
  const manualSyncBtn = $("#manualSyncBtn");

  if (currentUser) {
    // Signed in: show email, on hover/focus show "Sign Out"
    const userEmail = currentUser.email; // Capture email in local scope
    authBtn.style.display = "inline-flex";
    authBtn.classList.add("signed-in");
    authBtnText.textContent = userEmail;
    authBtn.setAttribute("aria-label", `Signed in as ${userEmail}. Click to sign out.`);
    authBtn.dataset.userEmail = userEmail; // Store email in data attribute for event handlers
    if (manualSyncBtn) manualSyncBtn.style.display = "inline-flex";
    
    // Update SVG to logout icon using safe DOM methods
    setSVGIcon(authBtnIcon, true);
  } else {
    // Not signed in: show "Sign In"
    authBtn.style.display = "inline-flex";
    authBtn.classList.remove("signed-in");
    authBtnText.textContent = "Sign In";
    authBtn.setAttribute("aria-label", "Sign in");
    delete authBtn.dataset.userEmail; // Remove email from data attribute
    if (manualSyncBtn) manualSyncBtn.style.display = "none";
    
    // Update SVG to login icon using safe DOM methods
    setSVGIcon(authBtnIcon, false);
  }
}

// Set up event handlers once during initialization
function initAuthButtonHandlers() {
  const authBtn = $("#authBtn");
  const authBtnText = $("#authBtnText");
  
  const showSignOut = () => {
    if (authBtn.classList.contains("signed-in")) {
      authBtnText.textContent = "Sign Out";
    }
  };
  
  const showEmail = () => {
    if (authBtn.classList.contains("signed-in") && authBtn.dataset.userEmail) {
      authBtnText.textContent = authBtn.dataset.userEmail;
    }
  };
  
  authBtn.addEventListener("mouseenter", showSignOut);
  authBtn.addEventListener("mouseleave", showEmail);
  authBtn.addEventListener("focus", showSignOut);
  authBtn.addEventListener("blur", showEmail);
}

function showLoginModal() {
  const modal = $("#loginModal");
  const backdrop = $("#modalBackdrop");
  modal.classList.add("open");
  backdrop.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  $("#loginEmail").focus();
}

function hideLoginModal() {
  const modal = $("#loginModal");
  const backdrop = $("#modalBackdrop");
  modal.classList.remove("open");
  backdrop.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  clearLoginError();
  $("#loginEmail").value = "";
  $("#loginPassword").value = "";
}

function showSignupModal() {
  hideLoginModal();
  const modal = $("#signupModal");
  const backdrop = $("#modalBackdrop");
  modal.classList.add("open");
  backdrop.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  $("#signupEmail").focus();
}

function hideSignupModal() {
  const modal = $("#signupModal");
  const backdrop = $("#modalBackdrop");
  modal.classList.remove("open");
  backdrop.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  clearSignupError();
  $("#signupEmail").value = "";
  $("#signupPassword").value = "";
  $("#signupPasswordConfirm").value = "";
}

function setLoginError(msg) {
  const box = $("#loginError");
  box.style.display = "block";
  box.textContent = msg;
}

function clearLoginError() {
  const box = $("#loginError");
  box.style.display = "none";
  box.textContent = "";
}

function setSignupError(msg) {
  const box = $("#signupError");
  box.style.display = "block";
  box.textContent = msg;
}

function clearSignupError() {
  const box = $("#signupError");
  box.style.display = "none";
  box.textContent = "";
}

async function executeRecaptcha(action) {
  return new Promise((resolve, reject) => {
    if (!window.grecaptcha) {
      reject(new Error("reCAPTCHA not loaded"));
      return;
    }
    
    window.grecaptcha.ready(() => {
      window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action })
        .then(resolve)
        .catch(reject);
    });
  });
}

async function handleLogin() {
  const email = $("#loginEmail").value.trim();
  const password = $("#loginPassword").value;

  if (!email || !password) {
    setLoginError("Please enter email and password");
    return;
  }

  try {
    clearLoginError();
    const btn = $("#loginSubmitBtn");
    btn.disabled = true;
    btn.textContent = "Signing in...";

    // Execute reCAPTCHA
    const recaptchaToken = await executeRecaptcha("login");
    console.log("reCAPTCHA token obtained:", recaptchaToken ? "✓" : "✗");

    // Sign in with Firebase
    await window.firebaseSignIn(window.firebaseAuth, email, password);
    
    hideLoginModal();
  } catch (error) {
    console.error("Login error:", error);
    let errorMsg = "Failed to sign in. Please check your credentials.";
    
    if (error.code === "auth/user-not-found") {
      errorMsg = "No account found with this email.";
    } else if (error.code === "auth/wrong-password") {
      errorMsg = "Incorrect password.";
    } else if (error.code === "auth/invalid-email") {
      errorMsg = "Invalid email address.";
    } else if (error.code === "auth/too-many-requests") {
      errorMsg = "Too many attempts. Please try again later.";
    }
    
    setLoginError(errorMsg);
  } finally {
    const btn = $("#loginSubmitBtn");
    btn.disabled = false;
    btn.textContent = "Sign In";
  }
}

async function handleSignup() {
  const email = $("#signupEmail").value.trim();
  const password = $("#signupPassword").value;
  const passwordConfirm = $("#signupPasswordConfirm").value;

  if (!email || !password || !passwordConfirm) {
    setSignupError("Please fill in all fields");
    return;
  }

  if (password.length < 6) {
    setSignupError("Password must be at least 6 characters");
    return;
  }

  if (password !== passwordConfirm) {
    setSignupError("Passwords do not match");
    return;
  }

  try {
    clearSignupError();
    const btn = $("#signupSubmitBtn");
    btn.disabled = true;
    btn.textContent = "Creating account...";

    // Execute reCAPTCHA
    const recaptchaToken = await executeRecaptcha("signup");
    console.log("reCAPTCHA token obtained:", recaptchaToken ? "✓" : "✗");

    // Create user with Firebase
    await window.firebaseSignUp(window.firebaseAuth, email, password);
    
    hideSignupModal();
    showAlert("Account created successfully! You are now signed in.");
  } catch (error) {
    console.error("Signup error:", error);
    let errorMsg = "Failed to create account. Please try again.";
    
    if (error.code === "auth/email-already-in-use") {
      errorMsg = "An account with this email already exists.";
    } else if (error.code === "auth/invalid-email") {
      errorMsg = "Invalid email address.";
    } else if (error.code === "auth/weak-password") {
      errorMsg = "Password is too weak. Use at least 6 characters.";
    }
    
    setSignupError(errorMsg);
  } finally {
    const btn = $("#signupSubmitBtn");
    btn.disabled = false;
    btn.textContent = "Create Account";
  }
}

async function handleLogout() {
  try {
    await window.firebaseSignOut(window.firebaseAuth);
    showAlert("Signed out successfully");
  } catch (error) {
    console.error("Logout error:", error);
    showAlert("Failed to sign out. Please try again.");
  }
}

