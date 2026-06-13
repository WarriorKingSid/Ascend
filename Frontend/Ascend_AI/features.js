const features = {
  init() {
    this.applyTheme(storage.getTheme());
    this.bindProfileForm();
    this.bindThemeToggle();
    this.bindTracker();
    this.bindCompareBar();
    this.renderDashboard();
    this.renderCompareBar();
  },

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  },

  bindThemeToggle() {
    document.getElementById('themeToggle')?.addEventListener('click', () => {
      const next = storage.getTheme() === 'dark' ? 'light' : 'dark';
      storage.setTheme(next);
      this.applyTheme(next);
    });
  },

  bindProfileForm() {
    const form = document.getElementById('profileForm');
    if (!form) return;

    const profile = storage.getProfile();
    document.getElementById('profileName').value = profile.name;
    document.getElementById('profileSchool').value = profile.school;
    document.getElementById('profileSkills').value = profile.skills.join(', ');
    this.updateProfilePreview(profile);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const skills = document.getElementById('profileSkills').value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const updated = {
        name: document.getElementById('profileName').value.trim(),
        school: document.getElementById('profileSchool').value.trim(),
        skills,
      };

      storage.saveProfile(updated);
      this.updateProfilePreview(updated);
      this.renderDashboard();
      if (typeof window.refreshJobCards === 'function') window.refreshJobCards();
      if (typeof showToast === 'function') showToast('Profile saved!', 'success');
    });
  },

  updateProfilePreview(profile) {
    const el = document.getElementById('profilePreview');
    if (!el) return;

    if (!profile.name && !profile.skills.length) {
      el.innerHTML = '<p class="empty-hint">Add your skills to see personalized fit scores on search results.</p>';
      return;
    }

    el.innerHTML = `
      <p><strong>${escapeHtml(profile.name || 'Student')}</strong>${profile.school ? ` · ${escapeHtml(profile.school)}` : ''}</p>
      <div class="tags">${profile.skills.map((s) => `<span class="tag tag--you">${escapeHtml(s)}</span>`).join('') || '<span class="empty-hint">No skills added yet</span>'}</div>
    `;
  },

  renderDashboard() {
    const el = document.getElementById('dashboardStats');
    if (!el) return;

    const profile = storage.getProfile();
    const apps = storage.getAllApplications();
    const statusCounts = APP_STATUSES.reduce((acc, s) => ({ ...acc, [s.id]: 0 }), {});

    Object.values(apps).forEach((status) => {
      if (statusCounts[status] !== undefined) statusCounts[status]++;
    });

    const savedCount = document.getElementById('navSavedBadge')?.textContent || '0';

    el.innerHTML = `
      <div class="stat-card">
        <span class="stat-value">${storage.getSearchCount()}</span>
        <span class="stat-label">Searches</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${savedCount}</span>
        <span class="stat-label">Saved</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${statusCounts.applied}</span>
        <span class="stat-label">Applied</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${statusCounts.interview}</span>
        <span class="stat-label">Interviewing</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${profile.skills.length}</span>
        <span class="stat-label">Your Skills</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${profile.skills.length ? Math.min(100, profile.skills.length * 10) : 0}%</span>
        <span class="stat-label">Profile Complete</span>
      </div>
    `;
  },

  bindTracker() {
    document.getElementById('trackerBoard')?.addEventListener('change', (e) => {
      if (e.target.matches('[data-status-select]')) {
        storage.setApplicationStatus(Number(e.target.dataset.id), e.target.value);
        this.renderDashboard();
        if (typeof showToast === 'function') showToast('Status updated.');
      }
    });

    document.getElementById('trackerBoard')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-checklist-toggle]');
      if (!btn) return;
      const id = Number(btn.dataset.id);
      const item = btn.dataset.item;
      const checklist = storage.toggleChecklistItem(id, item);
      btn.classList.toggle('done', checklist[item]);
      btn.setAttribute('aria-pressed', String(checklist[item]));
      this.updateChecklistProgress(id);
    });

    document.getElementById('savedContainer')?.addEventListener('input', (e) => {
      if (e.target.matches('[data-note-input]')) {
        storage.setNote(Number(e.target.dataset.id), e.target.value);
      }
    });
  },

  renderTracker(jobs) {
    const board = document.getElementById('trackerBoard');
    const empty = document.getElementById('trackerEmpty');
    if (!board) return;

    if (!jobs.length) {
      board.innerHTML = '';
      empty?.classList.remove('hidden');
      return;
    }

    empty?.classList.add('hidden');
    board.innerHTML = jobs.map((job) => this.renderTrackerCard(job)).join('');
  },

  renderTrackerCard(job) {
    const status = storage.getApplicationStatus(job.id);
    const checklist = storage.getChecklist(job.id);
    const done = Object.values(checklist).filter(Boolean).length;
    const total = CHECKLIST_ITEMS.length;

    return `
      <article class="tracker-card">
        <div class="tracker-card-header">
          <div>
            <h3>${escapeHtml(job.title)}</h3>
            <p class="company">${escapeHtml(job.company)}</p>
          </div>
          <select data-status-select data-id="${job.id}" aria-label="Application status for ${escapeHtml(job.title)}">
            ${APP_STATUSES.map((s) => `<option value="${s.id}" ${status === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}
          </select>
        </div>
        <div class="status-pill" style="--status-color:${APP_STATUSES.find((s) => s.id === status)?.color}">${APP_STATUSES.find((s) => s.id === status)?.label}</div>
        <div class="checklist-progress" id="checklist-progress-${job.id}">${done}/${total} prep steps done</div>
        <ul class="checklist" aria-label="Interview prep for ${escapeHtml(job.title)}">
          ${CHECKLIST_ITEMS.map((item) => `
            <li>
              <button type="button" class="checklist-item ${checklist[item] ? 'done' : ''}" data-checklist-toggle data-id="${job.id}" data-item="${escapeHtml(item)}" aria-pressed="${checklist[item]}">
                <span class="check-icon" aria-hidden="true">${checklist[item] ? '✓' : '○'}</span>
                ${escapeHtml(item)}
              </button>
            </li>
          `).join('')}
        </ul>
      </article>
    `;
  },

  updateChecklistProgress(id) {
    const checklist = storage.getChecklist(id);
    const done = Object.values(checklist).filter(Boolean).length;
    const el = document.getElementById(`checklist-progress-${id}`);
    if (el) el.textContent = `${done}/${CHECKLIST_ITEMS.length} prep steps done`;
  },

  bindCompareBar() {
    document.getElementById('compareBtn')?.addEventListener('click', () => this.openCompareModal());
    document.getElementById('clearCompareBtn')?.addEventListener('click', () => {
      storage.setCompareIds([]);
      this.renderCompareBar();
      if (typeof window.refreshJobCards === 'function') window.refreshJobCards();
    });
  },

  toggleCompare(id) {
    let ids = storage.getCompareIds();
    if (ids.includes(id)) {
      ids = ids.filter((i) => i !== id);
    } else if (ids.length >= 3) {
      if (typeof showToast === 'function') showToast('You can compare up to 3 roles.', 'error');
      if (typeof window.refreshJobCards === 'function') window.refreshJobCards();
      return;
    } else {
      ids.push(id);
    }
    storage.setCompareIds(ids);
    this.renderCompareBar();
    if (typeof window.refreshJobCards === 'function') window.refreshJobCards();
  },

  renderCompareBar() {
    const bar = document.getElementById('compareBar');
    const count = document.getElementById('compareCount');
    const ids = storage.getCompareIds();
    if (!bar) return;

    bar.classList.toggle('hidden', ids.length === 0);
    if (count) count.textContent = `${ids.length} selected`;
    document.getElementById('compareBtn').disabled = ids.length < 2;
  },

  async openCompareModal() {
    const ids = storage.getCompareIds();
    if (ids.length < 2) return;

    try {
      const jobs = await Promise.all(ids.map((id) => api.getInternship(id)));
      const profile = storage.getProfile();
      const rows = [
        ['Company', ...jobs.map((j) => j.company)],
        ['Location', ...jobs.map((j) => j.location || '—')],
        ['Match Score', ...jobs.map((j) => `${j.matchScore}%`)],
        ['Your Fit', ...jobs.map((j) => {
          const fit = calcSkillMatch(profile.skills, j.skills);
          return fit !== null ? `${fit}%` : '—';
        })],
        ['Verified', ...jobs.map((j) => j.verified ? 'Yes' : 'No')],
        ['Skills', ...jobs.map((j) => j.skills.join(', '))],
      ];

      document.getElementById('modalBody').innerHTML = `
        <h2 id="modalTitle">Compare Internships</h2>
        <div class="compare-table-wrap">
          <table class="compare-table">
            <thead>
              <tr>
                <th></th>
                ${jobs.map((j) => `<th>${escapeHtml(j.title)}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map(([label, ...cells]) => `
                <tr>
                  <th scope="row">${escapeHtml(label)}</th>
                  ${cells.map((c) => `<td>${escapeHtml(String(c))}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      if (typeof window.openModal === 'function') window.openModal();
    } catch {
      if (typeof showToast === 'function') showToast('Could not load comparison.', 'error');
    }
  },
};
