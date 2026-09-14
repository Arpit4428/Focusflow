import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ApiError } from '../types/auth';
import { LogIn, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      backgroundColor: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1020px',
        minHeight: '620px',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        overflow: 'hidden',
      }}>
        {/* Left Hero / Brand Showcase */}
        <div style={{
          backgroundColor: 'var(--surface-sage)',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(251, 249, 243, 0.85)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '32px',
            }}>
              <span style={{ color: 'var(--text-primary)' }}>✦</span>
              <span>Academic Focus Studio</span>
            </div>

            <h2 style={{
              fontSize: 'clamp(32px, 4vw, 42px)',
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              marginBottom: '16px',
            }}>
              Quiet Focus for Academic Clarity
            </h2>

            <p style={{
              fontSize: '15px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              maxWidth: '380px',
            }}>
              Track study hours, reflect on progress, and build deep study habits with zero clutter.
            </p>
          </div>

          <div style={{
            marginTop: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
            }} />
            
          </div>
        </div>

        {/* Right Form Container */}
        <div style={{
          padding: '52px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: 'var(--surface)',
        }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              marginBottom: '8px',
            }}>
              Sign in to Veyro
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Enter your student credentials to resume your workspace.
            </p>
          </div>

          {error && (
            <div className="alert-banner alert-danger">
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '12px',
                fontSize: '15px',
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(251,249,243,0.3)',
                    borderTopColor: '#FBF9F3',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <LogIn size={16} />
                </>
              )}
            </button>
          </form>

          <div style={{
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
          }}>
            Don't have an account yet?{' '}
            <Link to="/register" style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'underline' }}>
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

