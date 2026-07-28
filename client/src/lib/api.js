// Fetch helper. Reads use GET, writes use POST. A JWT (when present) is sent
// in the Authorization header for the routes that need a logged-in user.
// In development Vite proxies /api to Express; in production they share origin.
async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Surface the server's friendly message when there is one.
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

// Build a query string, skipping empty values.
function toQuery(params = {}) {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return q ? `?${q}` : '';
}

export const api = {
  // Reads (GET)
  getMatches: (params) => request(`/matches${toQuery(params)}`),
  getMatch: (id) => request(`/matches/${id}`),
  getVenues: () => request('/venues'),
  me: (token) => request('/auth/me', { token }),
  myMatches: (token) => request('/matches/mine', { token }),
  checkDuplicate: ({ venue, date, time }) =>
    request(`/matches/check-duplicate${toQuery({ venue, date, time })}`),

  // Writes (POST)
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  saveQuiz: (body, token) => request('/auth/quiz', { method: 'POST', body, token }),
  joinMatch: (id, token) => request(`/matches/${id}/join`, { method: 'POST', token }),
  leaveMatch: (id, token) => request(`/matches/${id}/leave`, { method: 'POST', token }),
  deleteMatch: (id, token) => request(`/matches/${id}/delete`, { method: 'POST', token }),
  createMatch: (body, token) => request('/matches', { method: 'POST', body, token }),
  submitSupport: (body) => request('/support', { method: 'POST', body }),
};
