/**
 * Frontend configuration — update when connecting your backend.
 *
 * Expected API contract:
 *
 *   GET  /internships?q={query}     → { internships: Internship[] }  (q required; empty q → [])
 *   GET  /internships/:id           → { internship: Internship }
 *   GET  /saved                     → { internships: Internship[] }
 *   POST /saved                     → body: { internshipId: number|string }
 *   DELETE /saved/:id               → 204 or { success: true }
 *
 * Internship shape:
 *   { id, title, company, matchScore, verified, skills: string[] }
 */
const API_CONFIG = {
  baseUrl: 'http://localhost:3000/api',
  useMock: true,
};
