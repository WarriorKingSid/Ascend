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
    applicationUrl: 'https://careers.google.com/jobs/results/?src=Online/Social/Indeed&utm_campaign=&utm_source=linkedin&utm_medium=social',
    deadline: '2025-12-15',
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
    applicationUrl: 'https://nvidia.eightfold.ai/careers',
    deadline: '2025-12-20',
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
    applicationUrl: 'https://careers.microsoft.com/students/internships',
    deadline: '2025-12-10',
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
    applicationUrl: 'https://www.figma.com/careers',
    deadline: '2025-12-05',
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
    applicationUrl: 'https://crowdstrike.eightfold.ai/careers',
    deadline: '2025-12-25',
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
    applicationUrl: 'https://stripe.com/jobs/listing/frontend-engineer-intern',
    deadline: '2025-12-18',
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
    applicationUrl: 'https://careers.bostonetics.com/robotics-intern',
    deadline: '2025-12-31',
  },
];

const MOCK_SAVED_KEY = 'ascend_ai_saved_ids';

async function graphqlRequest(query, variables = {}) {
  const response = await fetch(API_CONFIG.graphqlEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(API_CONFIG.authToken ? { Authorization: `Bearer ${API_CONFIG.authToken}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(message || `GraphQL request failed (${response.status})`);
  }

  const json = await response.json();
  if (json.errors && json.errors.length) {
    throw new Error(json.errors.map((error) => error.message).join('; '));
  }

  return json.data;
}

function normalizeInternship(job) {
  const budgetValue = Number(job?.budget ?? NaN);
  const score = Number.isFinite(budgetValue)
    ? Math.min(100, Math.max(30, Math.round((budgetValue / 1000) * 10)))
    : 75;

  return {
    id: Number(job?.id) || 0,
    title: job?.title ?? '',
    company: job?.destination ?? '',
    location: job?.start_date ?? '',
    matchScore: score,
    verified: Boolean(job?.is_read),
    skills: [],
    description: job?.summary ?? '',
  };
}

const MIN_SEARCH_RESULTS = 5;

function mergeSearchResults(backendJobs, query) {
  const normalizedBackend = backendJobs.map(normalizeInternship);
  const mockFallback = filterInternships(MOCK_INTERNSHIPS, query);
  const existingIds = new Set(normalizedBackend.map((job) => job.id));
  const merged = [...normalizedBackend];

  mockFallback.forEach((job) => {
    if (!existingIds.has(job.id)) {
      merged.push(job);
      existingIds.add(job.id);
    }
  });

  if (merged.length >= MIN_SEARCH_RESULTS) return merged;

  for (const job of MOCK_INTERNSHIPS.map(normalizeInternship)) {
    if (!existingIds.has(job.id)) {
      merged.push(job);
      existingIds.add(job.id);
      if (merged.length >= MIN_SEARCH_RESULTS) break;
    }
  }

  return merged;
}

function getMockSavedIds() {
  return JSON.parse(localStorage.getItem(MOCK_SAVED_KEY) || '[]');
}

function setMockSavedIds(ids) {
  localStorage.setItem(MOCK_SAVED_KEY, JSON.stringify(ids));
}

const SEARCH_INTERNSHIPS_QUERY = `
  query SearchTrips($pattern: String!, $limit: Int) {
    trip(
      where: {
        _or: [
          { title: { _ilike: $pattern } },
          { destination: { _ilike: $pattern } },
          { summary: { _ilike: $pattern } }
        ]
      }
      limit: $limit
    ) {
      id
      title
      destination
      start_date
      duration_days
      budget
      summary
      is_read
    }
  }
`;

const GET_INTERNSHIP_QUERY = `
  query GetTrip($id: bigint!) {
    trip_by_pk(id: $id) {
      id
      title
      destination
      start_date
      duration_days
      budget
      summary
      is_read
    }
  }
`;

const api = {
  async searchInternships(query = '') {
    const trimmed = query.trim();
    if (!trimmed) return [];

    if (API_CONFIG.useMock) {
      await delay(300);
      return filterInternships(MOCK_INTERNSHIPS, trimmed);
    }

    const data = await graphqlRequest(SEARCH_INTERNSHIPS_QUERY, {
      pattern: `%${trimmed}%`,
      limit: 20,
    });

    const backendResults = data?.trip || [];
    const mergedResults = mergeSearchResults(backendResults, trimmed);
    return mergedResults;
  },

  async getInternship(id) {
    if (API_CONFIG.useMock) {
      await delay(150);
      const job = MOCK_INTERNSHIPS.find((j) => j.id === id);
      if (!job) throw new Error('Internship not found');
      return job;
    }

    try {
      const data = await graphqlRequest(GET_INTERNSHIP_QUERY, { id });
      if (data?.trip_by_pk) {
        return normalizeInternship(data.trip_by_pk);
      }
    } catch (err) {
      // Log but continue to fallback
      console.log('GraphQL fallback:', err.message);
    }

    const mockFallback = MOCK_INTERNSHIPS.find((j) => j.id === id);
    if (mockFallback) return mockFallback;

    throw new Error('Internship not found');
  },

  async getSavedInternships() {
    const ids = getMockSavedIds();
    return MOCK_INTERNSHIPS.filter((j) => ids.includes(j.id));
  },

  async saveInternship(id) {
    const ids = getMockSavedIds();
    if (!ids.includes(id)) setMockSavedIds([...ids, id]);
  },

  async unsaveInternship(id) {
    setMockSavedIds(getMockSavedIds().filter((savedId) => savedId !== id));
  },

  async clearSaved() {
    setMockSavedIds([]);
  },
};

function filterInternships(internships, query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return internships.filter((job) =>
    job.title.toLowerCase().includes(q) ||
    job.company.toLowerCase().includes(q) ||
    (job.location && job.location.toLowerCase().includes(q)) ||
    (job.description && job.description.toLowerCase().includes(q)) ||
    job.skills.some((skill) => skill.toLowerCase().includes(q))
  );
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
