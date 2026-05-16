/* firebase/auth.js — Firebase authentication: initAuth, login, signup, logout, auth button UI */
/* =========================================================
   FIREBASE AUTHENTICATION
   ========================================================= */
let currentUser = null;
const RECAPTCHA_SITE_KEY = "6LdVslAsAAAAAAwyU1wyjAxIG_K187E82ID2C7Re";
let pendingSignupDetails = null;
let pendingGoogleCredential = null;
let pendingGoogleEmail = "";

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
    if (user) {
      state.userProfile = mergeUserProfiles(null, state.userProfile, user);
      saveUserProfile(state.userProfile);
    }
    updateAuthUI();
    
    // Perform sync when user logs in
    if (user) {
      await performFullSync(user.uid);
      updateAuthUI();
      renderAll();
      updateSyncStatus();
    } else {
      // Clear sync state when user logs out
      state.sync.enabled = false;
      state.sync.lastSync = null;
      updateSyncStatus();
      updatePaymentSummaryStatus();
    }
  });
}

// SVG icon paths as constants for safety
const LOGIN_ICON_PATH = 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4';
const LOGIN_ICON_POLYLINE = '10 17 15 12 10 7';
const LOGIN_ICON_LINE = {x1: '15', y1: '12', x2: '3', y2: '12'};
const PROFILE_ICON_PATH = 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2';
const PROFILE_ICON_CIRCLE = {cx: '12', cy: '7', r: '4'};

function setSVGIcon(iconElement, isProfile) {
  // Clear existing content
  while (iconElement.firstChild) {
    iconElement.removeChild(iconElement.firstChild);
  }
  
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  
  if (isProfile) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    path.setAttribute('d', PROFILE_ICON_PATH);
    circle.setAttribute('cx', PROFILE_ICON_CIRCLE.cx);
    circle.setAttribute('cy', PROFILE_ICON_CIRCLE.cy);
    circle.setAttribute('r', PROFILE_ICON_CIRCLE.r);
    iconElement.appendChild(path);
    iconElement.appendChild(circle);
    return;
  }
  
  const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  path.setAttribute('d', LOGIN_ICON_PATH);
  polyline.setAttribute('points', LOGIN_ICON_POLYLINE);
  line.setAttribute('x1', LOGIN_ICON_LINE.x1);
  line.setAttribute('y1', LOGIN_ICON_LINE.y1);
  line.setAttribute('x2', LOGIN_ICON_LINE.x2);
  line.setAttribute('y2', LOGIN_ICON_LINE.y2);
  iconElement.appendChild(path);
  iconElement.appendChild(polyline);
  iconElement.appendChild(line);
}

function getProfileDisplayName(user = currentUser) {
  const profile = normalizeUserProfile(state.userProfile, user);
  return profile.name || profile.email || user?.email || "Profile";
}

