const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = 'Ocurrio un error inesperado';
    try {
      const error = await response.json();
      message = error.message || message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  listRiders(filters) {
    const params = new URLSearchParams();
    if (filters.zone) {
      params.set('zone', filters.zone);
    }
    if (filters.category) {
      params.set('category', filters.category);
    }
    if (filters.status) {
      params.set('status', filters.status);
    }
    const query = params.toString();
    return request(`/riders${query ? `?${query}` : ''}`);
  },
  getRiderEvaluation(id) {
    return request(`/riders/${id}/evaluation`);
  },
  getZonesSummary() {
    return request('/summary/zones');
  },
  createDelivery(payload) {
    return request('/deliveries', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  createRider(payload) {
    return request('/riders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
