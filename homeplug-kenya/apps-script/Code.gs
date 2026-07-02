/**
 * HOME PLUG KENYA — INTERNAL OPS API
 * ------------------------------------------------------------
 * This script turns a Google Sheet into a small JSON API for the
 * internal team app (client contacts / viewing schedule / expenses).
 *
 * SETUP
 * 1. Create a new Google Sheet.
 * 2. Extensions > Apps Script, delete any starter code, paste this whole file.
 * 3. Run `setup` once from the Apps Script editor (select it in the
 *    function dropdown, click Run). It will create all the tabs/headers
 *    and one admin user: username "admin", password "changeme123".
 *    Approve the permissions it asks for.
 * 4. Deploy > New deployment > type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 *    Copy the Web App URL — that's what goes into the frontend's
 *    NEXT_PUBLIC_API_URL environment variable.
 * 5. Log in to the app as admin, then add real team accounts from
 *    the "Team" page (or add rows directly to the Users sheet).
 * 6. IMPORTANT: change SECRET_KEY below to your own random string
 *    before you deploy for real — it's used to sign session tokens.
 * ------------------------------------------------------------
 */

const SECRET_KEY = 'change-this-to-a-long-random-string-before-deploying';
const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const SHEETS = {
  USERS: 'Users',
  SESSIONS: 'Sessions',
  CLIENTS: 'Clients',
  TRANSACTIONS: 'Transactions',
};

const HEADERS = {
  Users: ['id', 'name', 'username', 'passwordHash', 'role', 'active', 'createdAt'],
  Sessions: ['token', 'userId', 'createdAt', 'expiresAt'],
  Clients: [
    'id', 'name', 'phone', 'property', 'viewingDate', 'viewingTime',
    'agent', 'status', 'fee', 'feePaid', 'notes', 'createdAt', 'createdBy', 'updatedAt',
  ],
  Transactions: [
    'id', 'date', 'type', 'category', 'amount', 'relatedClient',
    'agent', 'notes', 'createdAt', 'createdBy',
  ],
};

// ---------- ONE-TIME SETUP ----------

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(HEADERS).forEach((name) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    sheet.clear();
    sheet.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]]);
    sheet.setFrozenRows(1);
  });
  // Remove default "Sheet1" if it's still there and empty
  const def = ss.getSheetByName('Sheet1');
  if (def) ss.deleteSheet(def);

  // Seed one admin account
  const users = getSheet_(SHEETS.USERS);
  users.appendRow([
    Utilities.getUuid(),
    'Admin',
    'admin',
    hashPassword_('changeme123'),
    'admin',
    true,
    new Date().toISOString(),
  ]);

  SpreadsheetApp.getUi().alert(
    'Setup complete. Login with username "admin" and password "changeme123", then change it from the Team page.'
  );
}

// ---------- WEB ENTRY POINTS ----------

function doGet(e) {
  return respond_({ ok: true, message: 'Home Plug Kenya API is running. Use POST requests.' });
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return respond_({ ok: false, error: 'Invalid request body.' });
  }

  const action = body.action;
  try {
    switch (action) {
      case 'login':
        return respond_(login_(body.username, body.password));
      case 'logout':
        return respond_(logout_(body.token));

      case 'getClients':
        requireAuth_(body.token);
        return respond_({ ok: true, clients: getClients_() });
      case 'addClient':
        return respond_({ ok: true, client: addClient_(requireAuth_(body.token), body.client) });
      case 'updateClient':
        return respond_({ ok: true, client: updateClient_(requireAuth_(body.token), body.id, body.updates) });
      case 'deleteClient':
        deleteRow_(SHEETS.CLIENTS, body.id);
        return respond_({ ok: true });

      case 'getTransactions':
        requireAuth_(body.token);
        return respond_({ ok: true, transactions: getTransactions_() });
      case 'addTransaction':
        return respond_({ ok: true, transaction: addTransaction_(requireAuth_(body.token), body.transaction) });
      case 'updateTransaction':
        return respond_({ ok: true, transaction: updateTransaction_(requireAuth_(body.token), body.id, body.updates) });
      case 'deleteTransaction':
        deleteRow_(SHEETS.TRANSACTIONS, body.id);
        return respond_({ ok: true });

      case 'getTeam':
        requireAuth_(body.token);
        return respond_({ ok: true, team: getTeam_() });
      case 'addTeamMember': {
        const user = requireAuth_(body.token);
        return respond_({ ok: true, member: addTeamMember_(user, body.member) });
      }
      case 'changePassword':
        return respond_(changePassword_(requireAuth_(body.token), body.oldPassword, body.newPassword));

      case 'getSummary':
        requireAuth_(body.token);
        return respond_({ ok: true, summary: getSummary_() });

      default:
        return respond_({ ok: false, error: 'Unknown action: ' + action });
    }
  } catch (err) {
    return respond_({ ok: false, error: err.message });
  }
}

