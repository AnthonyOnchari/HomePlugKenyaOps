const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('hpk_token');
}

export function setToken(token) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem('hpk_token', token);
  else window.localStorage.removeItem('hpk_token');
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem('hpk_user');
  return raw ? JSON.parse(raw) : null;
}

export function setUser(user) {
  if (typeof window === 'undefined') return;
  if (user) window.localStorage.setItem('hpk_user', JSON.stringify(user));
  else window.localStorage.removeItem('hpk_user');
}

async function call(action, payload = {}) {
  if (!API_URL) {
    throw new Error(
      'NEXT_PUBLIC_API_URL is not set. Add your Apps Script Web App URL to your environment variables.'
    );
  }
  const res = await fetch(API_URL, {
    method: 'POST',
    // text/plain keeps this a "simple request" so the browser doesn't
    // send a CORS preflight (Apps Script web apps can't respond to OPTIONS).
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, token: getToken(), ...payload }),
  });
  const data = await res.json();
  if (!data.ok) {
    if (String(data.error).toLowerCase().includes('log in')) {
      setToken(null);
      setUser(null);
    }
    throw new Error(data.error || 'Something went wrong.');
  }
  return data;
}

export const api = {
  login: (username, password) => call('login', { username, password }),
  logout: () => call('logout'),
  changePassword: (oldPassword, newPassword) => call('changePassword', { oldPassword, newPassword }),

  getSummary: () => call('getSummary'),

  getClients: () => call('getClients'),
  addClient: (client) => call('addClient', { client }),
  updateClient: (id, updates) => call('updateClient', { id, updates }),
  deleteClient: (id) => call('deleteClient', { id }),

  getTransactions: () => call('getTransactions'),
  addTransaction: (transaction) => call('addTransaction', { transaction }),
  updateTransaction: (id, updates) => call('updateTransaction', { id, updates }),
  deleteTransaction: (id) => call('deleteTransaction', { id }),

  getTeam: () => call('getTeam'),
  addTeamMember: (member) => call('addTeamMember', { member }),
};
