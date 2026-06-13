const RECENT_SEARCHES_KEY = 'ascend_ai_recent_searches';
const MAX_RECENT = 5;

const state = {
  internships: [],
  savedInternships: [],
  savedIds: new Set(),
  query: '',
  sort: 'match-desc',
  verifiedOnly: false,
  skillsMatchOnly: false,
  hasSearched: false,
  loading: false,
  savingIds: new Set(),
};

const els = {
  searchForm: document.getElementById('searchForm'),
  searchInput: document.getElementById('searchInput'),
  searchBtn: document.getElementById('searchBtn'),
  sortSelect: document.getElementById('sortSelect'),
  verifiedOnly: document.getElementById('verifiedOnly'),
  skillsMatchOnly: document.getElementById('skillsMatchOnly'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  clearSavedBtn: document.getElementById('clearSavedBtn'),
  promptState: document.getElementById('promptState'),
  resultsPanel: document.getElementById('resultsPanel'),
  resultsContainer: document.getElementById('resultsContainer'),
  savedContainer: document.getElementById('savedContainer'),
  resultsCount: document.getElementById('resultsCount'),
  savedCount: document.getElementById('savedCount'),
  navSavedBadge: document.getElementById('navSavedBadge'),
  emptyState: document.getElementById('emptyState'),
  savedEmpty: document.getElementById('savedEmpty'),
  loadingState: document.getElementById('loadingState'),
  skeletonGrid: document.getElementById('skeletonGrid'),
  errorState: document.getElementById('errorState'),
  retryBtn: document.getElementById('retryBtn'),
  recentSearches: document.getElementById('recentSearches'),
  modal: document.getElementById('modal'),
  modalBody: document.getElementById('modalBody'),
  modalClose: document.getElementById('modalClose'),
  toast: document.getElementById('toast'),
  navToggle: document.getElementById('navToggle'),
  navMenu: document.getElementById('navMenu'),
};

let lastFocusedElement;

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type = 'default') {
  els.toast.textContent = message;
  els.toast.className = `toast toast--${type}`;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => els.toast.classList.add('hidden'), 3000);
}

function getRecentSearches() {
  return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
}

function saveRecentSearch(query) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return;

  const recent = getRecentSearches().filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
  recent.unshift(trimmed);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  renderRecentSearches();
}

function renderRecentSearches() {
  const recent = getRecentSearches();
  if (!recent.length) {
    els.recentSearches.classList.add('hidden');
    els.recentSearches.innerHTML = '';
    return;
  }

  els.recentSearches.classList.remove('hidden');
  els.recentSearches.innerHTML = `
    <span class="quick-label">Recent:</span>
    ${recent.map((q) => `<button type="button" class="chip chip--recent" data-query="${escapeHtml(q)}">${escapeHtml(q)}</button>`).join('')}
  `;
}

function sortInternships(list, sortKey) {
  const sorted = [...list];
  switch (sortKey) {
    case 'company-asc':
      return sorted.sort((a, b) => a.company.localeCompare(b.company));
    case 'title-asc':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return sorted.sort((a, b) => b.matchScore - a.matchScore);
  }
}

function getFilteredResults() {
  const profile = storage.getProfile();
  let list = state.internships;
  if (state.verifiedOnly) list = list.filter((j) => j.verified);
  if (state.skillsMatchOnly && profile.skills.length) {
    list = list.filter((j) => (calcSkillMatch(profile.skills, j.skills) || 0) >= 50);
  }
  return sortInternships(list, state.sort);
}

function renderSkillTags(job) {
  const profile = storage.getProfile();
  const matched = profile.skills.length ? getMatchedSkills(profile.skills, job.skills) : [];

  return job.skills.map((s) => {
    const isMatch = matched.includes(s);
    return `<span class="tag ${isMatch ? 'tag--match' : ''}">${escapeHtml(s)}</span>`;
  }).join('');
}

function renderPersonalFit(job) {
  const profile = storage.getProfile();
  if (!profile.skills.length) return '';

  const fit = calcSkillMatch(profile.skills, job.skills);
  if (fit === null) return '';

  return `<span class="personal-fit">Your fit: ${fit}%</span>`;
}

function matchBarClass(score) {
  if (score >= 90) return 'high';
  if (score >= 80) return 'mid';
  return 'low';
}

function renderSkeletons(count = 3) {
  els.skeletonGrid.innerHTML = Array.from({ length: count }, () => `
    <div class="skeleton-card">
      <div class="skeleton-line wide"></div>
      <div class="skeleton-line medium"></div>
      <div class="skeleton-line short"></div>
      <div class="skeleton-bar"></div>
    </div>
  `).join('');
}

