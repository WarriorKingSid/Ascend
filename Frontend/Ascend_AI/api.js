const MOCK_INTERNSHIPS = [
  {
    id: 1,
    title: 'Software Engineering Intern',
    company: 'Google',
    location: 'Mountain View, CA',
    matchScore: 94,
    verified: true,
    skills: ['Java', 'Git', 'Algorithms'],
    description: 'Build features for core Google products alongside experienced engineers. Ideal for students strong in data structures and collaborative development.',
  },
  {
    id: 2,
    title: 'Machine Learning Intern',
    company: 'NVIDIA',
    location: 'Santa Clara, CA',
    matchScore: 91,
    verified: true,
    skills: ['Python', 'PyTorch', 'AI'],
    description: 'Work on GPU-accelerated ML pipelines and model optimization. Prior coursework in deep learning is a plus.',
  },
  {
    id: 3,
    title: 'Data Science Intern',
    company: 'Microsoft',
    location: 'Redmond, WA',
    matchScore: 88,
    verified: true,
    skills: ['SQL', 'Python', 'Statistics'],
    description: 'Analyze product usage data and build dashboards that inform roadmap decisions across Azure teams.',
  },
  {
    id: 4,
    title: 'Product Design Intern',
    company: 'Figma',
    location: 'San Francisco, CA',
    matchScore: 82,
    verified: true,
    skills: ['Figma', 'UI/UX', 'Prototyping'],
    description: 'Partner with PMs and engineers to prototype new collaboration features and run user research sessions.',
  },
  {
    id: 5,
    title: 'Cybersecurity Intern',
    company: 'CrowdStrike',
    location: 'Austin, TX',
    matchScore: 79,
    verified: false,
    skills: ['Networking', 'Linux', 'Security'],
    description: 'Support threat detection workflows and help harden internal tooling. Security club or CTF experience welcome.',
  },
  {
    id: 6,
    title: 'Frontend Engineering Intern',
    company: 'Stripe',
    location: 'Remote',
    matchScore: 86,
    verified: true,
    skills: ['TypeScript', 'React', 'CSS'],
    description: 'Ship polished UI for merchant dashboards. You will pair with designers and write accessible, performant components.',
  },
  {
    id: 7,
    title: 'Robotics Intern',
    company: 'Boston Dynamics',
    location: 'Waltham, MA',
    matchScore: 77,
    verified: true,
    skills: ['C++', 'ROS', 'Controls'],
    description: 'Prototype perception and motion-planning experiments on next-generation robotic platforms.',
  },
];

const MOCK_SAVED_KEY = 'ascend_ai_saved_ids';

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_CONFIG.baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(message || `Request failed (${response.status})`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function filterInternships(internships, query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return internships.filter((job) =>
    job.title.toLowerCase().includes(q) ||
    job.company.toLowerCase().includes(q) ||
    (job.location && job.location.toLowerCase().includes(q)) ||
    job.skills.some((skill) => skill.toLowerCase().includes(q))
  );
}

function getMockSavedIds() {
  return JSON.parse(localStorage.getItem(MOCK_SAVED_KEY) || '[]');
}

function setMockSavedIds(ids) {
  localStorage.setItem(MOCK_SAVED_KEY, JSON.stringify(ids));
}

const api = {
  async searchInternships(query = '') {
    const trimmed = query.trim();
    if (!trimmed) return [];

    if (API_CONFIG.useMock) {
      await delay(300);
      return filterInternships(MOCK_INTERNSHIPS, trimmed);
    }

    const data = await apiRequest(`/internships?q=${encodeURIComponent(trimmed)}`);
    return data.internships ?? data;
  },

  async getInternship(id) {
    if (API_CONFIG.useMock) {
      await delay(150);
      const job = MOCK_INTERNSHIPS.find((j) => j.id === id);
      if (!job) throw new Error('Internship not found');
      return job;
    }

    const data = await apiRequest(`/internships/${id}`);
    return data.internship ?? data;
  },

  async getSavedInternships() {
    if (API_CONFIG.useMock) {
      await delay(200);
      const ids = getMockSavedIds();
      return MOCK_INTERNSHIPS.filter((j) => ids.includes(j.id));
    }

    const data = await apiRequest('/saved');
    return data.internships ?? data;
  },

  async saveInternship(id) {
    if (API_CONFIG.useMock) {
      await delay(150);
      const ids = getMockSavedIds();
      if (!ids.includes(id)) setMockSavedIds([...ids, id]);
      return;
    }

    await apiRequest('/saved', {
      method: 'POST',
      body: JSON.stringify({ internshipId: id }),
    });
  },

  async unsaveInternship(id) {
    if (API_CONFIG.useMock) {
      await delay(150);
      setMockSavedIds(getMockSavedIds().filter((savedId) => savedId !== id));
      return;
    }

    await apiRequest(`/saved/${id}`, { method: 'DELETE' });
  },

  async clearSaved() {
    if (API_CONFIG.useMock) {
      await delay(200);
      setMockSavedIds([]);
      return;
    }

    await apiRequest('/saved', { method: 'DELETE' });
  },
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
