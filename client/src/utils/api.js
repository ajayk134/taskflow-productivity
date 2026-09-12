const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('taskflow_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('taskflow_token', token);
    } else {
      localStorage.removeItem('taskflow_token');
    }
  }

  async request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...options.headers
    };

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      this.setToken(null);
      let message = 'Session expired. Please sign in.';
      try {
        const errData = await response.json();
        if (errData?.error) message = errData.error;
      } catch {
        /* keep default message */
      }
      const pathname = typeof window !== 'undefined' && window.location ? window.location.pathname || '' : '';
      if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
        if (typeof window !== 'undefined' && window.location) window.location.href = '/login';
      }
      throw new Error(message);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/csv')) {
      return response.blob();
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  get(path, params) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`${path}${query}`);
  }

  post(path, body) {
    return this.request(path, { method: 'POST', body: JSON.stringify(body) });
  }

  put(path, body) {
    return this.request(path, { method: 'PUT', body: JSON.stringify(body) });
  }

  delete(path) {
    return this.request(path, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
export default api;
