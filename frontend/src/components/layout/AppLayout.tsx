import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { MiniFocusTimer } from '../focus/MiniFocusTimer';
import {
  Sun,
  Moon,
  Monitor,
  LogOut,
  Menu,
  X,
  Search,
  Timer,
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/tasks',     label: 'Tasks' },
    { to: '/subjects',  label: 'Subjects' },
    { to: '/focus',     label: 'Focus Timer' },
    { to: '/calendar',  label: 'Calendar' },
    { to: '/insights',  label: 'Insights' },
    { to: '/history',   label: 'History' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>
      {/* ═══════════════════════════════════════════════════════════════
          MINIMAL HORIZONTAL NAVIGATION BAR (Inspired by Reference)
          ═══════════════════════════════════════════════════════════════ */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'var(--surface-overlay)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          transition: 'var(--transition-theme)',
        }}
      >
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            padding: '0 28px',
            height: '62px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
          }}
        >
          {/* ── Left: Brand & Primary Horizontal Navigation ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            {/* Logo Mark */}
            <NavLink
              to="/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '5px',
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-inverse)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  fontWeight: 800,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                ✦
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 800,
                  fontSize: '15px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-primary)',
                }}
              >
                VEYRO
              </span>
            </NavLink>

            {/* Desktop Navigation Links */}
            <nav
              className="desktop-nav"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '12px',
                      fontWeight: isActive ? 600 : 500,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: isActive ? 'var(--surface-hover)' : 'transparent',
                      border: isActive ? '1px solid var(--border)' : '1px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* ── Right: Search, Theme Switcher Pill, Profile ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Quick Action: Search trigger pill (like reference) */}
            <button
              onClick={() => navigate('/tasks')}
              title="Search coursework tasks"
              className="nav-search-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '9999px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                fontSize: '12px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Search size={13} />
              <span>SEARCH</span>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  padding: '1px 5px',
                  borderRadius: '3px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                ⌘K
              </span>
            </button>

            {/* Reference-Style Theme Toggle Switch Pill: [ ☀️ 🖥️ 🌙 ] */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: '9999px',
                padding: '2px',
              }}
              title={`Current theme: ${theme} (${resolvedTheme})`}
            >
              <button
                type="button"
                onClick={() => setTheme('light')}
                aria-label="Light mode"
                style={{
                  width: '26px',
                  height: '24px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme === 'light' ? 'var(--text-primary)' : 'var(--text-muted)',
                  backgroundColor: theme === 'light' ? 'var(--surface)' : 'transparent',
                  boxShadow: theme === 'light' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Sun size={13} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                aria-label="System theme"
                style={{
                  width: '26px',
                  height: '24px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme === 'system' ? 'var(--text-primary)' : 'var(--text-muted)',
                  backgroundColor: theme === 'system' ? 'var(--surface)' : 'transparent',
                  boxShadow: theme === 'system' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Monitor size={12} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                aria-label="Dark mode"
                style={{
                  width: '26px',
                  height: '24px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme === 'dark' ? 'var(--text-primary)' : 'var(--text-muted)',
                  backgroundColor: theme === 'dark' ? 'var(--surface)' : 'transparent',
                  boxShadow: theme === 'dark' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Moon size={12} strokeWidth={2} />
              </button>
            </div>

            {/* Focus Timer Quick Shortcut */}
            <button
              onClick={() => navigate('/focus')}
              className="btn btn-outline"
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Open Focus Timer"
            >
              <Timer size={13} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em' }}>TIMER</span>
            </button>

            {/* User Profile Pill / Logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 10px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '9999px',
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-olive)',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || 'S'}
                </div>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    maxWidth: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user?.name?.split(' ')[0] || 'Student'}
                </span>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  aria-label="Sign Out"
                  style={{
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-coral)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <LogOut size={12} />
                </button>
              </div>
            </div>

            {/* Mobile Menu Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-nav-toggle"
              aria-label="Toggle navigation"
              style={{
                color: 'var(--text-primary)',
                padding: '6px',
              }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ── Mobile Navigation Drawer ── */}
        {mobileMenuOpen && (
          <div
            style={{
              padding: '16px 24px 24px',
              backgroundColor: 'var(--surface)',
              borderBottom: '1px solid var(--border-strong)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    backgroundColor: isActive ? 'var(--surface-hover)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    border: isActive ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <span>{item.label}</span>
                  {isActive && <span style={{ color: 'var(--accent-amber)' }}>✦</span>}
                </NavLink>
              );
            })}
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN APPLICATION CANVAS (Asymmetric & Editorial Spacing)
          ═══════════════════════════════════════════════════════════════ */}
      <main
        style={{
          flex: 1,
          maxWidth: '1440px',
          width: '100%',
          margin: '0 auto',
          padding: '48px 32px 96px',
        }}
      >
        {children}
      </main>

      {/* Persistent Mini Focus Timer Pill */}
      <MiniFocusTimer />

      {/* Responsive Styles helper */}
      <style>{`
        @media (max-width: 960px) {
          .desktop-nav { display: none !important; }
          .nav-search-btn { display: none !important; }
          .mobile-nav-toggle { display: block !important; }
        }
        @media (min-width: 961px) {
          .mobile-nav-toggle { display: none !important; }
        }
      `}</style>
    </div>
  );
};
