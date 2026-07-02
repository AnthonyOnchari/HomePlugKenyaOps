import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import Modal from '../components/Modal';

const EXPENSE_CATEGORIES = ['Transport', 'Airtime & Data', 'Marketing/Ads', 'Printing', 'Office', 'Other'];
const EARNING_CATEGORIES = ['Viewing Fee', 'Commission', 'Other Income'];

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  type: 'Expense',
  category: EXPENSE_CATEGORIES[0],
  amount: '',
  relatedClient: '',
  agent: '',
  notes: '',
};

function formatKES(n) {
  return 'KSh ' + Number(n || 0).toLocaleString('en-KE');
}

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return d;
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Expenses() {
  const [txs, setTxs] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('All');

  function load() {
    api
      .getTransactions()
      .then((data) => setTxs(data.transactions))
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  function openAdd(type) {
    setForm({ ...EMPTY_FORM, type, category: type === 'Expense' ? EXPENSE_CATEGORIES[0] : EARNING_CATEGORIES[0] });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.addTransaction(form);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(tx) {
    if (!confirm('Delete this entry?')) return;
    try {
      await api.deleteTransaction(tx.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const visible = txs && (filter === 'All' ? txs : txs.filter((t) => t.type === filter));

  const totals = useMemo(() => {
    if (!txs) return null;
    const earnings = txs.filter((t) => t.type === 'Earning').reduce((s, t) => s + Number(t.amount || 0), 0);
    const expenses = txs.filter((t) => t.type === 'Expense').reduce((s, t) => s + Number(t.amount || 0), 0);
    return { earnings, expenses, net: earnings - expenses };
  }, [txs]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Expenses &amp; Earnings</h1>
          <div className="page-subtitle">Transport, ads, and other costs — against viewing fees and commissions.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => openAdd('Expense')}>
            + Expense
          </button>
          <button className="btn btn-primary" onClick={() => openAdd('Earning')}>
            + Earning
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {totals && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Earnings</div>
            <div className="stat-value earning mono">{formatKES(totals.earnings)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Expenses</div>
            <div className="stat-value expense mono">{formatKES(totals.expenses)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Net</div>
            <div className={`stat-value mono ${totals.net >= 0 ? 'earning' : 'expense'}`}>{formatKES(totals.net)}</div>
          </div>
        </div>
      )}

      {txs && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['All', 'Earning', 'Expense'].map((f) => (
            <button
              key={f}
              className="btn btn-ghost btn-sm"
              style={filter === f ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
              onClick={() => setFilter(f)}
            >
              {f === 'All' ? 'All' : f + 's'}
            </button>
          ))}
        </div>
      )}

      {!txs && !error && <div className="loading-text">Loading…</div>}

      {visible && visible.length === 0 && <div className="empty-state">No entries yet.</div>}

      {visible && visible.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Related client</th>
                <th>Agent</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => (
                <tr key={t.id}>
                  <td className="mono">{formatDate(t.date)}</td>
                  <td>
                    <span className={`badge badge-${t.type.toLowerCase()}`}>{t.type}</span>
                  </td>
                  <td>{t.category}</td>
                  <td className={`mono ${t.type === 'Earning' ? '' : ''}`} style={{ color: t.type === 'Earning' ? 'var(--earning)' : 'var(--expense)' }}>
                    {t.type === 'Earning' ? '+' : '-'}
                    {formatKES(t.amount)}
                  </td>
                  <td>{t.relatedClient || '—'}</td>
                  <td>{t.agent}</td>
                  <td style={{ whiteSpace: 'normal', maxWidth: 220 }}>{t.notes || '—'}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={`Add ${form.type.toLowerCase()}`} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-grid">
              <div className="field">
                <label>Type</label>
                <select
                  value={form.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    setForm({ ...form, type, category: type === 'Expense' ? EXPENSE_CATEGORIES[0] : EARNING_CATEGORIES[0] });
                  }}
                >
                  <option value="Expense">Expense</option>
                  <option value="Earning">Earning</option>
                </select>
              </div>
              <div className="field">
                <label>Date</label>
                <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {(form.type === 'Expense' ? EXPENSE_CATEGORIES : EARNING_CATEGORIES).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Amount (KSh)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>Related client (optional)</label>
                <input value={form.relatedClient} onChange={(e) => setForm({ ...form, relatedClient: e.target.value })} />
              </div>
              <div className="field">
                <label>Agent</label>
                <input
                  placeholder="Defaults to you"
                  value={form.agent}
                  onChange={(e) => setForm({ ...form, agent: e.target.value })}
                />
              </div>
            </div>

            <div className="field">
              <label>Notes</label>
              <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save entry'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