function renderJobCard(job, { savedIds, savingIds, showCompare = false, showNote = false } = {}) {
  const isSaved = savedIds.has(job.id);
  const isSaving = savingIds.has(job.id);
  const location = job.location ? `<p class="location">${escapeHtml(job.location)}</p>` : '';
  const compareIds = storage.getCompareIds();
  const isComparing = compareIds.includes(job.id);
  const note = showNote ? storage.getNote(job.id) : '';

  const compareHtml = showCompare ? `
    <label class="compare-toggle">
      <input type="checkbox" data-action="toggle-compare" data-id="${job.id}" ${isComparing ? 'checked' : ''}>
      Compare
    </label>
  ` : '';

  const noteHtml = showNote ? `
    <div class="card-note">
      <label for="note-${job.id}">Your notes</label>
      <textarea id="note-${job.id}" data-note-input data-id="${job.id}" placeholder="Deadlines, contacts, thoughts…" rows="2">${escapeHtml(note)}</textarea>
    </div>
  ` : '';

  return `
    <article class="job-card ${showNote ? 'job-card--saved' : ''}" data-id="${job.id}">
      <div class="card-top">
        <h3>${escapeHtml(job.title)}</h3>
        ${isSaved ? '<span class="saved-pill" aria-label="Saved">Saved</span>' : ''}
      </div>
      <p class="company">${escapeHtml(job.company)}</p>
      ${location}
      <div class="match-bar-wrap" aria-label="Match score ${job.matchScore} percent">
        <div class="match-bar ${matchBarClass(job.matchScore)}" style="width:${job.matchScore}%"></div>
      </div>
      <div class="tags">${renderSkillTags(job)}</div>
      <div class="score-row">
        <span class="score">${job.matchScore}% match</span>
        ${renderPersonalFit(job)}
        <span class="verify ${job.verified ? 'verified' : 'unverified'}">${job.verified ? '✓ Verified' : 'Unverified'}</span>
      </div>
      ${compareHtml}
      <div class="card-buttons">
        <button type="button" class="details-btn" data-action="details" data-id="${job.id}">View Details</button>
        <button
          type="button"
          class="save-btn ${isSaved ? 'saved' : ''}"
          data-action="toggle-save"
          data-id="${job.id}"
          aria-pressed="${isSaved}"
          ${isSaving ? 'disabled' : ''}
        >${isSaving ? 'Saving…' : isSaved ? 'Saved' : 'Save'}</button>
      </div>
      ${noteHtml}
    </article>
  `;
}

window.refreshJobCards = function refreshJobCards() {
  if (state.hasSearched) renderResults();
  renderSaved();
};

function updateSavedBadge(count) {
  els.navSavedBadge.textContent = count;
  els.navSavedBadge.classList.toggle('hidden', count === 0);
  els.clearSavedBtn.classList.toggle('hidden', count === 0);
}

function showPromptState() {
  state.hasSearched = false;
  state.query = '';
  state.internships = [];
  els.promptState.classList.remove('hidden');
  els.resultsPanel.classList.add('hidden');
  clearError();
}

function showResultsPanel() {
  state.hasSearched = true;
  els.promptState.classList.add('hidden');
  els.resultsPanel.classList.remove('hidden');
}

function renderResults() {
  const sorted = getFilteredResults();
  const hasResults = sorted.length > 0;
  const totalBeforeFilter = state.internships.length;

  if (state.hasSearched) {
    if (hasResults) {
      els.resultsCount.textContent = `${sorted.length} ${sorted.length === 1 ? 'role' : 'roles'} found for "${state.query}"`;
    } else if (state.verifiedOnly && totalBeforeFilter > 0) {
      els.resultsCount.textContent = `No verified roles for "${state.query}"`;
    } else {
      els.resultsCount.textContent = `0 roles found for "${state.query}"`;
    }
  }

  els.resultsContainer.innerHTML = sorted.map((job) =>
    renderJobCard(job, { savedIds: state.savedIds, savingIds: state.savingIds, showCompare: true })
  ).join('');

  els.emptyState.classList.toggle('hidden', hasResults || state.loading);
  els.resultsContainer.classList.toggle('hidden', !hasResults && !state.loading);
}