// ---------- AUTH ----------

function login_(username, password) {
  const users = readRows_(SHEETS.USERS);
  const user = users.find((u) => u.username === username && u.active !== false && u.active !== 'FALSE');
  if (!user || user.passwordHash !== hashPassword_(password)) {
    return { ok: false, error: 'Incorrect username or password.' };
  }
  const token = Utilities.getUuid() + '.' + Utilities.getUuid();
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_LIFETIME_MS);
  getSheet_(SHEETS.SESSIONS).appendRow([token, user.id, now.toISOString(), expires.toISOString()]);
  return {
    ok: true,
    token,
    user: { id: user.id, name: user.name, username: user.username, role: user.role },
  };
}

function logout_(token) {
  deleteRow_(SHEETS.SESSIONS, token, 'token');
  return { ok: true };
}

function requireAuth_(token) {
  if (!token) throw new Error('Not logged in.');
  const sessions = readRows_(SHEETS.SESSIONS);
  const session = sessions.find((s) => s.token === token);
  if (!session) throw new Error('Session expired. Please log in again.');
  if (new Date(session.expiresAt) < new Date()) throw new Error('Session expired. Please log in again.');
  const users = readRows_(SHEETS.USERS);
  const user = users.find((u) => u.id === session.userId);
  if (!user) throw new Error('User not found.');
  return { id: user.id, name: user.name, username: user.username, role: user.role };
}

