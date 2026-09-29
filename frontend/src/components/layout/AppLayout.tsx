import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { MiniFocusTimer } from '../focus/MiniFocusTimer';
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  Timer,
  CalendarDays,
  ChartNoAxesCombined,
  History,
  Sun,
  Moon,
  Monitor,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('veyro_sidebar_collapsed') === 'true';
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('veyro_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
    { to: '/tasks',     label: 'Tasks',       icon: CheckSquare },
    { to: '/subjects',  label: 'Subjects',    icon: BookOpen },
    { to: '/focus',     label: 'Focus Timer', icon: Timer },
    { to: '/calendar',  label: 'Calendar',    icon: CalendarDays },
    { to: '/insights',  label: 'Insights',    icon: ChartNoAxesCombined },
    { to: '/history',   label: 'History',     icon: History },
  ];

  // Cycling theme handler for collapsed mode
  const cycleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  const currentThemeIcon = () => {
    if (theme === 'system') {
      return <Monitor size={15} strokeWidth={1.8} />;
    }
    return resolvedTheme === 'dark' ? (
      <Moon size={15} strokeWidth={1.8} />
    ) : (
      <Sun size={15} strokeWidth={1.8} />
    );
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>
      {/* ═══════════════════════════════════════════════════════════════
          MOBILE TOP BAR (Visible only on screens <= 860px)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="mobile-header">
        <NavLink
          to="/dashboard"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-inverse)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            ✦
          </div>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 800,
              fontSize: '14px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
            }}
          >
            VEYRO
          </span>
        </NavLink>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={cycleTheme}
            aria-label="Cycle theme"
            className="theme-cycle-btn"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-btn)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {currentThemeIcon()}
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation drawer"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-btn)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MOBILE BACKDROP OVERLAY
          ═══════════════════════════════════════════════════════════════ */}
      {mobileOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PERSISTENT VERTICAL SIDEBAR
          ═══════════════════════════════════════════════════════════════ */}
      <aside
        className={`app-sidebar ${collapsed ? 'is-collapsed' : 'is-expanded'} ${mobileOpen ? 'is-mobile-open' : ''}`}
        aria-label="Primary navigation"
      >
        {/* ── Top: Logo & Collapse Button ── */}
        <div
          style={{
            height: '64px',
            padding: collapsed ? '0 12px' : '0 16px 0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            flexShrink: 0,
          }}
        >
          <NavLink
            to="/dashboard"
            title="Veyro Dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-inverse)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                fontWeight: 800,
                boxShadow: 'var(--shadow-sm)',
                flexShrink: 0,
              }}
            >
              ✦
            </div>
            {!collapsed && (
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 800,
                  fontSize: '14px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                }}
              >
                VEYRO
              </span>
            )}
          </NavLink>

          {/* Desktop collapse toggle button */}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="sidebar-collapse-btn"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-btn)',
              display: collapsed ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              border: '1px solid transparent',
              transition: 'var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <PanelLeftClose size={15} strokeWidth={1.8} />
          </button>
        </div>

        {/* When collapsed on desktop: small expand button row below logo */}
        {collapsed && (
          <div
            className="sidebar-expand-row"
            style={{
              padding: '8px 0',
              display: 'flex',
              justifyContent: 'center',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={toggleCollapsed}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-btn)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <PanelLeft size={16} strokeWidth={1.8} />
            </button>
          </div>
        )}

        {/* ── Middle: Navigation Links ── */}
        <nav
          style={{
            flex: 1,
            padding: collapsed ? '14px 8px' : '14px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            overflowY: 'auto',
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: collapsed ? '0' : '12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '9px 0' : '9px 12px',
                  borderRadius: 'var(--radius-btn)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  backgroundColor: isActive ? 'var(--surface-hover)' : 'transparent',
                  border: isActive ? '1px solid var(--border)' : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  overflow: 'hidden',
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
                {/* Subtle active left marker (not a large colorful pill) */}
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      left: '0px',
                      top: '7px',
                      bottom: '7px',
                      width: '3px',
                      borderRadius: '0 2px 2px 0',
                      backgroundColor: 'var(--accent)',
                    }}
                  />
                )}

                <Icon
                  size={17}
                  strokeWidth={isActive ? 2.1 : 1.75}
                  style={{
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                />

                {!collapsed && (
                  <span
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ── Bottom Section: Theme Switcher & User Profile ── */}
        <div
          style={{
            padding: collapsed ? '12px 8px' : '14px 12px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            flexShrink: 0,
            backgroundColor: 'var(--surface)',
          }}
        >
          {/* Theme Selector */}
          {!collapsed ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '3px',
                borderRadius: 'var(--radius-btn)',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
              }}
              title={`Current theme: ${theme} (${resolvedTheme})`}
            >
              <button
                type="button"
                onClick={() => setTheme('light')}
                aria-label="Light mode"
                style={{
                  flex: 1,
                  height: '26px',
                  borderRadius: 'calc(var(--radius-btn) - 3px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: theme === 'light' ? 'var(--text-primary)' : 'var(--text-muted)',
                  backgroundColor: theme === 'light' ? 'var(--surface)' : 'transparent',
                  boxShadow: theme === 'light' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Sun size={12} strokeWidth={2} />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                aria-label="System theme"
                style={{
                  flex: 1,
                  height: '26px',
                  borderRadius: 'calc(var(--radius-btn) - 3px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: theme === 'system' ? 'var(--text-primary)' : 'var(--text-muted)',
                  backgroundColor: theme === 'system' ? 'var(--surface)' : 'transparent',
                  boxShadow: theme === 'system' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Monitor size={12} strokeWidth={2} />
                <span>Auto</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                aria-label="Dark mode"
                style={{
                  flex: 1,
                  height: '26px',
                  borderRadius: 'calc(var(--radius-btn) - 3px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: theme === 'dark' ? 'var(--text-primary)' : 'var(--text-muted)',
                  backgroundColor: theme === 'dark' ? 'var(--surface)' : 'transparent',
                  boxShadow: theme === 'dark' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Moon size={12} strokeWidth={2} />
                <span>Dark</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={cycleTheme}
                title={`Theme: ${theme} (Click to change)`}
                aria-label="Cycle theme"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-btn)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {currentThemeIcon()}
              </button>
            </div>
          )}

          {/* User Profile Card / Sign Out */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              padding: collapsed ? '6px 0' : '6px 8px',
              borderRadius: 'var(--radius-btn)',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--accent-olive)',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'S'}
              </div>

              {!collapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user?.name || 'Student'}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user?.email || 'Signed in'}
                  </span>
                </div>
              )}
            </div>

            {!collapsed ? (
              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                aria-label="Sign Out"
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  border: 'none',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--accent-coral)';
                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <LogOut size={13} strokeWidth={1.8} />
              </button>
            ) : null}
          </div>

          {/* When collapsed: explicit small logout button below avatar */}
          {collapsed && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                aria-label="Sign Out"
                style={{
                  width: '34px',
                  height: '28px',
                  borderRadius: 'var(--radius-btn)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--accent-coral)';
                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <LogOut size={14} strokeWidth={1.8} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN APPLICATION CANVAS (Non-overlapping with Sidebar)
          ═══════════════════════════════════════════════════════════════ */}
      <div
        className={`app-main-wrapper ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}
      >
        <main
          style={{
            maxWidth: '1440px',
            width: '100%',
            margin: '0 auto',
            padding: '36px 36px 84px',
          }}
        >
          {children}
        </main>
      </div>

      {/* Persistent Mini Focus Timer Pill */}
      <MiniFocusTimer />

      {/* ═══════════════════════════════════════════════════════════════
          RESPONSIVE & SIDEBAR STYLES
          ═══════════════════════════════════════════════════════════════ */}
      <style>{`
        /* Sidebar styling */
        .app-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 100;
          background-color: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          transition: width 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .app-sidebar.is-expanded {
          width: 240px;
        }

        .app-sidebar.is-collapsed {
          width: 68px;
        }

        /* Main content wrapper margins to avoid overlap */
        .app-main-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          transition: margin-left 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .app-main-wrapper.sidebar-expanded {
          margin-left: 240px;
        }

        .app-main-wrapper.sidebar-collapsed {
          margin-left: 68px;
        }

        /* Mobile header and drawer behaviors */
        .mobile-header {
          display: none;
        }

        .mobile-backdrop {
          display: none;
        }

        @media (max-width: 860px) {
          .mobile-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 56px;
            background-color: var(--surface-overlay);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            z-index: 110;
          }

          .app-sidebar {
            width: 260px !important;
            transform: translateX(-100%);
            z-index: 200;
            box-shadow: var(--shadow-lg);
          }

          .app-sidebar.is-mobile-open {
            transform: translateX(0);
          }

          .sidebar-collapse-btn {
            display: none !important;
          }

          .sidebar-expand-row {
            display: none !important;
          }

          .mobile-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.55);
            backdrop-filter: blur(3px);
            z-index: 150;
          }

          .app-main-wrapper.sidebar-expanded,
          .app-main-wrapper.sidebar-collapsed {
            margin-left: 0 !important;
            padding-top: 56px;
          }

          .app-main-wrapper main {
            padding: 24px 16px 64px !important;
          }
        }
      `}</style>
    </div>
  );
};
