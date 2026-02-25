const API_URL = `${import.meta.env.VITE_API_URL}/api`;

export const api = {
  async signUp(email, password, username) {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username }),
    });
    return response.json();
  },

  async signIn(email, password) {
    const response = await fetch(`${API_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  async getUser(token) {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  async analyzeArticle(article) {
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: article }),
    });
    return response.json();
  },

  async createHistory(token, data) {
    const response = await fetch(`${API_URL}/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async getHistory(token) {
    const response = await fetch(`${API_URL}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  async deleteHistory(token, id) {
    const response = await fetch(`${API_URL}/history/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },
};  