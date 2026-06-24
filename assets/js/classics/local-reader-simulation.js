/* Local-first reader desk simulation for auth, sync, and payment summaries. */

const LOCAL_READER_AUTH_STORAGE_KEY = "classics.readerDesk.localAuthState.v1";
const LOCAL_READER_SYNC_STORAGE_KEY = "classics.readerDesk.localSyncSummary.v1";
const LOCAL_READER_PAYMENT_STORAGE_KEY = "classics.readerDesk.localPaymentSummary.v1";

function nowIso() {
  return new Date().toISOString();
}

function readStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn(`Local reader simulation could not read ${key}.`, error);
    return fallback;
  }
}

function writeStoredJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  } catch (error) {
    console.warn(`Local reader simulation could not write ${key}.`, error);
    return value;
  }
}

function cleanReaderText(value, maxLength = 160) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeReaderEmail(email) {
  return cleanReaderText(email, 320).toLowerCase();
}

function localReaderUidForEmail(email) {
  const normalizedEmail = normalizeReaderEmail(email) || "local-reader@classics.ourstuff.space";
  return `local-reader:${normalizedEmail}`;
}

function readerNameFromEmail(email) {
  const localPart = String(email || "").split("@")[0] || "Local Reader";
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Local Reader";
}

function normalizeLocalReaderAuthState(details = {}) {
  const email = normalizeReaderEmail(details.email) || "local-reader@classics.ourstuff.space";
  const existing = readLocalReaderAuthState();
  const existingMatches = existing?.email === email;
  const createdAt = existingMatches ? existing.createdAt : nowIso();
  const displayName = cleanReaderText(
    details.name || details.displayName || (existingMatches ? existing.displayName : "") || readerNameFromEmail(email),
    120
  );

  return {
    uid: localReaderUidForEmail(email),
    email,
    displayName,
    providerId: "local-reader-simulation",
    createdAt,
    signedInAt: nowIso(),
    updatedAt: nowIso()
  };
}

function readLocalReaderAuthState() {
  return readStoredJson(LOCAL_READER_AUTH_STORAGE_KEY, null);
}

function writeLocalReaderAuthState(details = {}) {
  return writeStoredJson(LOCAL_READER_AUTH_STORAGE_KEY, normalizeLocalReaderAuthState(details));
}

function clearLocalReaderAuthState() {
  try {
    localStorage.removeItem(LOCAL_READER_AUTH_STORAGE_KEY);
  } catch (error) {
    console.warn("Local reader simulation could not clear auth state.", error);
  }
}

function createLocalReaderUser(authState = readLocalReaderAuthState()) {
  if (!authState?.uid) return null;
  return {
    uid: authState.uid,
    email: authState.email,
    displayName: authState.displayName,
    providerData: [{ providerId: authState.providerId || "local-reader-simulation" }],
    metadata: {
      creationTime: authState.createdAt,
      lastSignInTime: authState.signedInAt
    },
    getIdToken: async () => `local-reader-token:${authState.uid}`,
    reload: async () => {}
  };
}

function updateLocalReaderProfile(details = {}) {
  const current = readLocalReaderAuthState() || {};
  return writeLocalReaderAuthState({
    ...current,
    ...details,
    email: details.email || current.email
  });
}

function countObjectKeys(value) {
  return value && typeof value === "object" ? Object.keys(value).length : 0;
}

function countArray(value) {
  return Array.isArray(value) ? value.length : 0;
}

function createLocalReaderSyncSummary({ userId, stateSnapshot = {}, siteId }) {
  return {
    userId,
    site: siteId,
    source: "localStorage",
    mode: "local-reader-simulation",
    syncedAt: nowIso(),
    counts: {
      checks: countObjectKeys(stateSnapshot.checks),
      readingStageChecks: countObjectKeys(stateSnapshot.readingStageChecks),
      notes: countArray(stateSnapshot.notes),
      deletedNoteIds: stateSnapshot.deletedNoteIds instanceof Set
        ? stateSnapshot.deletedNoteIds.size
        : countArray(stateSnapshot.deletedNoteIds),
      cardStatuses: countObjectKeys(stateSnapshot.cardStatuses),
      cardDates: countObjectKeys(stateSnapshot.cardDates),
      cardTasks: countObjectKeys(stateSnapshot.cardTasks),
      conversationDrafts: countArray(stateSnapshot.conversationDesk?.drafts)
    }
  };
}

function writeLocalReaderSyncSummary(options) {
  return writeStoredJson(LOCAL_READER_SYNC_STORAGE_KEY, createLocalReaderSyncSummary(options));
}

function readLocalReaderSyncSummary() {
  return readStoredJson(LOCAL_READER_SYNC_STORAGE_KEY, null);
}

function emptyLocalPaymentSummary(siteId) {
  return {
    site: siteId,
    summary: {
      currency: "usd",
      totalPaidCents: 0,
      paymentCount: 0,
      donationCount: 0
    },
    items: [],
    source: "local-reader-simulation",
    syncedAt: nowIso()
  };
}

function readLocalReaderPaymentSummaries(siteId) {
  const stored = readStoredJson(LOCAL_READER_PAYMENT_STORAGE_KEY, {});
  if (stored?.[siteId]) return stored;
  return { ...stored, [siteId]: emptyLocalPaymentSummary(siteId) };
}

function writeLocalReaderPaymentSummaries(paymentSummaries) {
  return writeStoredJson(LOCAL_READER_PAYMENT_STORAGE_KEY, paymentSummaries || {});
}

function recordLocalReaderPaymentSimulation({ siteId, amount, profile = {} }) {
  const paymentSummaries = readLocalReaderPaymentSummaries(siteId);
  const current = paymentSummaries[siteId] || emptyLocalPaymentSummary(siteId);
  const amountCents = Math.round(Number(amount || 0) * 100);
  const item = {
    id: `local-payment:${siteId}:${nowIso()}`,
    amountCents,
    currency: "usd",
    customerName: cleanReaderText(profile.name, 120),
    customerEmail: normalizeReaderEmail(profile.email),
    status: "simulated_paid",
    createdAt: nowIso()
  };
  const items = [...(Array.isArray(current.items) ? current.items : []), item];
  const totalPaidCents = items.reduce((total, entry) => total + (Number(entry.amountCents) || 0), 0);
  const safeSummary = {
    site: siteId,
    summary: {
      currency: "usd",
      totalPaidCents,
      paymentCount: items.length,
      donationCount: items.length
    },
    items,
    source: "local-reader-simulation",
    syncedAt: nowIso()
  };
  return writeLocalReaderPaymentSummaries({
    ...paymentSummaries,
    [siteId]: safeSummary
  })[siteId];
}

export {
  LOCAL_READER_AUTH_STORAGE_KEY,
  LOCAL_READER_PAYMENT_STORAGE_KEY,
  LOCAL_READER_SYNC_STORAGE_KEY,
  clearLocalReaderAuthState,
  createLocalReaderUser,
  readLocalReaderAuthState,
  readLocalReaderPaymentSummaries,
  readLocalReaderSyncSummary,
  recordLocalReaderPaymentSimulation,
  updateLocalReaderProfile,
  writeLocalReaderAuthState,
  writeLocalReaderPaymentSummaries,
  writeLocalReaderSyncSummary
};
