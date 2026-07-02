import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';

function formatKES(n) {
  return 'KSh ' + Number(n || 0).toLocaleString('en-KE');
}

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return d;
  return date.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function Overview() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getSummary()
      .then((data) => setSummary(data.summary))
      .catch((err) => setError(err.message));
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Overview</h1>
          <div className="page-subtitle">Where things stand today across the team.</div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {!summary && !error && <div className="loading-text">Loading…</div>}

      {summary && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Total earnings</div>
              <div className="stat-value earning mono">{formatKES(summary.earnings)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total expenses</div>
              <div className="stat-value expense mono">{formatKES(summary.expenses)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Net</div>
              <div className={`stat-value mono ${summary.net >= 0 ? 'earning' : 'expense'}`}>
                {formatKES(summary.net)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Clients on record</div>
              <div className="stat-value accent mono">{summary.totalClients}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 20 }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 15 }}>Upcoming viewings</h2>
                <Link href="/clients" className="btn btn-ghost btn-sm">
                  Manage clients
                </Link>
              </div>

              {summary.upcomingViewings.length === 0 && (
                <div className="empty-state">No scheduled viewings coming up. Add one from Clients &amp; Viewings.</div>
              )}

              {summary.upcomingViewings.length > 0 && (
                <div className="timeline">
                  {summary.upcomingViewings.map((c) => (
                    <div key={c.id} className={`timeline-item ${c.viewingDate === today ? 'is-today' : ''}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <strong>{c.name}</strong>
                          <div className="page-subtitle" style={{ margin: '2px 0 0' }}>
                            {c.property || 'Property not set'} · Agent: {c.agent}
                          </div>
                        </div>
                        <div className="mono" style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {formatDate(c.viewingDate)} {c.viewingTime && `· ${c.viewingTime}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
