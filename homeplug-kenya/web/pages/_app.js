import { useRouter } from 'next/router';
import { AuthProvider, useAuth } from '../lib/AuthContext';
import Layout from '../components/Layout';
import '../styles/globals.css';

function Shell({ children }) {
  const router = useRouter();
  const { ready, user } = useAuth();

  if (router.pathname === '/login') return children;
  if (!ready) return <div className="loading-text" style={{ padding: 40 }}>Loading…</div>;
  if (!user) return null;

  return <Layout>{children}</Layout>;
}

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Shell>
        <Component {...pageProps} />
      </Shell>
    </AuthProvider>
  );
}
