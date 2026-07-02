import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../lib/AuthContext';
import PlugMark from './PlugMark';

const LINKS = [
  { href: '/', label: 'Overview' },
  { href: '/clients', label: 'Clients & Viewings' },
  { href: '/expenses', label: 'Expenses & Earnings' },
  { href: '/team', label: 'Team' },
];

export default function Layout({ children }) {
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <PlugMark />
          <div className="brand-text">
            Home Plug Kenya
            <span>Team console</span>
          </div>
        </div>

        <nav className="nav">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${router.pathname === link.href ? 'active' : ''}`}
            >
              <span className="nav-dot" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{initials}</div>
            <div>
              <div className="user-name">{user.name}</div>
              <div className="user-role">{user.role}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="main">{children}</main>
    </div>
  );
}
