const API = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return;
  return res.json();
}

export const api = {
  keywords: {
    list: () => request('/keywords'),
    add: (keyword) => request('/keywords', { method: 'POST', body: JSON.stringify({ keyword }) }),
    remove: (id) => request(`/keywords/${id}`, { method: 'DELETE' }),
    toggle: (id, enabled) => request(`/keywords/${id}`, { method: 'PATCH', body: JSON.stringify({ enabled }) }),
  },
  hotspots: {
    list: (params) => {
      const q = new URLSearchParams(params).toString();
      return request(`/hotspots${q ? `?${q}` : ''}`);
    },
    remove: (id) => request(`/hotspots/${id}`, { method: 'DELETE' }),
    clearAll: () => request('/hotspots', { method: 'DELETE' }),
  },
  settings: {
    get: () => request('/settings'),
    update: (data) => request('/settings', { method: 'POST', body: JSON.stringify(data) }),
  },
  sources: {
    list: () => request('/sources'),
    add: (url, name) => request('/sources', { method: 'POST', body: JSON.stringify({ url, name }) }),
    remove: (id) => request(`/sources/${id}`, { method: 'DELETE' }),
    toggle: (id, enabled) => request(`/sources/${id}`, { method: 'PATCH', body: JSON.stringify({ enabled }) }),
  },
  scan: () => request('/scan', { method: 'POST' }),
};
