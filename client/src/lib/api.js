// Tiny fetch helper. All reads use GET. In development Vite proxies /api to
// the Express server; in production they share the same origin.
async function getJSON(path) {
  const res = await fetch(`/api${path}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return res.json();
}

// Build a query string from a params object, skipping empty values.
function toQuery(params = {}) {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return q ? `?${q}` : '';
}

export const api = {
  getMatches: (params) => getJSON(`/matches${toQuery(params)}`),
  getMatch: (id) => getJSON(`/matches/${id}`),
  getVenues: () => getJSON('/venues'),
};
