import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ApiError } from '../types/auth';
import { LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg)',
      display: 'flex',
      alignItems: 'stretch',
    }}>
      {/* ── Left Brand Panel ── */}
      <div style={{
        flex: '1 1 45%',
        backgroundColor: 'var(--sage)',
        padding: 'clamp(40px, 6vw, 80px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
      }}>
        {/* Brand mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '16px' }}>V</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.02em', color: 'var(--text-1)' }}>Veyro</span>
        </div>

        {/* Hero text */}
        <div style={{ maxWidth: '420px' }}>
          <div style={{
            fontSize: '11px', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--accent)', marginBottom: '20px',
          }}>
            Academic Focus Studio
          </div>
          <h1 style={{
            fontSize: 'clamp(32px, 4.5vw, 52px)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            color: 'var(--text-1)',
            marginBottom: '20px',
          }}>
            Quiet focus for academic clarity.
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'var(--text-2)',
            lineHeight: 1.65,
            maxWidth: '360px',
          }}>
            Track study hours, reflect on progress, and build deep focus habits — all in one clean workspace.
          </p>
        </div>

        {/* Footer badges */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['Secure JWT Auth', 'MongoDB Atlas', 'Zero Clutter'].map((tag) => (
            <span key={tag} style={{
              fontSize: '11px', fontWeight: 600,
              padding: '5px 11px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(255,255,255,0.6)',
              color: 'var(--text-2)',
              border: '1px solid var(--border)',
            }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Decorative background shape */}
        <div style={{
          position: 'absolute',
          bottom: '-60px', right: '-60px',
          width: '320px', height: '320px',
          borderRadius: '50%',
          backgroundColor: 'rgba(74,94,69,0.07)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* ── Right Form Panel ── */}
      <div style={{
        flex: '1 1 55%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(32px, 5vw, 80px)',
        backgroundColor: 'var(--surface)',
        minHeight: '100vh',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '36px' }}>
            <h2 style={{
              fontSize: '28px', fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'var(--text-1)',
              marginBottom: '8px',
            }}>
              Sign in to Veyro
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.5 }}>
              Enter your credentials to resume your workspace.
            </p>
          </div>

          {error && (
            <div className="alert-banner alert-danger">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', color: 'var(--text-3)', padding: '4px',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ width: '100%', padding: '13px', fontSize: '14.5px', marginTop: '4px' }}
            >
              {isSubmitting ? (
                <>
                  <div style={{
                    width: '15px', height: '15px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <LogIn size={15} />
                </>
              )}
            </button>
          </form>

          <div style={{
            marginTop: '28px',
            paddingTop: '22px',
            borderTop: '1px solid var(--border)',
            fontSize: '13px',
            color: 'var(--text-2)',
            textAlign: 'center',
          }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{ fontWeight: 700, color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
