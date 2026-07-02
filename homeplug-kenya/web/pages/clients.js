import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Modal from '../components/Modal';

const STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'No-show'];

const EMPTY_FORM = {
  name: '',
  phone: '',
  property: '',
  viewingDate: '',
  viewingTime: '',
  agent: '',
  status: 'Scheduled',
  fee: '',
  feePaid: false,
  notes: '',
};

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return d;
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function badgeClass(status) {
  return 'badge badge-' + status.toLowerCase().replace(' ', '-');
}

export default function Clients() {
  const [clients, setClients] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('All');

  function load() {
    api
      .getClients()
      .then((data) => setClients(data.clients))
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(client) {
    setEditing(client);
    setForm({ ...EMPTY_FORM, ...client, fee: client.fee || '' });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api.updateClient(editing.id, form);
      } else {
        await api.addClient(form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(client) {
    if (!confirm(`Remove ${client.name} from the list?`)) return;
    try {
      await api.deleteClient(client.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const visible = clients && (filter === 'All' ? clients : clients.filter((c) => c.status === filter));

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Clients &amp; Viewings</h1>
          <div className="page-subtitle">Every client contact and when they're due to view a house.</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add client
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {clients && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['All', ...STATUSES].map((s) => (
            <button
              key={s}
              className="btn btn-ghost btn-sm"
              style={filter === s ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {!clients && !error && <div className="loading-text">Loading…</div>}

      {visible && visible.length === 0 && (
        <div className="empty-state">No clients here yet. Add one to get started.</div>
      )}

      {visible && visible.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Phone</th>
                <th>Property</th>
                <th>Viewing</th>
                <th>Agent</th>
                <th>Status</th>
                <th>Fee</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td className="mono">{c.phone}</td>
                  <td>{c.property || '—'}</td>
                  <td className="mono">
                    {formatDate(c.viewingDate)} {c.viewingTime && `· ${c.viewingTime}`}
                  </td>
                  <td>{c.agent}</td>
                  <td>
                    <span className={badgeClass(c.status)}>{c.status}</span>
                  </td>
                  <td className="mono">
                    {c.fee ? `KSh ${Number(c.fee).toLocaleString('en-KE')}` : '—'}
                    {c.fee && !c.feePaid && (
                      <span style={{ color: 'var(--expense)', marginLeft: 5, fontSize: 11 }}>unpaid</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>
                      Edit
                    </button>{' '}
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit client' : 'Add client'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-grid">
              <div className="field">
                <label>Client name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="field">
                <label>Phone</label>
                <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>

            <div className="field">
              <label>Property / listing</label>
              <input
                placeholder="e.g. 2BR Kilimani, Ngong Rd apartment"
                value={form.property}
                onChange={(e) => setForm({ ...form, property: e.target.value })}
              />
            </div>

            <div className="form-grid">
              <div className="field">
                <label>Viewing date</label>
                <input
                  type="date"
                  value={form.viewingDate}
                  onChange={(e) => setForm({ ...form, viewingDate: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Viewing time</label>
                <input
                  type="time"
                  value={form.viewingTime}
                  onChange={(e) => setForm({ ...form, viewingTime: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>Agent assigned</label>
                <input value={form.agent} onChange={(e) => setForm({ ...form, agent: e.target.value })} />
              </div>
              <div className="field">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>Viewing fee (KSh)</label>
                <input
                  type="number"
                  min="0"
                  value={form.fee}
                  onChange={(e) => setForm({ ...form, fee: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Fee paid?</label>
                <select
                  value={form.feePaid ? 'yes' : 'no'}
                  onChange={(e) => setForm({ ...form, feePaid: e.target.value === 'yes' })}
                >
                  <option value="no">Not yet</option>
                  <option value="yes">Paid</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>Notes</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add client'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
