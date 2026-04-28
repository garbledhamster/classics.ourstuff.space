/* config.js — Storage keys, constants, option arrays, lookup maps */
/* =========================================================
   STORAGE KEYS
   ========================================================= */
const LS_CHECKS        = "greatworks.reading.checks.v2";
const LS_NOTES         = "greatworks.reading.notes.v1";
const LS_DELETED_NOTES = "greatworks.reading.deletedNoteIds.v1";
const LS_CARD_STATUS       = "greatworks.reading.cardStatus.v1";
const LS_CARD_TASKS        = "greatworks.reading.cardTasks.v1";
const LS_CARD_DATES        = "greatworks.reading.cardDates.v1";
const LS_TABLE_HIDDEN_COLS = "greatworks.reading.tableHiddenCols.v1";
const LS_TIMER_SETTINGS    = "greatworks.reading.timerSettings.v1";
const DEFAULT_CARD_STATUS = "not_started";
const DEFAULT_CARD_TASK = "no_task";
const CARD_STATUS_OPTIONS = [
  { value: DEFAULT_CARD_STATUS, label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "complete", label: "Complete" },
  { value: "skipped", label: "Skipped" }
];
const CARD_TASK_GROUPS = [
  {
    label: "Reading Sequence",
    options: [
      { value: "period_documentary",            label: "Period Documentary",                    description: "Establishes the \u201cpastness of the past\u201d and social context to prime your mind before engaging the text." },
      { value: "author_documentary_biography",  label: "Author Documentary/Biography",          description: "Provides human \u201canchor points\u201d and serves as an intellectual \u201con-ramp\u201d for difficult classics, while humanizing the author\u2019s personal transaction and reinforcing story-based memory." },
      { value: "audiobook_listen_1",             label: "Reading 1 \u2014 Inspectional", description: "A \u201csuperficial reading\u201d where you race through the text \u2014 via audiobook, digital, or physical book \u2014 to find its basic pulsebeat without stopping for difficult parts." },
      { value: "summary_of_book_or_works",       label: "Summary of Book or Works",              description: "Used only as a final refinement and memory jog to ensure you are not at the \u201cmercy\u201d of a commentator\u2019s interpretation before possessing the book yourself." },
      { value: "lecture_on_book_or_works",       label: "Lecture/Discussion",                    description: "Functions as \u201caided discovery\u201d where an expert helps you bridge the gap to higher levels of understanding. Using AI is a great option here \u2014 have a discussion, ask questions, and fill in gaps of knowledge before moving on to the analytical reading." },
      { value: "audiobook_listen_2",             label: "Reading 2 \u2014 Analytical",   description: "The \u201cdeep dive\u201d for \u201cchewing and digesting\u201d the author\u2019s specific arguments and propositions \u2014 available as an audiobook, digital, or physical book." }
    ]
  }
];
const CARD_TASK_OPTIONS = [
  { value: DEFAULT_CARD_TASK, label: "No Action" },
  ...CARD_TASK_GROUPS.flatMap(group => group.options)
];
const CARD_STATUS_SORT_RANK = Object.fromEntries(CARD_STATUS_OPTIONS.map((opt, idx) => [opt.value, idx]));
const CARD_TASK_SORT_RANK = Object.fromEntries(CARD_TASK_OPTIONS.map((opt, idx) => [opt.value, idx]));

// Which button groups to show for each task (all groups shown when no task selected)
const TASK_VISIBLE_GROUPS = {
  period_documentary:              ["context", "biography", "wikipedia", "wikisearch", "google", "youtube"],
  author_documentary_biography:    ["biography", "wikipedia", "google", "youtube"],
  audiobook_listen_1:              ["audiobooks", "freebook", "buybook", "wikipedia"],
  summary_of_book_or_works:        ["outlines", "wikisearch", "goodreads", "google"],
  lecture_on_book_or_works:        ["google", "youtube", "outlines", "wikipedia", "wikisearch"],
  audiobook_listen_2:              ["audiobooks", "freebook", "outlines", "goodreads", "google", "youtube"],
};

// Task-specific search terms appended to search queries (per platform)
const TASK_SEARCH_TERMS = {
  period_documentary:              { google: "historical context documentary time period", youtube: "documentary history period", wikisearch: "historical context era period" },
  author_documentary_biography:    { google: "biography documentary life history",         youtube: "biography documentary life" },
  audiobook_listen_1:              { google: "audiobook public domain",                    youtube: "audiobook" },
  summary_of_book_or_works:        { google: "summary analysis overview themes",           youtube: "summary analysis",         wikisearch: "summary analysis themes" },
  lecture_on_book_or_works:        { google: "lecture course university analysis",          youtube: "lecture course",           wikisearch: "analysis interpretation themes" },
  audiobook_listen_2:              { google: "analysis critical themes",                   youtube: "audiobook deep dive" },
};

const YOUTUBE_SEARCH_SUFFIX = ""; // No default suffix; extra terms are only added when learning goals or custom search are selected
const LEARNING_GOAL_OPTIONS = [
  { label: "Remember", query: "summary overview introduction" },
  { label: "Understand", query: "main ideas explained" },
  { label: "Apply", query: "real world examples and practice" },
  { label: "Analyze", query: "compare themes and analysis" },
  { label: "Evaluate", query: "critical review and evaluation" },
  { label: "Create", query: "creative project prompts" }
];
const AUTO_SYNC_DEBOUNCE_MS = 2000; // Wait 2 seconds after last change before auto-syncing
