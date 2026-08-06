import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Wordmark from '@/brand/Wordmark';
import { useBrand } from '@/brand/BrandProvider';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/utils/constants';

const POINTS = [
  {
    icon: 'layers',
    title: 'One queue, two intake paths',
    body: 'Card chargebacks and marketplace claims in a single book, so nothing falls between two systems.',
  },
  {
    icon: 'link',
    title: 'Consolidation built in',
    body: 'Linked disputes surface before you pay the same order twice.',
  },
  {
    icon: 'clock',
    title: 'Deadlines that mean something',
    body: 'Internal due dates sit ahead of the scheme deadline, with room to fix a rejection.',
  },
];

export function Login() {
  const brand = useBrand();
  const { signIn, isAuthenticated, status, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (isAuthenticated) return <Navigate to={location.state?.from ?? ROUTES.dashboard} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await signIn({ username, password });
      navigate(location.state?.from ?? ROUTES.dashboard, { replace: true });
    } catch {
      // AuthContext surfaces the message; nothing to do here.
    }
  };

  return (
    <div className="login">
      <aside className="login__brandside">
        <Wordmark inverse size={24} />

        <div className="stack stack--loose" style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="login__headline">{brand.tagline}</h1>

          <div className="login__points">
            {POINTS.map((point) => (
              <div key={point.title} className="login__point">
                <Icon name={point.icon} size={18} style={{ color: 'var(--c-nav-active)', flex: 'none', marginTop: 2 }} />
                <span>
                  <strong style={{ color: '#fff', display: 'block' }}>{point.title}</strong>
                  <span style={{ color: 'var(--c-nav-ink-muted)' }}>{point.body}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="micro" style={{ color: 'var(--c-nav-ink-muted)', position: 'relative', zIndex: 1 }}>
          {brand.legalName} · {brand.productName}
        </p>
      </aside>

      <main className="login__form-side">
        <div className="stack stack--tight">
          <h1>Sign in</h1>
          <p className="muted small">Use your {brand.name} operator account to continue.</p>
        </div>

        <form className="stack" onSubmit={onSubmit}>
          <TextInput
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
          <TextInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            error={error ?? undefined}
          />

          <Button type="submit" variant="primary" size="lg" block disabled={status === 'authenticating'}>
            {status === 'authenticating' ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className="login__demo">
          <span className="eyebrow">Demo credentials</span>
          <div className="row row--tight" style={{ marginTop: 6 }}>
            <Icon name="user" size={14} className="faint" />
            <span className="mono">{brand.demoCredentials.username}</span>
            <span className="faint">/</span>
            <span className="mono">{brand.demoCredentials.password}</span>
          </div>
        </div>

        <p className="micro faint">
          Trouble signing in? Contact <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>.
        </p>
      </main>
    </div>
  );
}

export default Login;
