import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { taskService } from '../services/taskService';
import { sessionService } from '../services/sessionService';
import { DailyGoalModal } from '../components/dashboard/DailyGoalModal';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import type { DashboardData } from '../types/dashboard';
import type { ApiError } from '../types/auth';
import {
  Clock,
  Play,
  ArrowRight,
  AlertCircle,
  Sliders,
  CheckCircle2,
  Circle,
  Sparkles,
  BookOpen,
  TrendingUp,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userName = user?.name ? user.name.trim().split(' ')[0] : 'Student';

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [animatedPercent, setAnimatedPercent] = useState(0);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardService.getDashboardData();
      setData(response);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (data) {
      const goalSecs = (data.dailyFocusGoalMinutes || 120) * 60;
      const pct = Math.min(100, Math.round((data.todayFocusSeconds / goalSecs) * 100));
      const timer = setTimeout(() => {
        setAnimatedPercent(pct);
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [data?.todayFocusSeconds, data?.dailyFocusGoalMinutes]);

  const handleToggleTask = async (taskId: string) => {
    try {
      const updated = await taskService.toggleComplete(taskId);
      setData((prev) => {
        if (!prev) return prev;
        const updatedRecentTasks = prev.recentTasks.map((t) => (t.id === updated.id ? updated : t));
        const deltaCompleted = updated.status === 'COMPLETED' ? 1 : -1;
        const newCompleted = Math.max(0, prev.completedTasks + deltaCompleted);
        const newPending = Math.max(0, prev.totalTasks - newCompleted);
        const newRate = prev.totalTasks > 0 ? (newCompleted / prev.totalTasks) * 100 : 0;
        return {
          ...prev,
          recentTasks: updatedRecentTasks,
          completedTasks: newCompleted,
          pendingTasks: newPending,
          taskCompletionRate: Math.round(newRate * 10) / 10,
        };
      });
    } catch {
      alert('Failed to update task status.');
    }
  };

  const handleDeleteSession = async (id: string) => {
    await sessionService.deleteSession(id);
    fetchDashboard();
  };

  const formatDurationParts = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return { hrs, mins, secs };
  };

  const formatGoal = (totalMins: number) => {
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}m`;
  };

  const handleSaveGoal = async (newGoalMinutes: number) => {
    await userService.updatePreferences({ dailyFocusGoalMinutes: newGoalMinutes });
    setData((prev) => (prev ? { ...prev, dailyFocusGoalMinutes: newGoalMinutes } : prev));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 20px', gap: '16px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid var(--border)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span className="text-meta">Synthesizing study velocity...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '60px 0', maxWidth: '600px', margin: '0 auto' }}>
        <div className="alert-banner alert-danger">
          <AlertCircle size={16} />
          <span>{error || 'Unable to fetch dashboard metrics.'}</span>
          <button onClick={fetchDashboard} style={{ marginLeft: 'auto', textDecoration: 'underline', color: 'inherit', fontWeight: 600 }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const goalMinutes = data.dailyFocusGoalMinutes || 120;
  const goalSeconds = goalMinutes * 60;
  const isGoalReached = data.todayFocusSeconds >= goalSeconds;
  const todayMinutes = Math.floor(data.todayFocusSeconds / 60);
  const progressPercent = Math.min(100, Math.round((data.todayFocusSeconds / goalSeconds) * 100));
  const { hrs, mins } = formatDurationParts(data.todayFocusSeconds);

  // Maximum minutes for weekly rhythm scale
  const maxWeeklyMinutes = Math.max(...data.weeklyFocus.map((d) => d.minutes), 60);

  // Circular progress ring geometry
  const circleRadius = 90;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (circumference * Math.min(100, animatedPercent)) / 100;

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: TOP HEADER ROW (Full-Width Greeting & Quick Actions)
          Left: Welcome back greeting
          Right: Primary action buttons
          ═══════════════════════════════════════════════════════════════ */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
        }}
        className="dashboard-header"
      >
        <h1
          className="display-hero"
          style={{
            margin: 0,
            lineHeight: 1.1,
            fontSize: 'clamp(32px, 4.5vw, 48px)',
          }}
        >
          Welcome back, {userName}.
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/focus')}
            className="btn btn-primary"
            style={{
              padding: '12px 24px',
              fontSize: '13px',
              fontWeight: 600,
              gap: '8px',
            }}
          >
            <Play size={14} fill="currentColor" />
            <span>Launch Focus Studio</span>
            <ArrowRight size={14} />
          </button>

          <button
            onClick={() => navigate('/tasks')}
            className="btn btn-outline"
            style={{
              padding: '12px 22px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <span>Manage Coursework</span>
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: MAIN DASHBOARD SECTION (Two Balanced Columns)
          Left: Today's Focus Centerpiece
          Right: Priority Assignment Queue
          ═══════════════════════════════════════════════════════════════ */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: '24px',
          alignItems: 'stretch',
        }}
        className="main-dashboard-grid"
      >
        {/* ── Left Column: Today's Focus Centerpiece ── */}
        <div
          className="editorial-panel corner-ticks"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '24px',
            boxShadow: 'var(--shadow-md)',
            height: '100%',
          }}
        >
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="text-meta">Today's Focus Duration</span>
            </div>
            <button
              type="button"
              onClick={() => setIsGoalModalOpen(true)}
              className="btn-ghost"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-digits)',
                fontVariantNumeric: 'tabular-nums',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border)',
              }}
              title="Edit Daily Goal Target"
            >
              <span>TARGET: {formatGoal(goalMinutes)}</span>
              <Sliders size={11} />
            </button>
          </div>

          {/* Distinctive Animated Circular Progress Ring Centerpiece */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 0',
            }}
          >
            <svg width="220" height="220" viewBox="0 0 220 220" style={{ overflow: 'visible' }}>
              {/* Background Ring Track */}
              <circle
                cx="110"
                cy="110"
                r={circleRadius}
                fill="none"
                stroke="var(--border)"
                strokeWidth="8"
                opacity="0.6"
              />
              {/* Subtle Inner Hairline Calibration Ring */}
              <circle
                cx="110"
                cy="110"
                r={circleRadius - 12}
                fill="none"
                stroke="var(--border-subtle)"
                strokeWidth="1"
                strokeDasharray="2 6"
              />
              {/* Animated Foreground Progress Arc */}
              <circle
                cx="110"
                cy="110"
                r={circleRadius}
                fill="none"
                stroke={isGoalReached ? 'var(--accent-amber)' : 'var(--text-primary)'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 110 110)"
                style={{
                  transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s ease',
                }}
              />
            </svg>

            {/* Inside the Ring: Centered Numerals & Status */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '6px',
                }}
              >
                Today's Study
              </span>

              <div
                style={{
                  fontFamily: 'var(--font-digits)',
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: hrs > 0 ? '38px' : '44px',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  color: 'var(--text-primary)',
                }}
              >
                {hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`}
              </div>

              <div style={{ marginTop: '8px' }}>
                {isGoalReached ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 600,
                      color: 'var(--accent-amber)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--accent-amber-subtle)',
                      border: '1px solid rgba(212, 168, 67, 0.25)',
                    }}
                  >
                    <Sparkles size={11} /> GOAL ACHIEVED
                  </span>
                ) : (
                  <span
                    style={{
                      fontFamily: 'var(--font-digits)',
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {progressPercent}% completed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Supporting Information Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              padding: '12px 14px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>
                Daily Target
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-digits)', fontVariantNumeric: 'tabular-nums' }}>
                {formatGoal(goalMinutes)}
              </div>
            </div>

            <div style={{ borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>
                Completion
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: isGoalReached ? 'var(--accent-amber)' : 'var(--text-primary)', fontFamily: 'var(--font-digits)', fontVariantNumeric: 'tabular-nums' }}>
                {progressPercent}%
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>
                Remaining
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-digits)', fontVariantNumeric: 'tabular-nums' }}>
                {isGoalReached ? 'Complete' : `${Math.max(0, goalMinutes - todayMinutes)}m`}
              </div>
            </div>
          </div>

          {/* Quick Action Button: Launch Focus Mode directly */}
          <button
            onClick={() => navigate('/focus')}
            className="btn btn-outline"
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Play size={13} fill="currentColor" />
            <span>Resume Focus Session</span>
          </button>
        </div>

        {/* ── Right Column: Priority Assignment Queue ── */}
        <div
          className="editorial-panel corner-ticks"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '20px',
            boxShadow: 'var(--shadow-md)',
            height: '100%',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--accent-coral)', fontSize: '11px' }}>●</span>
                <span className="text-meta">Priority Assignment Queue</span>
              </div>
              <Link
                to="/tasks"
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                }}
              >
                VIEW ALL ({data.pendingTasks}) →
              </Link>
            </div>

            {/* Coursework summary status card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Coursework Status
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-digits)', marginTop: '2px' }}>
                  {data.completedTasks} completed <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>of {data.totalTasks} total</span>
                </div>
              </div>
              <span
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: data.pendingTasks > 0 ? 'var(--accent-coral-subtle)' : 'var(--accent-olive-light)',
                  color: data.pendingTasks > 0 ? 'var(--accent-coral)' : 'var(--accent-olive)',
                  border: '1px solid var(--border)',
                }}
              >
                {data.pendingTasks} pending
              </span>
            </div>

            {/* Task Row Items */}
            {data.recentTasks.length === 0 ? (
              <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No active coursework scheduled. All assignments clear.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.recentTasks.slice(0, 4).map((task) => {
                  const isCompleted = task.status === 'COMPLETED';
                  return (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border)',
                        transition: 'var(--transition-fast)',
                        opacity: isCompleted ? 0.5 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <button
                          onClick={() => handleToggleTask(task.id)}
                          aria-label={isCompleted ? 'Mark pending' : 'Mark completed'}
                          style={{
                            color: isCompleted ? 'var(--accent-olive)' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                        </button>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: 500,
                              color: 'var(--text-primary)',
                              textDecoration: isCompleted ? 'line-through' : 'none',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {task.title}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', marginTop: '2px' }}>
                            {task.subject}
                          </div>
                        </div>
                      </div>

                      <span className={`badge badge-priority-${task.priority}`} style={{ flexShrink: 0 }}>
                        {task.priority}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action button at bottom to match left card height */}
          <button
            onClick={() => navigate('/tasks')}
            className="btn btn-outline"
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>Manage All Coursework Tasks</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3: LOWER DASHBOARD ANALYTICS (Balanced Widths)
          Left: Weekly Consistency Timeline Visualizer
          Right: Subject Distribution Breakdown
          ═══════════════════════════════════════════════════════════════ */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: '24px',
          alignItems: 'stretch',
        }}
        className="analytics-grid"
      >
        {/* ── Left: Weekly Consistency Timeline Visualizer ── */}
        <div className="editorial-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <TrendingUp size={14} style={{ color: 'var(--text-muted)' }} />
                <span className="text-meta">Weekly Study Rhythm</span>
              </div>
              <h3 className="title-section">Consistency &amp; Output</h3>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-digits)', fontVariantNumeric: 'tabular-nums', fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {Math.floor(data.weeklyFocus.reduce((acc, d) => acc + d.minutes, 0) / 60)}h{' '}
                {data.weeklyFocus.reduce((acc, d) => acc + d.minutes, 0) % 60}m
              </div>
              <span className="text-meta">7-DAY CUMULATIVE</span>
            </div>
          </div>

          {/* Distinct Custom Timeline Visualizer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: '180px',
              paddingTop: '20px',
              borderBottom: '1px solid var(--border)',
              gap: '8px',
            }}
          >
            {data.weeklyFocus.map((stat, idx) => {
              const heightPct = Math.max(8, Math.round((stat.minutes / maxWeeklyMinutes) * 100));
              const isToday = idx === data.weeklyFocus.length - 1;

              return (
                <div
                  key={stat.date}
                  style={{
                    flex: 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '8px',
                  }}
                  title={`${stat.day}: ${stat.minutes} minutes`}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-digits)',
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: stat.minutes > 0 ? 'var(--text-muted)' : 'transparent',
                    }}
                  >
                    {stat.minutes > 0 ? `${stat.minutes}m` : '0'}
                  </span>

                  {/* Vertical bar pill with high contrast */}
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '38px',
                      height: `${heightPct}%`,
                      borderRadius: '4px',
                      backgroundColor: isToday
                        ? (stat.minutes > 0 ? 'var(--accent)' : 'var(--border-strong)')
                        : stat.minutes > 0
                        ? 'var(--surface-raised)'
                        : 'var(--bg-subtle)',
                      border: isToday ? '1px solid var(--accent)' : '1px solid var(--border)',
                      transition: 'height 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />

                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '11px',
                      fontWeight: isToday ? 700 : 500,
                      color: isToday ? 'var(--text-primary)' : 'var(--text-muted)',
                      paddingBottom: '8px',
                    }}
                  >
                    {isToday ? 'TODAY' : stat.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>Target daily benchmark: {formatGoal(goalMinutes)}</span>
            <Link to="/insights" style={{ textDecoration: 'underline', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '11px' }}>
              DETAILED AUDIT →
            </Link>
          </div>
        </div>

        {/* ── Right: Subject Distribution Matrix ── */}
        <div className="editorial-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <BookOpen size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="text-meta">Curriculum Distribution</span>
            </div>
            <h3 className="title-section">Subject Allocation</h3>
          </div>

          {(!data.subjectAnalytics || data.subjectAnalytics.length === 0) ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No subject logs recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {data.subjectAnalytics.map((stat) => {
                const subColor = stat.color || '#94a3b8';
                return (
                  <div key={stat.subjectId || stat.subjectName} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: subColor }} />
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stat.subjectName}</span>
                      </div>
                      <div style={{ fontFamily: 'var(--font-digits)', fontVariantNumeric: 'tabular-nums', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {Math.floor(stat.focusSeconds / 3600)}h {Math.floor((stat.focusSeconds % 3600) / 60)}m ·{' '}
                        <strong style={{ color: 'var(--text-primary)' }}>{stat.focusPercentage}%</strong>
                      </div>
                    </div>

                    <div
                      style={{
                        width: '100%',
                        height: '4px',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, stat.focusPercentage)}%`,
                          backgroundColor: subColor,
                          borderRadius: '9999px',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <Link
              to="/subjects"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
              }}
            >
              <span>MANAGE SUBJECT COLORS &amp; TOPICS</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3: RECENT FOCUS SESSIONS CHRONOLOGICAL STREAM
          ═══════════════════════════════════════════════════════════════ */}
      <section className="editorial-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span className="text-meta">Audit Record</span>
            <h3 className="title-section" style={{ marginTop: '2px' }}>Recent Focus Sessions</h3>
          </div>
          <Link
            to="/history"
            style={{
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            VIEW FULL LOG ({data.recentSessions.length}) →
          </Link>
        </div>

        {data.recentSessions.length === 0 ? (
          <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No focus intervals logged today yet. Launch the Focus Studio to record your first session.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--border)' }}>
            {data.recentSessions.slice(0, 4).map((sess) => {
              const durationMins = Math.floor(sess.duration / 60);
              const durationSecs = sess.duration % 60;
              const formattedDuration = durationMins > 0 ? `${durationMins}m ${durationSecs}s` : `${durationSecs}s`;
              const startDate = new Date(sess.startedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });
              const startTime = new Date(sess.startedAt).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={sess.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 0',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-olive)',
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sess.subject}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-digits)', fontVariantNumeric: 'tabular-nums', marginTop: '2px' }}>
                        {startDate} at {startTime}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-digits)',
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {formattedDuration}
                    </span>
                    <button
                      onClick={() => handleDeleteSession(sess.id)}
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: '11px',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 600,
                        padding: '4px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-coral)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                      title="Delete record"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Goal Modal */}
      <DailyGoalModal
        isOpen={isGoalModalOpen}
        currentGoalMinutes={data.dailyFocusGoalMinutes || 120}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={handleSaveGoal}
      />

      {/* Responsive layout rules */}
      <style>{`
        @media (max-width: 960px) {
          .dashboard-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }
          .main-dashboard-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .analytics-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
      `}</style>
    </div>
  );
};
