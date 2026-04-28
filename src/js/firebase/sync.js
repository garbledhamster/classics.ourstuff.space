/* firebase/sync.js — Firestore sync: push/pull checks, statuses, tasks, dates, notes, timer; triggerAutoSync */
/* =========================================================
   FIRESTORE SYNC FUNCTIONS
   ========================================================= */
async function syncChecksToFirestore(userId) {
  if (!userId || !window.firebaseDB) return;
  
  try {
    const checks = state.checks;
    const db = window.firebaseDB;
    
    // Store checks in userPrivate/{userId} document
    const userRef = window.firestoreDoc(db, 'userPrivate', userId);
    await window.firestoreSetDoc(userRef, {
      checks: checks,
      checksSyncedAt: window.firestoreServerTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error syncing checks to Firestore:', error);
    state.sync.error = error.message;
  }
}
async function syncCardStatusesToFirestore(userId) {
  if (!userId || !window.firebaseDB) return;
  try {
    const db = window.firebaseDB;
    const userRef = window.firestoreDoc(db, 'userPrivate', userId);
    await window.firestoreSetDoc(userRef, {
      cardStatuses: state.cardStatuses,
      cardStatusesSyncedAt: window.firestoreServerTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error syncing card statuses to Firestore:', error);
    state.sync.error = error.message;
  }
}
async function syncCardDatesToFirestore(userId) {
  if (!userId || !window.firebaseDB) return;
  try {
    const db = window.firebaseDB;
    const userRef = window.firestoreDoc(db, 'userPrivate', userId);
    await window.firestoreSetDoc(userRef, {
      cardDates: state.cardDates,
      cardDatesSyncedAt: window.firestoreServerTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error syncing card dates to Firestore:', error);
    state.sync.error = error.message;
  }
}
async function syncCardTasksToFirestore(userId) {
  if (!userId || !window.firebaseDB) return;
  try {
    const db = window.firebaseDB;
    const userRef = window.firestoreDoc(db, 'userPrivate', userId);
    await window.firestoreSetDoc(userRef, {
      cardTasks: state.cardTasks,
      cardTasksSyncedAt: window.firestoreServerTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error syncing card tasks to Firestore:', error);
    state.sync.error = error.message;
  }
}

// Sync notes to Firestore
async function syncNotesToFirestore(userId) {
  if (!userId || !window.firebaseDB) return;
  
  try {
    const notes = state.notes;
    const db = window.firebaseDB;
    
    // Store notes in userPrivate/{userId} document
    const userRef = window.firestoreDoc(db, 'userPrivate', userId);
    await window.firestoreSetDoc(userRef, {
      notes: notes,
      notesSyncedAt: window.firestoreServerTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error syncing notes to Firestore:', error);
    state.sync.error = error.message;
  }
}

async function loadChecksFromFirestore(userId) {
  if (!userId || !window.firebaseDB) return {};
  
  try {
    const db = window.firebaseDB;
    const userRef = window.firestoreDoc(db, 'userPrivate', userId);
    const docSnap = await window.firestoreGetDoc(userRef);
    
    if (docSnap.exists()) {
      return docSnap.data().checks || {};
    }
    return {};
  } catch (error) {
    console.error('Error loading checks from Firestore:', error);
    state.sync.error = error.message;
    return {};
  }
}
async function loadCardStatusesFromFirestore(userId) {
  if (!userId || !window.firebaseDB) return {};
  try {
    const db = window.firebaseDB;
    const userRef = window.firestoreDoc(db, 'userPrivate', userId);
    const docSnap = await window.firestoreGetDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data().cardStatuses || {};
    }
    return {};
  } catch (error) {
    console.error('Error loading card statuses from Firestore:', error);
    state.sync.error = error.message;
    return {};
  }
}
async function loadCardDatesFromFirestore(userId) {
  if (!userId || !window.firebaseDB) return {};
  try {
    const db = window.firebaseDB;
    const userRef = window.firestoreDoc(db, 'userPrivate', userId);
    const docSnap = await window.firestoreGetDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data().cardDates || {};
    }
    return {};
  } catch (error) {
    console.error('Error loading card dates from Firestore:', error);
    state.sync.error = error.message;
    return {};
  }
}
async function loadCardTasksFromFirestore(userId) {
  if (!userId || !window.firebaseDB) return {};
  try {
    const db = window.firebaseDB;
    const userRef = window.firestoreDoc(db, 'userPrivate', userId);
    const docSnap = await window.firestoreGetDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data().cardTasks || {};
    }
    return {};
  } catch (error) {
    console.error('Error loading card tasks from Firestore:', error);
    state.sync.error = error.message;
    return {};
  }
}

// Load notes from Firestore
async function loadNotesFromFirestore(userId) {
  if (!userId || !window.firebaseDB) return [];
  
  try {
    const db = window.firebaseDB;
    const userRef = window.firestoreDoc(db, 'userPrivate', userId);
    const docSnap = await window.firestoreGetDoc(userRef);
    
    if (docSnap.exists()) {
      return docSnap.data().notes || [];
    }
    return [];
  } catch (error) {
    console.error('Error loading notes from Firestore:', error);
    state.sync.error = error.message;
    return [];
  }
}

async function syncTimerSettingsToFirestore(userId) {
  if (!userId || !window.firebaseDB) return;
  try {
    const settings = safeJsonParse(localStorage.getItem(LS_TIMER_SETTINGS) || "null", null);
    if (!settings) return;
    const db = window.firebaseDB;
    const userRef = window.firestoreDoc(db, 'userPrivate', userId);
    await window.firestoreSetDoc(userRef, {
      timerSettings: settings,
      timerSettingsSyncedAt: window.firestoreServerTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error syncing timer settings to Firestore:', error);
    state.sync.error = error.message;
  }
}

async function loadTimerSettingsFromFirestore(userId) {
  if (!userId || !window.firebaseDB) return null;
  try {
    const db = window.firebaseDB;
    const userRef = window.firestoreDoc(db, 'userPrivate', userId);
    const docSnap = await window.firestoreGetDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data().timerSettings || null;
    }
    return null;
  } catch (error) {
    console.error('Error loading timer settings from Firestore:', error);
    state.sync.error = error.message;
    return null;
  }
}

// Full sync: push local data to Firestore and pull remote data
async function performFullSync(userId) {
  if (!userId || !window.firebaseDB) return;
  
  state.sync.syncing = true;
  state.sync.error = null;
  updateSyncStatus();
  
  try {
    // First, load data from Firestore
    const [remoteChecks, remoteNotes, remoteCardStatuses, remoteCardDates, remoteCardTasks, remoteTimerSettings] = await Promise.all([
      loadChecksFromFirestore(userId),
      loadNotesFromFirestore(userId),
      loadCardStatusesFromFirestore(userId),
      loadCardDatesFromFirestore(userId),
      loadCardTasksFromFirestore(userId),
      loadTimerSettingsFromFirestore(userId)
    ]);
    
    // Merge remote data with local data
    // Conflict resolution: When same ID exists locally and remotely, local version wins.
    // This preserves checkbox changes made between the user's last push and the current
    // pull (e.g. a check saved to localStorage whose 2-second debounce hasn't fired yet).
    // Remote-only keys are still imported so data from other devices is picked up.
    
    // Checks: Merge by key (spread operator, local values overwrite remote on conflict)
    state.checks = { ...remoteChecks, ...state.checks }; // Local wins on conflict
    localStorage.setItem(LS_CHECKS, JSON.stringify(state.checks));
    
    // Notes: Merge by ID (most recently updated version wins on conflict).
    // Remote notes whose IDs are in deletedNoteIds are skipped so that
    // locally-deleted notes are never restored from Firestore.
    const noteMap = new Map(state.notes.map(n => [n.id, n]));
    for (const remoteNote of remoteNotes) {
      if (state.deletedNoteIds.has(remoteNote.id)) continue; // honor local deletion
      const localNote = noteMap.get(remoteNote.id);
      if (!localNote || (remoteNote.updated_at || "") > (localNote.updated_at || "")) {
        noteMap.set(remoteNote.id, remoteNote);
      }
    }
    state.notes = Array.from(noteMap.values());
    localStorage.setItem(LS_NOTES, JSON.stringify(state.notes));
    state.cardStatuses = { ...remoteCardStatuses, ...state.cardStatuses };
    localStorage.setItem(LS_CARD_STATUS, JSON.stringify(state.cardStatuses));
    state.cardDates = { ...remoteCardDates, ...state.cardDates };
    localStorage.setItem(LS_CARD_DATES, JSON.stringify(state.cardDates));
    state.cardTasks = { ...remoteCardTasks, ...state.cardTasks };
    localStorage.setItem(LS_CARD_TASKS, JSON.stringify(state.cardTasks));

    // Timer settings: remote fills in what local hasn't set; local wins on conflict
    if (remoteTimerSettings) {
      const localTimerSettings = safeJsonParse(localStorage.getItem(LS_TIMER_SETTINGS) || "null", null);
      const merged = { ...remoteTimerSettings, ...(localTimerSettings || {}) };
      localStorage.setItem(LS_TIMER_SETTINGS, JSON.stringify(merged));
      if (window.applyTimerSettings) window.applyTimerSettings(merged);
    }
    
    // Push all merged data back to Firestore (includes local-only items)
    await Promise.all([
      syncChecksToFirestore(userId),
      syncNotesToFirestore(userId),
      syncCardStatusesToFirestore(userId),
      syncCardDatesToFirestore(userId),
      syncCardTasksToFirestore(userId),
      syncTimerSettingsToFirestore(userId)
    ]);
    
    // Tombstones fulfilled: deleted notes are no longer in Firestore, safe to clear.
    // This runs only on the success path; if the push above threw, we stay in catch
    // and the tombstones remain so the next sync attempt re-applies the deletions.
    state.deletedNoteIds.clear();
    saveDeletedNoteIds(state.deletedNoteIds);
    
    state.sync.lastSync = new Date().toISOString();
    state.sync.enabled = true;
    
    console.log('Full sync completed successfully');
  } catch (error) {
    console.error('Error during full sync:', error);
    state.sync.error = error.message;
  } finally {
    state.sync.syncing = false;
    updateSyncStatus();
  }
}

// Auto-sync on data changes (debounced)
// Note: This performs a full bidirectional sync (pull, merge, push) on every change.
// For production optimization, consider implementing incremental sync that only pushes changed items.
let syncTimeout = null;
// Reassign the triggerAutoSync function with actual implementation
triggerAutoSync = () => {
  // Skip if already syncing to prevent loops
  if (!state.currentUser || !state.sync.enabled || state.sync.syncing) return;
  
  // Debounce: Clear previous timeout and set a new one
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    await performFullSync(state.currentUser.uid);
  }, AUTO_SYNC_DEBOUNCE_MS);
};

// Update sync status in UI
function updateSyncStatus() {
  const statusEl = document.getElementById('syncStatus');
  if (!statusEl) return;
  
  if (state.sync.syncing) {
    statusEl.textContent = '🔄 Syncing...';
    statusEl.style.color = '#666';
  } else if (state.sync.error) {
    statusEl.textContent = '⚠️ Sync error';
    statusEl.style.color = '#d00';
  } else if (state.sync.enabled && state.sync.lastSync) {
    const date = new Date(state.sync.lastSync);
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    statusEl.textContent = `✓ Synced at ${timeStr}`;
    statusEl.style.color = '#080';
  } else if (state.currentUser) {
    statusEl.textContent = '⚠️ Not synced';
    statusEl.style.color = '#666';
  } else {
    statusEl.textContent = 'Sign in to sync';
    statusEl.style.color = '#666';
  }
}