function renderSaved() {
  const count = state.savedInternships.length;
  els.savedCount.textContent = count ? `${count} saved` : '';
  updateSavedBadge(count);

  els.savedContainer.innerHTML = state.savedInternships.map((job) =>
    renderJobCard(job, { savedIds: state.savedIds, savingIds: state.savingIds, showCompare: true, showNote: true })
  ).join('');

  features.renderTracker(state.savedInternships);
  features.renderDashboard();

  els.savedEmpty.classList.toggle('hidden', count > 0);
  els.savedContainer.classList.toggle('hidden', count === 0);
}

function setLoading(isLoading) {
  state.loading = isLoading;
  els.loadingState.classList.toggle('hidden', !isLoading);
  els.searchBtn.disabled = isLoading;
  els.searchInput.disabled = isLoading;
  els.sortSelect.disabled = isLoading;
  els.verifiedOnly.disabled = isLoading;
  els.skillsMatchOnly.disabled = isLoading;

  if (isLoading) {
    renderSkeletons();
    els.resultsContainer.classList.add('hidden');
    els.emptyState.classList.add('hidden');
  }
}

function setError(message) {
  els.errorState.classList.remove('hidden');
  els.errorState.querySelector('p').textContent = message;
  els.resultsContainer.classList.add('hidden');
  els.emptyState.classList.add('hidden');
}

function clearError() {
  els.errorState.classList.add('hidden');
}

async function runSearch(query) {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    showToast('Enter at least 2 characters to search.', 'error');
    return;
  }

  els.searchInput.value = trimmed;
  saveRecentSearch(trimmed);
  storage.incrementSearchCount();
  features.renderDashboard();
  showResultsPanel();
  setLoading(true);
  clearError();
  state.query = trimmed;

  try {
    state.internships = await api.searchInternships(state.query);
    renderResults();
    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    setError(err.message || 'Could not load internships. Check that your backend is running.');
  } finally {
    setLoading(false);
  }
}

function resetSearch() {
  els.searchInput.value = '';
  els.verifiedOnly.checked = false;
  els.skillsMatchOnly.checked = false;
  state.verifiedOnly = false;
  state.skillsMatchOnly = false;
  showPromptState();
  document.getElementById('search').scrollIntoView({ behavior: 'smooth' });
}

async function loadSaved() {
  try {
    state.savedInternships = await api.getSavedInternships();
    state.savedIds = new Set(state.savedInternships.map((j) => j.id));
    renderSaved();
    if (state.hasSearched) renderResults();
  } catch {
    showToast('Could not load saved internships.', 'error');
  }
}

async function toggleSave(id) {
  if (state.savingIds.has(id)) return;

  const isSaved = state.savedIds.has(id);
  state.savingIds.add(id);
  if (state.hasSearched) renderResults();
  renderSaved();

  try {
    if (isSaved) {
      await api.unsaveInternship(id);
      state.savedIds.delete(id);
      showToast('Removed from saved.');
    } else {
      await api.saveInternship(id);
      state.savedIds.add(id);
      showToast('Internship saved.', 'success');
    }
    await loadSaved();
  } catch (err) {
    if (isSaved) state.savedIds.add(id);
    else state.savedIds.delete(id);
    showToast(err.message || 'Could not update saved internships.', 'error');
    await loadSaved();
  } finally {
    state.savingIds.delete(id);
    if (state.hasSearched) renderResults();
    renderSaved();
  }
}

async function clearAllSaved() {
  if (!state.savedIds.size) return;
  if (!confirm('Remove all saved internships?')) return;

  try {
    await api.clearSaved();
    state.savedIds.clear();
    await loadSaved();
    showToast('Cleared all saved internships.');
  } catch (err) {
    showToast(err.message || 'Could not clear saved internships.', 'error');
  }
}

