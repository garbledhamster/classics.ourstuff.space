/* components/comments.js — Great Conversation: per-book comment threads (load, submit, delete, render) */
/* =========================================================
   GREAT CONVERSATION — BOOK COMMENTS
   ========================================================= */

// Build a stable key for a book (used as Firestore field filter)
function bookCommentKey(title, author) {
  return `${(author || "").toLowerCase().replace(/\s+/g, "_")}||${(title || "").toLowerCase().replace(/\s+/g, "_")}`;
}

// Load comments for a book from Firestore
async function loadBookComments(bookKey) {
  if (!window.firebaseDB) return [];
  try {
    const db = window.firebaseDB;
    const col = window.firestoreCollection(db, "bookComments");
    const q = window.firestoreQuery(
      col,
      window.firestoreWhere("bookKey", "==", bookKey),
      window.firestoreOrderBy("createdAt", "asc")
    );
    const snap = await window.firestoreGetDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Error loading comments:", err);
    return [];
  }
}

// Submit a new comment to Firestore
async function submitBookComment() {
  const body = ($("#commentBody").value || "").trim();
  if (!body) { await showAlert("Please write something before joining the conversation.", "Empty Comment"); return; }
  if (!state.currentUser) { await showAlert("Please sign in to join the Great Conversation.", "Sign In Required"); return; }

  const { bookTitle, bookAuthor, bookKey, selectedType } = state.commentsUI;
  const db = window.firebaseDB;
  if (!db) return;

  state.commentsUI.submitting = true;
  const submitBtn = $("#submitCommentBtn");
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Posting…"; }

  try {
    const col = window.firestoreCollection(db, "bookComments");
    const email = state.currentUser.email || "";
    const displayName = email.split("@")[0] || "Anonymous";
    await window.firestoreAddDoc(col, {
      bookKey,
      bookTitle,
      bookAuthor,
      userId: state.currentUser.uid,
      userDisplayName: displayName,
      body,
      commentType: selectedType,
      createdAt: window.firestoreServerTimestamp()
    });
    $("#commentBody").value = "";
    // Reload and re-render
    const comments = await loadBookComments(bookKey);
    state.commentsCache[bookKey] = comments;
    renderBookCommentsList(comments);
  } catch (err) {
    console.error("Error submitting comment:", err);
    await showAlert("Could not post your comment. Please try again.", "Error");
  } finally {
    state.commentsUI.submitting = false;
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg> Join the Conversation`; }
  }
}

// Delete a comment (only the owner can delete their own)
async function deleteBookComment(commentId) {
  const confirmed = await showConfirm("Delete this comment? This cannot be undone.", "Delete Comment");
  if (!confirmed) return;
  try {
    const db = window.firebaseDB;
    const docRef = window.firestoreDoc(db, "bookComments", commentId);
    await window.firestoreDeleteDoc(docRef);
    const { bookKey } = state.commentsUI;
    const comments = await loadBookComments(bookKey);
    state.commentsCache[bookKey] = comments;
    renderBookCommentsList(comments);
  } catch (err) {
    console.error("Error deleting comment:", err);
    await showAlert("Could not delete the comment. Please try again.", "Error");
  }
}

const COMMENT_TYPE_LABELS = {
  argument: "💡 Argument",
  counterArgument: "↩️ Counter-Argument",
  culturalConnection: "🌏 Cultural Connection",
  reflection: "🤔 Reflection"
};

function renderBookCommentsList(comments) {
  const el = $("#commentsList");
  if (!el) return;
  if (!comments?.length) {
    el.innerHTML = `<div class="commentsEmpty">No contributions yet — be the first to join this conversation!</div>`;
    return;
  }
  const uid = state.currentUser ? state.currentUser.uid : null;
  el.innerHTML = comments.map(comment => {
    const typeLabel = COMMENT_TYPE_LABELS[comment.commentType] || comment.commentType || "Comment";
    let date = "";
    if (comment.createdAt?.toDate) {
      date = comment.createdAt.toDate().toLocaleDateString(undefined, { year:"numeric", month:"short", day:"numeric" });
    }
    const canDelete = uid && comment.userId === uid;
    return `
      <div class="commentItem" data-commentid="${escapeHtml(comment.id)}">
        <div class="commentItemHeader">
          <span class="commentAuthorName">${escapeHtml(comment.userDisplayName || "Anonymous")}</span>
          <span class="commentTypeBadge">${escapeHtml(typeLabel)}</span>
          ${date ? `<span class="commentDate">${escapeHtml(date)}</span>` : ""}
        </div>
        <div class="commentBody">${escapeHtml(comment.body)}</div>
        ${canDelete ? `<button class="btn commentDeleteBtn" type="button" data-action="deleteComment" data-commentid="${escapeHtml(comment.id)}">Delete</button>` : ""}
      </div>
    `;
  }).join("");
}

async function openCommentsDrawer(bookTitle, bookAuthor) {
  const bookKey = bookCommentKey(bookTitle, bookAuthor);
  state.commentsUI.bookTitle = bookTitle;
  state.commentsUI.bookAuthor = bookAuthor;
  state.commentsUI.bookKey = bookKey;
  state.commentsUI.selectedType = "argument";

  const titleEl = $("#commentsBookTitle");
  if (titleEl) titleEl.textContent = `${bookTitle} — ${bookAuthor}`;

  // Reset type pills
  $("#commentTypeRow").querySelectorAll(".commentTypePill").forEach(p => {
    p.classList.toggle("selected", p.dataset.type === "argument");
  });

  // Reset form
  const bodyEl = $("#commentBody");
  if (bodyEl) bodyEl.value = "";

  // Show/hide form based on login state
  const signInNote = $("#commentSignInNote");
  const formFields = $("#commentFormFields");
  if (state.currentUser) {
    if (signInNote) signInNote.style.display = "none";
    if (formFields) formFields.style.display = "";
  } else {
    if (signInNote) signInNote.style.display = "";
    if (formFields) formFields.style.display = "none";
  }

  // Show loading state
  const listEl = $("#commentsList");
  if (listEl) listEl.innerHTML = `<div class="commentsLoading">Loading conversation…</div>`;

  openDrawer("comments");

  // Load from cache or Firestore
  const cached = state.commentsCache[bookKey];
  if (cached) {
    renderBookCommentsList(cached);
  } else {
    const comments = await loadBookComments(bookKey);
    state.commentsCache[bookKey] = comments;
    renderBookCommentsList(comments);
  }
}