function updateAuthUI() {
  const authBtn = $("#authBtn");
  const authBtnText = $("#authBtnText");
  const authBtnIcon = $("#authBtnIcon");
  const manualSyncBtn = $("#manualSyncBtn");

  if (currentUser) {
    const profile = normalizeUserProfile(state.userProfile, currentUser);
    const displayName = getProfileDisplayName(currentUser);
    authBtn.style.display = "inline-flex";
    authBtn.classList.add("signed-in");
    authBtnText.textContent = displayName;
    authBtn.setAttribute("aria-label", `Open profile for ${displayName}`);
    authBtn.dataset.userEmail = profile.email;
    if (manualSyncBtn) manualSyncBtn.style.display = "inline-flex";
    
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
  authBtn.addEventListener("mouseenter", updateAuthUI);
  authBtn.addEventListener("mouseleave", updateAuthUI);
  authBtn.addEventListener("focus", updateAuthUI);
  authBtn.addEventListener("blur", updateAuthUI);
}

function showLoginModal() {
  const modal = $("#loginModal");
  const backdrop = $("#modalBackdrop");
  modal.classList.add("open");
  backdrop.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  $("#loginEmail").focus();
}

function hideLoginModal({ clear = true } = {}) {
  const modal = $("#loginModal");
  const backdrop = $("#modalBackdrop");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  clearLoginError();
  if (clear) {
    $("#loginEmail").value = "";
    $("#loginPassword").value = "";
  }
  if (!document.querySelector(".modal.open")) {
    backdrop.classList.remove("show");
  }
}

function showEulaModal() {
  const modal = $("#eulaModal");
  const backdrop = $("#modalBackdrop");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  backdrop.classList.add("show");
  // Reset checkbox and disable accept button each time modal opens
  const checkbox = $("#eulaAcceptCheck");
  if (checkbox) checkbox.checked = false;
  const acceptBtn = $("#eulaAcceptBtn");
  if (acceptBtn) acceptBtn.disabled = true;
  // Focus the scrollable region for keyboard/screen-reader users
  setTimeout(() => { const t = $("#eulaText"); if (t) t.focus(); }, 100);
}

function hideEulaModal() {
  const modal = $("#eulaModal");
  const backdrop = $("#modalBackdrop");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  // Only remove backdrop if no other modal is open
  if (!document.querySelector(".modal.open")) {
    backdrop.classList.remove("show");
  }
}

function showSignupModal() {
  hideLoginModal();
  const modal = $("#signupModal");
  const backdrop = $("#modalBackdrop");
  modal.classList.add("open");
  backdrop.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  $("#signupName").focus();
}

function hideSignupModal({ clear = true } = {}) {
  const modal = $("#signupModal");
  const backdrop = $("#modalBackdrop");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  clearSignupError();
  if (clear) {
    pendingSignupDetails = null;
    $("#signupName").value = "";
    $("#signupEmail").value = "";
    $("#signupPassword").value = "";
    $("#signupPasswordConfirm").value = "";
  }
  if (!document.querySelector(".modal.open")) {
    backdrop.classList.remove("show");
  }
}

function showProfileModal() {
  if (!currentUser) return;
  const modal = $("#profileModal");
  const backdrop = $("#modalBackdrop");
  const profile = normalizeUserProfile(state.userProfile, currentUser);
  $("#profileName").value = profile.name;
  $("#profileEmail").value = profile.email;
  clearProfileError();
  updateProfileProviderUI();
  modal.classList.add("open");
  backdrop.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  setTimeout(() => $("#profileName").focus(), 100);
}

function hideProfileModal() {
  const modal = $("#profileModal");
  const backdrop = $("#modalBackdrop");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  clearProfileError();
  if (!document.querySelector(".modal.open")) {
    backdrop.classList.remove("show");
  }
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

function setProfileError(msg) {
  const box = $("#profileError");
  box.style.display = msg ? "block" : "none";
  box.textContent = msg || "";
}

function clearProfileError() {
  setProfileError("");
}

function hasAuthProvider(providerId) {
  return Boolean(currentUser?.providerData?.some(provider => provider.providerId === providerId));
}

function updateProfileProviderUI() {
  const googleBtn = $("#profileGoogleBtn");
  const googleStatus = $("#profileGoogleStatus");
  if (!googleBtn || !googleStatus) return;

  const connected = hasAuthProvider("google.com");
  googleBtn.disabled = connected;
  googleBtn.textContent = connected ? "Google Connected" : "Connect";
  if (!connected) {
    const mark = document.createElement("span");
    mark.className = "googleMark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = "G";
    googleBtn.prepend(mark);
  }
  googleStatus.textContent = connected ? "Connected to this email" : "Not connected yet";
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

function createGoogleProvider() {
  const Provider = window.firebaseGoogleProvider;
  const provider = new Provider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

function setGoogleAuthError(message) {
  if ($("#signupModal")?.classList.contains("open")) {
    setSignupError(message);
    return;
  }
  if ($("#profileModal")?.classList.contains("open")) {
    setProfileError(message);
    return;
  }
  setLoginError(message);
}

async function completePendingGoogleLink(user) {
  if (!pendingGoogleCredential || !user) return;
  const userEmail = String(user.email || "").toLowerCase();
  const linkEmail = String(pendingGoogleEmail || "").toLowerCase();
  if (linkEmail && userEmail !== linkEmail) return;

  try {
    await window.firebaseLinkWithCredential(user, pendingGoogleCredential);
    pendingGoogleCredential = null;
    pendingGoogleEmail = "";
    await user.reload?.();
    updateProfileProviderUI();
    showAlert("Google sign-in connected to this account.");
  } catch (error) {
    pendingGoogleCredential = null;
    pendingGoogleEmail = "";
    if (error.code === "auth/provider-already-linked" || error.code === "auth/credential-already-in-use") return;
    console.error("Google link error:", error);
    showAlert("Signed in, but Google could not be connected to this account yet.");
  }
}

async function handleGoogleSignIn() {
  const buttons = ["#loginGoogleBtn", "#signupGoogleBtn"].map(sel => $(sel)).filter(Boolean);
  const previousLabels = new Map(buttons.map(btn => [btn, btn.innerHTML]));
  buttons.forEach(btn => {
    btn.disabled = true;
    btn.textContent = "Opening Google...";
  });

  try {
    clearLoginError();
    clearSignupError();
    const credential = await window.firebaseSignInWithPopup(window.firebaseAuth, createGoogleProvider());
    const user = credential.user;
    state.userProfile = mergeUserProfiles(
      { name: user.displayName || "", email: user.email || "", updatedAt: nowIso() },
      state.userProfile,
      user
    );
    saveUserProfile(state.userProfile);
    if (user.uid) await syncUserProfileToFirestore(user.uid);
    hideLoginModal();
    hideSignupModal();
  } catch (error) {
    console.error("Google sign-in error:", error);
    if (error.code === "auth/account-exists-with-different-credential") {
      pendingGoogleCredential = window.firebaseGoogleProvider.credentialFromError(error);
      pendingGoogleEmail = error.customData?.email || "";
      hideSignupModal();
      showLoginModal();
      if (pendingGoogleEmail) $("#loginEmail").value = pendingGoogleEmail;
      setLoginError("That email already has a password account. Sign in with your password once and Google will be connected to the same account.");
      return;
    }
    setGoogleAuthError(error.message || "Google sign-in failed.");
  } finally {
    buttons.forEach(btn => {
      btn.disabled = false;
      btn.innerHTML = previousLabels.get(btn);
    });
  }
}

async function handleProfileGoogleConnect() {
  if (!currentUser || !window.firebaseLinkWithPopup) return;
  const btn = $("#profileGoogleBtn");
  const previousHtml = btn.innerHTML;
  try {
    clearProfileError();
    btn.disabled = true;
    btn.textContent = "Opening Google...";
    await window.firebaseLinkWithPopup(currentUser, createGoogleProvider());
    await currentUser.reload?.();
    updateProfileProviderUI();
    clearProfileError();
  } catch (error) {
    console.error("Google profile link error:", error);
    if (error.code === "auth/provider-already-linked" || error.code === "auth/credential-already-in-use") {
      updateProfileProviderUI();
      clearProfileError();
      return;
    }
    setProfileError(error.message || "Could not connect Google sign-in.");
  } finally {
    btn.disabled = false;
    btn.innerHTML = previousHtml;
    updateProfileProviderUI();
  }
}

async function handleProfileSave() {
  if (!currentUser) return;
  const name = $("#profileName").value.trim().replace(/\s+/g, " ");
  if (!name) {
    setProfileError("Please enter your name.");
    return;
  }

  const btn = $("#profileSaveBtn");
  try {
    clearProfileError();
    btn.disabled = true;
    btn.textContent = "Saving...";
    if (window.firebaseUpdateProfile && currentUser.displayName !== name) {
      await window.firebaseUpdateProfile(currentUser, { displayName: name });
    }
    state.userProfile = normalizeUserProfile({
      name,
      email: currentUser.email || $("#profileEmail").value.trim(),
      updatedAt: nowIso()
    }, currentUser);
    saveUserProfile(state.userProfile);
    await syncUserProfileToFirestore(currentUser.uid);
    updateAuthUI();
    hideProfileModal();
    showAlert("Profile saved.");
  } catch (error) {
    console.error("Profile save error:", error);
    setProfileError(error.message || "Could not save profile.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Save Profile";
  }
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
    const userCredential = await window.firebaseSignIn(window.firebaseAuth, email, password);
    await completePendingGoogleLink(userCredential.user);
    
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
  const name = $("#signupName").value.trim().replace(/\s+/g, " ");
  const email = $("#signupEmail").value.trim();
  const password = $("#signupPassword").value;
  const passwordConfirm = $("#signupPasswordConfirm").value;

  if (!name || !email || !password || !passwordConfirm) {
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

  // Validation passed — show EULA before creating the account
  pendingSignupDetails = { name, email, password };
  hideSignupModal({ clear: false });
  showEulaModal();
}

async function handleEulaAccept() {
  const details = pendingSignupDetails || {
    name: $("#signupName").value.trim().replace(/\s+/g, " "),
    email: $("#signupEmail").value.trim(),
    password: $("#signupPassword").value
  };
  const { name, email, password } = details;

  try {
    const btn = $("#eulaAcceptBtn");
    btn.disabled = true;
    btn.textContent = "Creating account...";

    // Execute reCAPTCHA
    const recaptchaToken = await executeRecaptcha("signup");
    console.log("reCAPTCHA token obtained:", recaptchaToken ? "✓" : "✗");

    // Create user with Firebase
    const userCredential = await window.firebaseSignUp(window.firebaseAuth, email, password);
    if (window.firebaseUpdateProfile) {
      await window.firebaseUpdateProfile(userCredential.user, { displayName: name });
    }
    state.userProfile = normalizeUserProfile({
      name,
      email,
      updatedAt: nowIso()
    }, userCredential.user);
    saveUserProfile(state.userProfile);
    await syncUserProfileToFirestore(userCredential.user.uid);

    hideEulaModal();
    // Clear signup form fields
    $("#signupName").value = "";
    $("#signupEmail").value = "";
    $("#signupPassword").value = "";
    $("#signupPasswordConfirm").value = "";
    pendingSignupDetails = null;
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

    // Return to signup modal to show the error
    hideEulaModal();
    showSignupModal();
    $("#signupName").value = name || "";
    $("#signupEmail").value = email || "";
    $("#signupPassword").value = password || "";
    $("#signupPasswordConfirm").value = password || "";
    setSignupError(errorMsg);
  } finally {
    const btn = $("#eulaAcceptBtn");
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Accept & Create Account";
    }
  }
}

async function handleLogout() {
  try {
    hideProfileModal();
    await window.firebaseSignOut(window.firebaseAuth);
    showAlert("Signed out successfully");
  } catch (error) {
    console.error("Logout error:", error);
    showAlert("Failed to sign out. Please try again.");
  }
}

