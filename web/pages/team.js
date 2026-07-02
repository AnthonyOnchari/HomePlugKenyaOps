import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import Modal from '../components/Modal';

export default function Team() {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'agent' });
  const [saving, setSaving] = useState(false);

  const [showPw, setShowPw] = useState(false);
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);

  function load() {
    api
      .getTeam()
      .then((data) => setTeam(data.team))
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.addTeamMember(form);
      setShowAdd(false);
      setForm({ name: '', username: '', password: '', role: 'agent' });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwSaving(true);
    setError('');
    setNotice('');
    try {
      await api.changePassword(pwForm.oldPassword, pwForm.newPassword);
      setNotice('Password updated.');
      setShowPw(false);
      setPwForm({ oldPassword: '', newPassword: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Team</h1>
          <div className="page-subtitle">Who has access to the console.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setShowPw(true)}>
            Change my password
          </button>
          {user?.role === 'admin' && (
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              + Add team member
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {notice && (
        <div className="card" style={{ marginBottom: 16, color: 'var(--earning)', borderColor: 'rgba(61,190,108,0.3)' }}>
          {notice}
        </div>
      )}

      {!team && !error && <div className="loading-text">Loading…</div>}

      {team && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {team.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td className="mono">{m.username}</td>
                  <td style={{ textTransform: 'capitalize' }}>{m.role}</td>
                  <td>
                    <span className={m.active === false || m.active === 'FALSE' ? 'badge badge-cancelled' : 'badge badge-completed'}>
                      {m.active === false || m.active === 'FALSE' ? 'Inactive' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {user?.role !== 'admin' && (
        <p className="page-subtitle" style={{ marginTop: 14 }}>
          Only an admin can add new team members. Ask your admin if you need an account added.
        </p>
      )}

      {showAdd && (
        <Modal title="Add team member" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
              <label>Full name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Username</label>
              <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div className="field">
              <label>Temporary password</label>
              <input
                required
                placeholder="They should change this after first login"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Adding…' : 'Add member'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showPw && (
        <Modal title="Change my password" onClose={() => setShowPw(false)}>
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
              <label>Current password</label>
              <input
                type="password"
                required
                value={pwForm.oldPassword}
                onChange={(e) => setPwForm({ ...pwForm, oldPassword: e.target.value })}
              />
            </div>
            <div className="field">
              <label>New password</label>
              <input
                type="password"
                required
                minLength={6}
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowPw(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={pwSaving}>
                {pwSaving ? 'Saving…' : 'Update password'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
