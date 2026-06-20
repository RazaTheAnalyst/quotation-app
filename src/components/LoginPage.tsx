import { useState } from 'react';
import { useAuth } from '../auth';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn(email, password);
    if (result.error) setError(result.error);

    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-orb login-bg-orb-1" />
        <div className="login-bg-orb login-bg-orb-2" />
        <div className="login-bg-orb login-bg-orb-3" />
      </div>

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">{'\uD83D\uDE9B'}</div>
        </div>

        <h1 className="login-title">Quotation Manager</h1>
        <p className="login-subtitle">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="email">Email</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">{'\uD83D\uDCE7'}</span>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">{'\uD83D\uDD10'}</span>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && <div className="login-error">{'\u26A0\uFE0F'} {error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <span className="login-btn-spinner" /> : 'Sign In'}
          </button>
        </form>

        <div className="login-credit">Engineered by Ali Raza</div>
      </div>
    </div>
  );
}
