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
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/calendar', label: 'Calendar', icon: CalendarIcon },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/subjects', label: 'Subjects', icon: BookOpen },
    { to: '/focus', label: 'Focus Timer', icon: Timer },
    { to: '/history', label: 'Focus History', icon: History },
    { to: '/insights', label: 'Insights', icon: BarChart3 },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Mobile Top Bar */}
      <div className="mobile-header" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 20px',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--text-on-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '12px',
          }}>
            ✦
          </div>
          <span style={{ fontWeight: 700, fontSize: '17px', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Veyro
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          style={{ background: 'none', color: 'var(--text-primary)', padding: '6px' }}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`app-sidebar ${mobileMenuOpen ? 'open' : ''}`} style={{
        width: '240px',
        backgroundColor: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 40,
        transition: 'transform 0.25s ease',
      }}>
        {/* Brand */}
        <div style={{ padding: '28px 24px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--text-on-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '13px',
            boxShadow: '0 2px 8px rgba(82, 99, 77, 0.25)',
          }}>
            ✦
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              Veyro
            </div>
            
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--surface-sage)' : 'transparent',
                  transition: 'var(--transition)',
                })}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} color={isActive ? 'var(--text-primary)' : 'var(--text-muted)'} />
                    <span>{item.label}</span>
                    {isActive && (
                      <span style={{
                        marginLeft: 'auto',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-mustard)',
                      }} />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div style={{
          padding: '16px',
          margin: '12px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--surface-sage)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '13px',
            }}>
              {user?.name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Student'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-strong)',
              padding: '6px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-coral-soft)';
              e.currentTarget.style.color = 'var(--accent-coral-text)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="app-main-content" style={{
        flex: 1,
        marginLeft: '240px',
        padding: '40px 48px',
        minHeight: '100vh',
        maxWidth: '1440px',
      }}>
        {children}
      </main>

      {/* Floating Persistent Mini Focus Timer */}
      <MiniFocusTimer />
    </div>
  );
};
