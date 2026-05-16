/* payments.js - donation modal and Stripe checkout handoff */
(() => {
  const WORKER_BASE_URL = "https://stripe-worker-api.jrice.workers.dev";
  const SITE_ID = "classics";
  const MIN_CUSTOM_AMOUNT = 1;
  const MAX_CUSTOM_AMOUNT = 500;

  const modal = document.getElementById("donationModal");
  const openBtn = document.getElementById("donateBtn");
  const closeBtn = document.getElementById("closeDonationModalBtn");
  const cancelBtn = document.getElementById("donationCancelBtn");
  const checkoutBtn = document.getElementById("donationCheckoutBtn");
  const customInput = document.getElementById("donationCustomAmount");
  const errorBox = document.getElementById("donationError");
  const amountButtons = Array.from(document.querySelectorAll(".donationAmountBtn"));

  if (!modal || !openBtn || !checkoutBtn) return;

  let selectedAmount = 10;

  function setDonationError(message) {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.style.display = message ? "block" : "none";
  }

  function setSelectedAmount(amount) {
    selectedAmount = amount;
    amountButtons.forEach(btn => {
      btn.classList.toggle("selected", Number(btn.dataset.donationAmount) === amount);
    });
  }

  function openDonationModal() {
    const backdrop = document.getElementById("modalBackdrop");
    setDonationError("");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    if (backdrop) backdrop.classList.add("show");
    setTimeout(() => checkoutBtn.focus(), 100);
  }

  function closeDonationModal() {
    const backdrop = document.getElementById("modalBackdrop");
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    if (!document.querySelector(".modal.open") && backdrop) backdrop.classList.remove("show");
    openBtn.focus();
  }

  function getRequestedAmount() {
    const customAmount = Number(customInput?.value || 0);
    if (customAmount > 0) return customAmount;
    return selectedAmount;
  }

  function validateAmount(amount) {
    if (!Number.isFinite(amount)) return "Enter a valid donation amount.";
    if (amount < MIN_CUSTOM_AMOUNT) return `Minimum donation is $${MIN_CUSTOM_AMOUNT}.`;
    if (amount > MAX_CUSTOM_AMOUNT) return `Maximum donation is $${MAX_CUSTOM_AMOUNT}.`;
    if (Math.round(amount * 100) !== amount * 100) return "Use dollars and cents only.";
    return "";
  }

  async function getFirebaseToken() {
    const user = (typeof state !== "undefined" && state.currentUser)
      || (typeof currentUser !== "undefined" && currentUser)
      || null;
    if (!user || typeof user.getIdToken !== "function") return "";
    try {
      return await user.getIdToken();
    } catch (error) {
      console.warn("Unable to attach Firebase token to donation checkout.", error);
      return "";
    }
  }

  function getDonationProfile() {
    const user = (typeof state !== "undefined" && state.currentUser)
      || (typeof currentUser !== "undefined" && currentUser)
      || null;
    const storedProfile = typeof state !== "undefined" ? (state.userProfile || {}) : {};
    const profile = typeof normalizeUserProfile === "function"
      ? normalizeUserProfile(storedProfile, user)
      : storedProfile;
    return {
      name: String(profile?.name || user?.displayName || "").trim(),
      email: String(user?.email || profile?.email || "").trim()
    };
  }

  async function startDonationCheckout() {
    const amount = getRequestedAmount();
    const validationError = validateAmount(amount);
    if (validationError) {
      setDonationError(validationError);
      return;
    }

    const previousText = checkoutBtn.textContent;
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = "Opening Stripe...";
    setDonationError("");

    try {
      const token = await getFirebaseToken();
      const profile = getDonationProfile();
      const headers = { "content-type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${WORKER_BASE_URL}/api/donations/checkout`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          site: SITE_ID,
          amount,
          customerName: profile.name,
          customerEmail: profile.email
        })
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.error?.message || "Donation checkout failed");
      }
      if (!result?.url) {
        throw new Error("Donation checkout did not return a Stripe URL.");
      }

      window.location.assign(result.url);
    } catch (error) {
      setDonationError(error.message || "Donation checkout failed.");
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = previousText;
    }
  }

  amountButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const amount = Number(btn.dataset.donationAmount);
      if (!Number.isFinite(amount)) return;
      if (customInput) customInput.value = "";
      setSelectedAmount(amount);
      setDonationError("");
    });
  });

  if (customInput) {
    customInput.addEventListener("input", () => {
      amountButtons.forEach(btn => btn.classList.remove("selected"));
      setDonationError("");
    });
  }

  openBtn.addEventListener("click", openDonationModal);
  closeBtn?.addEventListener("click", closeDonationModal);
  cancelBtn?.addEventListener("click", closeDonationModal);
  checkoutBtn.addEventListener("click", startDonationCheckout);

  window._closeDonationModal = closeDonationModal;
})();
