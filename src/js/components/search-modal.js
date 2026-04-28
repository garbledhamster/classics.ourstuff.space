/* components/search-modal.js — Search settings modal: platform select, preview URL, open search */
function showSearchSettingsModal({ title, author, platform, goal = "", works = [], taskHint = "" }) {
  const modal = $("#searchSettingsModal");
  const backdrop = $("#modalBackdrop");
  
  // Store context
  searchSettingsModalContext = { title, author, platform, goal, works, bloomsLevel: null };
  
  // Update modal title based on platform
  const platformName = platform === "youtube" ? "Videos" : "Search";
  $("#searchSettingsModalTitle").textContent = platform === "youtube" ? "Videos Settings" : "Search Settings";
  
  // Update platform indicator
  $("#searchPlatformName").textContent = platformName;
  const platformIcon = $("#searchPlatformIcon");
  if (platform === "youtube") {
    // YouTube icon (play button)
    platformIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
    $("#searchPlatformIndicator").style.background = "#ffe8e8";
    $("#searchPlatformIndicator").style.borderLeftColor = "#ff0000";
  } else {
    // Google icon (search)
    platformIcon.innerHTML = '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path>';
    $("#searchPlatformIndicator").style.background = "#e8f4fd";
    $("#searchPlatformIndicator").style.borderLeftColor = "#2196F3";
  }
  
  // Update "Open Search" button text
  $("#searchSettingsOpenBtn").textContent = platform === "youtube" ? "Open Videos" : "Open Search";
  
  // Reset form to default state; pre-fill custom search with task hint if provided
  $("#includeTitle").checked = true;
  $("#includeAuthor").checked = true;
  $("#includeSelectedWorks").checked = false;
  $("#customSearch").value = taskHint;
  $("#selectedWorksContainer").style.display = "none";
  
  // Populate works dropdown
  const dropdown = $("#selectedWorksDropdown");
  dropdown.innerHTML = '<option value="">-- Select a work --</option>';
  if (works && works.length > 0) {
    works.forEach(work => {
      const opt = document.createElement("option");
      opt.value = work.title || work;
      opt.textContent = work.title || work;
      dropdown.appendChild(opt);
    });
    $("#includeSelectedWorks").disabled = false;
  } else {
    $("#includeSelectedWorks").disabled = true;
  }
  
  // Populate Bloom's taxonomy buttons
  const bloomsContainer = $("#bloomsButtonsContainer");
  bloomsContainer.innerHTML = LEARNING_GOAL_OPTIONS.map(option => `
    <button class="btn btnBloom" type="button" data-blooms-level="${escapeHtml(option.label)}" data-blooms-query="${escapeHtml(option.query)}">
      ${escapeHtml(option.label)}
    </button>
  `).join("");
  
  // Update search preview
  updateSearchPreview();
  
  // Show modal
  modal.classList.add("open");
  backdrop.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function hideSearchSettingsModal() {
  const modal = $("#searchSettingsModal");
  const backdrop = $("#modalBackdrop");
  modal.classList.remove("open");
  backdrop.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

function updateSearchPreview() {
  const { title, author, platform, goal, bloomsLevel } = searchSettingsModalContext;
  const includeTitle = $("#includeTitle").checked;
  const includeAuthor = $("#includeAuthor").checked;
  const includeSelectedWorks = $("#includeSelectedWorks").checked;
  const selectedWork = $("#selectedWorksDropdown").value;
  const customSearch = $("#customSearch").value.trim();
  
  const searchParts = [];
  
  if (includeTitle) {
    searchParts.push(title);
  }
  
  if (includeAuthor) {
    searchParts.push(author);
  }
  
  if (includeSelectedWorks && selectedWork) {
    searchParts.push(selectedWork);
  }
  
  // Add platform-specific suffix for YouTube
  if (platform === "youtube") {
    searchParts.push(YOUTUBE_SEARCH_SUFFIX);
  }
  
  // Add Bloom's level query if selected
  if (bloomsLevel) {
    const bloomsOption = LEARNING_GOAL_OPTIONS.find(opt => opt.label === bloomsLevel);
    if (bloomsOption) {
      searchParts.push(bloomsOption.query);
    }
  }
  
  // Add learning goal if present (from old flow)
  if (goal) {
    searchParts.push(goal);
  }
  
  // Add custom search at the end
  if (customSearch) {
    searchParts.push(customSearch);
  }
  
  const searchQuery = searchParts.filter(p => p).join(" ");
  $("#searchPreview").textContent = searchQuery || "(empty search)";
}

function buildSearchUrlFromSettings() {
  const { title, author, platform, goal, bloomsLevel } = searchSettingsModalContext;
  const includeTitle = $("#includeTitle").checked;
  const includeAuthor = $("#includeAuthor").checked;
  const includeSelectedWorks = $("#includeSelectedWorks").checked;
  const selectedWork = $("#selectedWorksDropdown").value;
  const customSearch = $("#customSearch").value.trim();
  
  const searchParts = [];
  
  if (includeTitle) {
    searchParts.push(title);
  }
  
  if (includeAuthor) {
    searchParts.push(author);
  }
  
  if (includeSelectedWorks && selectedWork) {
    searchParts.push(selectedWork);
  }
  
  // Add platform-specific suffix for YouTube
  if (platform === "youtube") {
    searchParts.push(YOUTUBE_SEARCH_SUFFIX);
  }
  
  // Add Bloom's level query if selected
  if (bloomsLevel) {
    const bloomsOption = LEARNING_GOAL_OPTIONS.find(opt => opt.label === bloomsLevel);
    if (bloomsOption) {
      searchParts.push(bloomsOption.query);
    }
  }
  
  // Add learning goal if present (from old flow)
  if (goal) {
    searchParts.push(goal);
  }
  
  // Add custom search at the end
  if (customSearch) {
    searchParts.push(customSearch);
  }
  
  const q = encodeURIComponent(searchParts.filter(p => p).join(" "));
  
  if (platform === "youtube") {
    return `https://duckduckgo.com/?q=${q}&iax=videos&ia=videos`;
  }
  return `https://duckduckgo.com/?q=${q}`;
}
