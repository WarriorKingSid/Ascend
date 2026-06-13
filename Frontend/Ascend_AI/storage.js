const STORAGE_KEYS = {
  profile: 'ascend_ai_profile',
  applications: 'ascend_ai_applications',
  notes: 'ascend_ai_notes',
  checklists: 'ascend_ai_checklists',
  theme: 'ascend_ai_theme',
  searchCount: 'ascend_ai_search_count',
  compare: 'ascend_ai_compare',
};

const APP_STATUSES = [
  { id: 'saved', label: 'Saved', color: '#6b7280' },
  { id: 'applied', label: 'Applied', color: '#2563eb' },
  { id: 'interview', label: 'Interviewing', color: '#7c3aed' },
  { id: 'offer', label: 'Offer', color: '#16a34a' },
  { id: 'rejected', label: 'Rejected', color: '#dc2626' },
];

const CHECKLIST_ITEMS = [
  'Research the company',
  'Tailor resume',
  'Write cover letter',
  'Submit application',
  'Prepare for interview',
  'Send thank-you note',
];

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const storage = {
  getProfile() {
    return readJson(STORAGE_KEYS.profile, { name: '', school: '', location: '', skills: [] });
  },

  saveProfile(profile) {
    writeJson(STORAGE_KEYS.profile, profile);
  },

  getApplicationStatus(id) {
    const map = readJson(STORAGE_KEYS.applications, {});
    return map[id] || 'saved';
  },

  setApplicationStatus(id, status) {
    const map = readJson(STORAGE_KEYS.applications, {});
    map[id] = status;
    writeJson(STORAGE_KEYS.applications, map);
  },

  getAllApplications() {
    return readJson(STORAGE_KEYS.applications, {});
  },

  getNote(id) {
    return readJson(STORAGE_KEYS.notes, {})[id] || '';
  },

  setNote(id, text) {
    const map = readJson(STORAGE_KEYS.notes, {});
    if (text.trim()) map[id] = text.trim();
    else delete map[id];
    writeJson(STORAGE_KEYS.notes, map);
  },

  getChecklist(id) {
    const all = readJson(STORAGE_KEYS.checklists, {});
    if (!all[id]) {
      all[id] = Object.fromEntries(CHECKLIST_ITEMS.map((item) => [item, false]));
      writeJson(STORAGE_KEYS.checklists, all);
    }
    return all[id];
  },

  toggleChecklistItem(id, item) {
    const all = readJson(STORAGE_KEYS.checklists, {});
    if (!all[id]) all[id] = Object.fromEntries(CHECKLIST_ITEMS.map((i) => [i, false]));
    all[id][item] = !all[id][item];
    writeJson(STORAGE_KEYS.checklists, all);
    return all[id];
  },

  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.theme) || 'light';
  },

  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  },

  incrementSearchCount() {
    const count = Number(localStorage.getItem(STORAGE_KEYS.searchCount) || 0) + 1;
    localStorage.setItem(STORAGE_KEYS.searchCount, String(count));
    return count;
  },

  getSearchCount() {
    return Number(localStorage.getItem(STORAGE_KEYS.searchCount) || 0);
  },

  getCompareIds() {
    return readJson(STORAGE_KEYS.compare, []);
  },

  setCompareIds(ids) {
    writeJson(STORAGE_KEYS.compare, ids.slice(0, 3));
  },
};

function calcSkillMatch(userSkills, jobSkills) {
  if (!userSkills.length || !jobSkills.length) return null;
  const normalized = userSkills.map((s) => s.toLowerCase().trim());
  const matched = jobSkills.filter((skill) => {
    const s = skill.toLowerCase();
    return normalized.some((u) => s.includes(u) || u.includes(s));
  });
  return Math.round((matched.length / jobSkills.length) * 100);
}

function getMatchedSkills(userSkills, jobSkills) {
  const normalized = userSkills.map((s) => s.toLowerCase().trim());
  return jobSkills.filter((skill) => {
    const s = skill.toLowerCase();
    return normalized.some((u) => s.includes(u) || u.includes(s));
  });
}