function hashPassword_(password) {
  const digest = Utilities.computeHmacSha256Signature(password, SECRET_KEY);
  return digest.map((b) => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

// ---------- CLIENTS ----------

function getClients_() {
  return readRows_(SHEETS.CLIENTS).sort((a, b) => (a.viewingDate < b.viewingDate ? 1 : -1));
}

function addClient_(user, client) {
  const row = {
    id: Utilities.getUuid(),
    name: client.name || '',
    phone: client.phone || '',
    property: client.property || '',
    viewingDate: client.viewingDate || '',
    viewingTime: client.viewingTime || '',
    agent: client.agent || user.name,
    status: client.status || 'Scheduled',
    fee: client.fee || 0,
    feePaid: !!client.feePaid,
    notes: client.notes || '',
    createdAt: new Date().toISOString(),
    createdBy: user.name,
    updatedAt: new Date().toISOString(),
  };
  appendRow_(SHEETS.CLIENTS, row);
  return row;
}

function updateClient_(user, id, updates) {
  updates.updatedAt = new Date().toISOString();
  return updateRow_(SHEETS.CLIENTS, id, updates);
}

// ---------- TRANSACTIONS (Expenses & Earnings) ----------

function getTransactions_() {
  return readRows_(SHEETS.TRANSACTIONS).sort((a, b) => (a.date < b.date ? 1 : -1));
}

function addTransaction_(user, tx) {
  const row = {
    id: Utilities.getUuid(),
    date: tx.date || new Date().toISOString().slice(0, 10),
    type: tx.type || 'Expense', // "Expense" | "Earning"
    category: tx.category || 'Other',
    amount: Number(tx.amount) || 0,
    relatedClient: tx.relatedClient || '',
    agent: tx.agent || user.name,
    notes: tx.notes || '',
    createdAt: new Date().toISOString(),
    createdBy: user.name,
  };
  appendRow_(SHEETS.TRANSACTIONS, row);
  return row;
}

function updateTransaction_(user, id, updates) {
  return updateRow_(SHEETS.TRANSACTIONS, id, updates);
}

function getSummary_() {
  const txs = readRows_(SHEETS.TRANSACTIONS);
  let earnings = 0;
  let expenses = 0;
  const byCategory = {};
  txs.forEach((t) => {
    const amt = Number(t.amount) || 0;
    if (t.type === 'Earning') earnings += amt;
    else expenses += amt;
    const key = t.type + ':' + t.category;
    byCategory[key] = (byCategory[key] || 0) + amt;
  });

  const clients = readRows_(SHEETS.CLIENTS);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = clients
    .filter((c) => c.viewingDate >= today && c.status === 'Scheduled')
    .sort((a, b) => (a.viewingDate > b.viewingDate ? 1 : -1))
    .slice(0, 10);

  return {
    earnings,
    expenses,
    net: earnings - expenses,
    byCategory,
    upcomingViewings: upcoming,
    totalClients: clients.length,
  };
}

// ---------- TEAM ----------

function getTeam_() {
  return readRows_(SHEETS.USERS).map((u) => ({
    id: u.id, name: u.name, username: u.username, role: u.role, active: u.active,
  }));
}

function addTeamMember_(user, member) {
  if (user.role !== 'admin') throw new Error('Only an admin can add team members.');
  const row = {
    id: Utilities.getUuid(),
    name: member.name,
    username: member.username,
    passwordHash: hashPassword_(member.password || 'changeme123'),
    role: member.role || 'agent',
    active: true,
    createdAt: new Date().toISOString(),
  };
  appendRow_(SHEETS.USERS, row);
  return { id: row.id, name: row.name, username: row.username, role: row.role };
}

function changePassword_(user, oldPassword, newPassword) {
  const users = readRows_(SHEETS.USERS);
  const record = users.find((u) => u.id === user.id);
  if (!record || record.passwordHash !== hashPassword_(oldPassword)) {
    return { ok: false, error: 'Current password is incorrect.' };
  }
  updateRow_(SHEETS.USERS, user.id, { passwordHash: hashPassword_(newPassword) });
  return { ok: true };
}

// ---------- SHEET HELPERS ----------

function getSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Sheet "' + name + '" not found. Run setup() first.');
  return sheet;
}

function readRows_(name) {
  const sheet = getSheet_(name);
  const values = sheet.getDataRange().getValues();
  const headers = values.shift();
  return values
    .filter((row) => row.some((cell) => cell !== ''))
    .map((row) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] instanceof Date ? row[i].toISOString() : row[i];
      });
      return obj;
    });
}

function appendRow_(name, obj) {
  const sheet = getSheet_(name);
  const headers = HEADERS[name];
  sheet.appendRow(headers.map((h) => (obj[h] !== undefined ? obj[h] : '')));
}

function updateRow_(name, id, updates) {
  const sheet = getSheet_(name);
  const headers = HEADERS[name];
  const idCol = headers.indexOf('id') + (headers.indexOf('id') >= 0 ? 1 : headers.indexOf('token') + 1);
  const keyCol = headers.indexOf('id') >= 0 ? headers.indexOf('id') : headers.indexOf('token');
  const values = sheet.getDataRange().getValues();
  for (let r = 1; r < values.length; r++) {
    if (values[r][keyCol] === id) {
      const rowNum = r + 1;
      const current = {};
      headers.forEach((h, i) => (current[h] = values[r][i]));
      const merged = Object.assign(current, updates);
      sheet.getRange(rowNum, 1, 1, headers.length).setValues([headers.map((h) => merged[h])]);
      return merged;
    }
  }
  throw new Error('Record not found.');
}

function deleteRow_(name, id, keyName) {
  const sheet = getSheet_(name);
  const headers = HEADERS[name];
  const keyCol = headers.indexOf(keyName || 'id');
  const values = sheet.getDataRange().getValues();
  for (let r = 1; r < values.length; r++) {
    if (values[r][keyCol] === id) {
      sheet.deleteRow(r + 1);
      return true;
    }
  }
  return false;
}

function respond_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
