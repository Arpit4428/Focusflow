import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MiniFocusTimer } from '../focus/MiniFocusTimer';
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  Timer,
  History,
  BarChart3,
  Calendar as CalendarIcon,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
    { to: '/calendar',   label: 'Calendar',       icon: CalendarIcon },
    { to: '/tasks',      label: 'Tasks',          icon: CheckSquare },
    { to: '/subjects',   label: 'Subjects',       icon: BookOpen },
    { to: '/focus',      label: 'Focus Timer',    icon: Timer },
    { to: '/history',    label: 'Focus History',  icon: History },
    { to: '/insights',   label: 'Insights',       icon: BarChart3 },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>

      {/* ── Mobile Top Bar ── */}
      <div
        className="mobile-header"
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          height: '60px',
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '0 20px',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{
            width: '28px', height: '28px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: '13px', fontWeight: 800, lineHeight: 1 }}>V</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
            Veyro
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          style={{ background: 'none', color: 'var(--text-1)', padding: '6px' }}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ── Mobile Backdrop ── */}
      {mobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`app-sidebar ${mobileMenuOpen ? 'open' : ''}`}
        style={{
          width: '232px',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0, bottom: 0, left: 0,
          zIndex: 40,
          transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Brand */}
        <div style={{ padding: '24px 20px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px', height: '30px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 800, lineHeight: 1 }}>V</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '17px', letterSpacing: '-0.03em', color: 'var(--text-1)', lineHeight: 1 }}>
              Veyro
            </div>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-3)', textTransform: 'uppercase', marginTop: '2px' }}>
              Focus Studio
            </div>
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '0 20px' }} />

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13.5px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--text-1)' : 'var(--text-2)',
                  backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
                  transition: 'var(--transition)',
                  textDecoration: 'none',
                  position: 'relative',
                })}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span style={{
                        position: 'absolute',
                        left: 0,
                        top: '6px',
                        bottom: '6px',
                        width: '3px',
                        borderRadius: '0 3px 3px 0',
                        backgroundColor: 'var(--accent)',
                      }} />
                    )}
                    <Icon size={16} color={isActive ? 'var(--accent)' : 'var(--text-3)'} strokeWidth={isActive ? 2.2 : 1.8} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '0 20px' }} />

        {/* User Footer */}
        <div style={{ padding: '14px 16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '32px', height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--sage)',
              border: '1.5px solid var(--border-strong)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)',
              fontWeight: 700,
              fontSize: '13px',
              flexShrink: 0,
            }}>
              {user?.name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{
                fontSize: '13px', fontWeight: 600,
                color: 'var(--text-1)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user?.name || 'Student'}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'var(--text-3)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user?.email}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              backgroundColor: 'transparent',
              color: 'var(--text-3)',
              border: '1px solid var(--border)',
              padding: '7px',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--coral-light)';
              e.currentTarget.style.color = 'var(--coral-text)';
              e.currentTarget.style.borderColor = 'rgba(232,123,106,0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-3)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main
        className="app-main-content"
        style={{
          flex: 1,
          marginLeft: '232px',
          padding: '40px 48px',
          minHeight: '100vh',
          maxWidth: '1600px',
          animation: 'fadeIn 0.25s ease-out',
        }}
      >
        {children}
      </main>

      {/* ── Floating Mini Focus Timer ── */}
      <MiniFocusTimer />
    </div>
  );
};