function getFocusableElements(container) {
  return container.querySelectorAll(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
}

function trapFocus(event) {
  const focusable = getFocusableElements(els.modal);
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.key === 'Tab') {
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}

async function showDetails(id) {
  try {
    const job = await api.getInternship(id);
    const isSaved = state.savedIds.has(job.id);
    const location = job.location
      ? `<p><strong>Location:</strong> ${escapeHtml(job.location)}</p>`
      : '';
    const description = job.description
      ? `<p class="modal-description">${escapeHtml(job.description)}</p>`
      : '';
    
    const deadline = job.deadline
      ? `<p><strong>Application Deadline:</strong> ${escapeHtml(job.deadline)}</p>`
      : '';
    
    const applicationLink = job.applicationUrl
      ? `<p><a href="${job.applicationUrl}" target="_blank" class="details-btn" style="display: inline-block; margin-top: 10px;">Apply Now</a></p>`
      : '';

    const profile = storage.getProfile();
    const personalFit = calcSkillMatch(profile.skills, job.skills);
    const fitHtml = personalFit !== null
      ? `<p><strong>Your skill fit:</strong> ${personalFit}% (${getMatchedSkills(profile.skills, job.skills).join(', ') || 'none matched'})</p>`
      : '<p class="empty-hint">Add skills in your <a href="#profile">Profile</a> to see personalized fit.</p>';

    els.modalBody.innerHTML = `
      <h2 id="modalTitle">${escapeHtml(job.title)}</h2>
      <p class="modal-company">${escapeHtml(job.company)}</p>
      ${location}
      ${deadline}
      <div class="modal-score">
        <span class="score">${job.matchScore}% match</span>
        <span class="verify ${job.verified ? 'verified' : 'unverified'}">${job.verified ? '✓ Verified Employer' : 'Unverified'}</span>
      </div>
      <div class="match-bar-wrap" aria-hidden="true">
        <div class="match-bar ${matchBarClass(job.matchScore)}" style="width:${job.matchScore}%"></div>
      </div>
      ${fitHtml}
      ${description}
      <h3>Required Skills</h3>
      <div class="tags">${renderSkillTags(job)}</div>
      <div class="modal-actions">
        <button type="button" class="save-btn ${isSaved ? 'saved' : ''}" data-action="toggle-save" data-id="${job.id}" aria-pressed="${isSaved}">
          ${isSaved ? 'Saved' : 'Save internship'}
        </button>
      </div>
      ${applicationLink}
    `;

    openModal();
  } catch (err) {
    showToast(err.message || 'Could not load internship details.', 'error');
  }
}

function openModal() {
  lastFocusedElement = document.activeElement;
  els.modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  els.modalClose.focus();
}

window.openModal = openModal;

function closeModal() {
  els.modal.classList.add('hidden');
  document.body.style.overflow = '';
  if (lastFocusedElement) lastFocusedElement.focus();
}

function handleCardClick(event) {
  const button = event.target.closest('[data-action]');
  if (!button || button.dataset.action === 'toggle-compare') return;

  const id = Number(button.dataset.id);
  if (button.dataset.action === 'details') showDetails(id);
  if (button.dataset.action === 'toggle-save') toggleSave(id);
}

function handleQuickSearch(event) {
  const chip = event.target.closest('[data-query]');
  if (!chip) return;
  runSearch(chip.dataset.query);
}

function closeMobileNav() {
  els.navMenu.classList.remove('open');
  els.navToggle.setAttribute('aria-expanded', 'false');
  els.navToggle.setAttribute('aria-label', 'Open menu');
}

function init() {
  features.init();
  renderSkeletons();
  renderRecentSearches();
  showPromptState();

  els.searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    runSearch(els.searchInput.value);
  });

  document.querySelector('.quick-searches').addEventListener('click', handleQuickSearch);
  els.recentSearches.addEventListener('click', handleQuickSearch);

  els.sortSelect.addEventListener('change', (e) => {
    state.sort = e.target.value;
    renderResults();
  });

  els.verifiedOnly.addEventListener('change', (e) => {
    state.verifiedOnly = e.target.checked;
    renderResults();
  });

  els.skillsMatchOnly.addEventListener('change', (e) => {
    state.skillsMatchOnly = e.target.checked;
    renderResults();
  });

  els.clearSearchBtn.addEventListener('click', resetSearch);
  els.clearSavedBtn.addEventListener('click', clearAllSaved);
  els.retryBtn.addEventListener('click', () => runSearch(state.query));

  els.resultsContainer.addEventListener('change', (e) => {
    if (e.target.matches('[data-action="toggle-compare"]')) {
      features.toggleCompare(Number(e.target.dataset.id));
    }
  });
  els.savedContainer.addEventListener('change', (e) => {
    if (e.target.matches('[data-action="toggle-compare"]')) {
      features.toggleCompare(Number(e.target.dataset.id));
    }
  });

  els.resultsContainer.addEventListener('click', handleCardClick);
  els.savedContainer.addEventListener('click', handleCardClick);
  els.modalBody.addEventListener('click', handleCardClick);

  els.modal.addEventListener('click', (e) => {
    if (e.target === els.modal) closeModal();
  });
  els.modalClose.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (!els.modal.classList.contains('hidden')) {
      if (e.key === 'Escape') closeModal();
      trapFocus(e);
    }
  });

  els.navToggle.addEventListener('click', () => {
    const isOpen = els.navMenu.classList.toggle('open');
    els.navToggle.setAttribute('aria-expanded', String(isOpen));
    els.navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });

  els.navMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMobileNav);
  });

  loadSaved();
}

init();
