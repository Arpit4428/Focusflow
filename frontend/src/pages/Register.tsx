import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ApiError } from '../types/auth';
import { UserPlus, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.validationErrors) {
        const firstError = Object.values(apiErr.validationErrors)[0];
        setError(firstError);
      } else {
        setError(apiErr.message || 'Registration failed. Please try again.');
      }
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
        flex: '1 1 42%',
        backgroundColor: 'var(--sage)',
        padding: 'clamp(40px, 6vw, 80px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
      }}>
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

        <div style={{ maxWidth: '400px' }}>
          <div style={{
            fontSize: '11px', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--accent)', marginBottom: '20px',
          }}>
            Join Veyro Studio
          </div>
          <h1 style={{
            fontSize: 'clamp(30px, 4vw, 48px)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            color: 'var(--text-1)',
            marginBottom: '20px',
          }}>
            Begin your focus journey.
          </h1>
          <p style={{
            fontSize: '15px',
            color: 'var(--text-2)',
            lineHeight: 1.65,
          }}>
            Set up your student profile to track tasks, log focused study sessions, and review analytical trends.
          </p>

          <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              'Structured focus sessions with subject tracking',
              'Task management with priority and deadlines',
              'Weekly insights and habit analytics',
            ].map((feat) => (
              <div key={feat} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{
                  width: '20px', height: '20px', flexShrink: 0,
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: '1px',
                }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span style={{ fontSize: '13.5px', color: 'var(--text-2)', lineHeight: 1.5 }}>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 500 }}>
          Passwords encrypted with BCrypt · Data stored securely
        </div>

        <div style={{
          position: 'absolute',
          top: '-80px', right: '-80px',
          width: '280px', height: '280px',
          borderRadius: '50%',
          backgroundColor: 'rgba(74,94,69,0.06)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* ── Right Form Panel ── */}
      <div style={{
        flex: '1 1 58%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(32px, 5vw, 80px)',
        backgroundColor: 'var(--surface)',
        minHeight: '100vh',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{
              fontSize: '26px', fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'var(--text-1)',
              marginBottom: '6px',
            }}>
              Create Account
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-2)' }}>
              Fill in your details to start tracking with Veyro.
            </p>
          </div>

          {error && (
            <div className="alert-banner alert-danger">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="Alex Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="password">Password (6+ chars)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    style={{
                      position: 'absolute', right: '10px', top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', color: 'var(--text-3)', padding: '3px',
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
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
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <UserPlus size={15} />
                </>
              )}
            </button>
          </form>

          <div style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border)',
            fontSize: '13px',
            color: 'var(--text-2)',
            textAlign: 'center',
          }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{ fontWeight: 700, color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
