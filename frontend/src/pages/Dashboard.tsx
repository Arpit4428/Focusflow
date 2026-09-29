import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { taskService } from '../services/taskService';
import { sessionService } from '../services/sessionService';
import { WeeklyBarChart } from '../components/charts/WeeklyBarChart';
import { FocusHistoryList } from '../components/focus/FocusHistoryList';
import { DailyGoalModal } from '../components/dashboard/DailyGoalModal';
import { userService } from '../services/userService';
import type { DashboardData } from '../types/dashboard';
import type { ApiError } from '../types/auth';
import {
  Clock,
  CheckCircle2,
  Play,
  Plus,
  ArrowRight,
  AlertCircle,
  Circle,
  Layers,
  Pencil,
  TrendingUp,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

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

  const formatSeconds = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m`;
    return '0m';
  };

  const formatGoal = (totalMins: number) => {
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
    if (hrs > 0) return `${hrs}h 00m`;
    return `${mins}m`;
  };

  const handleSaveGoal = async (newGoalMinutes: number) => {
    await userService.updatePreferences({ dailyFocusGoalMinutes: newGoalMinutes });
    setData((prev) => (prev ? { ...prev, dailyFocusGoalMinutes: newGoalMinutes } : prev));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          width: '36px', height: '36px',
          border: '2.5px solid var(--border)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>Loading your dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '40px 0' }}>
        <div className="alert-banner alert-danger">
          <AlertCircle size={16} />
          <span>{error || 'Unable to fetch dashboard metrics.'}</span>
          <button onClick={fetchDashboard} style={{ marginLeft: 'auto', textDecoration: 'underline', background: 'none', color: 'inherit', fontWeight: 600 }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const goalMinutes = data.dailyFocusGoalMinutes || 120;
  const goalSeconds = goalMinutes * 60;
  const isGoalReached = data.todayFocusSeconds >= goalSeconds;
  const overMinutes = Math.floor((data.todayFocusSeconds - goalSeconds) / 60);
  const remainingMinutes = Math.max(0, Math.round((goalSeconds - data.todayFocusSeconds) / 60));
  const progressPercent = Math.min(100, Math.round((data.todayFocusSeconds / goalSeconds) * 100));

  return (
    <div className="page-enter" style={{ maxWidth: '1360px', margin: '0 auto' }}>

      {/* ── Page Header ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '40px',
        flexWrap: 'wrap',
        gap: '20px',
      }}>
        <div>
          <div style={{
            fontSize: '11px', fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--text-3)', marginBottom: '10px',
          }}>
            Academic Command Studio
          </div>
          <h1 className="title-hero">
            Welcome back, {user?.name?.split(' ')[0] || 'Student'}
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '15px', marginTop: '8px', maxWidth: '460px', lineHeight: 1.5 }}>
            Here is your daily study activity, focus momentum, and academic rhythm.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={() => navigate('/tasks')}
            className="btn btn-outline"
            style={{ padding: '10px 20px' }}
          >
            <Plus size={15} />
            <span>New Task</span>
          </button>
          <button
            onClick={() => navigate('/focus')}
            className="btn btn-primary"
            style={{ padding: '10px 22px' }}
          >
            <Play size={14} fill="currentColor" />
            <span>Start Focus</span>
          </button>
        </div>
      </div>

      {/* ── Hero Row: Focus + Tasks ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        marginBottom: '20px',
      }}>
        {/* Today's Focus Hero Card */}
        <div style={{
          backgroundColor: 'var(--accent)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '280px',
        }}>
          {/* Decorative circle */}
          <div style={{
            position: 'absolute', top: '-40px', right: '-40px',
            width: '200px', height: '200px', borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
          }} />

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', opacity: 0.75 }}>
                <Clock size={13} />
                <span>Today's Focus Time</span>
              </div>
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '4px 10px',
                  fontSize: '11px', color: '#fff', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
                title="Edit Daily Focus Goal"
                aria-label="Edit Daily Focus Goal"
              >
                <span>Goal: {formatGoal(goalMinutes)}</span>
                <Pencil size={10} />
              </button>
            </div>

            <div style={{
              fontSize: 'clamp(44px, 8vw, 64px)',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              marginBottom: '14px',
            }}>
              {formatSeconds(data.todayFocusSeconds)}
            </div>

            <p style={{ fontSize: '13px', opacity: 0.8, marginBottom: '20px', lineHeight: 1.4 }}>
              {isGoalReached
                ? overMinutes > 0
                  ? `Goal exceeded — ${overMinutes} ${overMinutes === 1 ? 'minute' : 'minutes'} over`
                  : '✓ Daily target achieved!'
                : `${remainingMinutes}m remaining to reach your ${formatGoal(goalMinutes)} goal`}
            </p>

            {/* Progress bar */}
            <div style={{
              width: '100%', height: '4px',
              backgroundColor: 'rgba(255,255,255,0.25)',
              borderRadius: 'var(--radius-pill)',
              overflow: 'hidden',
              marginBottom: '28px',
            }}>
              <div style={{
                height: '100%',
                width: `${progressPercent}%`,
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: 'var(--radius-pill)',
                transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
              }} />
            </div>
          </div>

          <button
            onClick={() => navigate('/focus')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 18px',
              color: '#fff', fontWeight: 600, fontSize: '14px',
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Play size={15} fill="currentColor" />
              <span>Launch Focus Studio</span>
            </span>
            <ArrowRight size={15} />
          </button>
        </div>

        {/* Tasks Status Card */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-md)',
          minHeight: '280px',
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span className="text-meta">Study Tasks Status</span>
              <span className="badge badge-status-PENDING">
                {data.pendingTasks} pending
              </span>
            </div>

            <div style={{
              fontSize: 'clamp(28px, 4vw, 38px)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'var(--text-1)',
              marginBottom: '6px',
              lineHeight: 1,
            }}>
              {data.completedTasks}
              <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-3)', marginLeft: '8px' }}>
                of {data.totalTasks} completed
              </span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '20px' }}>
              {data.totalTasks > 0
                ? `${data.completedTasks} of ${data.totalTasks} total coursework tasks completed.`
                : 'No tasks scheduled yet for your courses.'}
            </p>

            <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-3)' }}>
              <span>Completion progress</span>
              <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{data.taskCompletionRate}%</span>
            </div>
            <div style={{
              width: '100%', height: '6px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-pill)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${data.taskCompletionRate}%`,
                backgroundColor: 'var(--accent)',
                borderRadius: 'var(--radius-pill)',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: '20px', borderTop: '1px solid var(--border)',
          }}>
            <Link
              to="/tasks"
              style={{
                fontSize: '13px', fontWeight: 700,
                color: 'var(--text-1)',
                display: 'inline-flex', alignItems: 'center', gap: '5px',
              }}
            >
              <span>Manage Coursework Tasks</span>
              <ArrowRight size={13} />
            </Link>
            <TrendingUp size={16} color="var(--text-3)" />
          </div>
        </div>
      </div>

      {/* ── Weekly Chart ── */}
      <div style={{ marginBottom: '20px' }}>
        <WeeklyBarChart data={data.weeklyFocus} />
      </div>

      {/* ── Subject Distribution ── */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 30px',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Layers size={16} style={{ color: 'var(--text-3)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-1)', margin: 0 }}>
                Study Distribution by Subject
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>
              Academic focus volume across enrolled subjects
            </p>
          </div>
          <Link
            to="/subjects"
            style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>Manage Subjects</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {(!data.subjectAnalytics ||
          data.subjectAnalytics.length === 0 ||
          data.subjectAnalytics.every((s) => s.focusSeconds === 0 && s.totalTasks === 0)) ? (
          <div style={{
            textAlign: 'center',
            padding: '32px 20px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-strong)',
          }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '4px' }}>No study data yet</p>
            <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: '0 0 16px' }}>
              Create a subject and start a focus session to see your study distribution.
            </p>
            <Link to="/subjects" className="btn btn-outline" style={{ display: 'inline-flex', padding: '7px 16px', fontSize: '12px' }}>
              <span>Go to Subjects</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {data.subjectAnalytics.map((stat) => {
              const barColor = stat.color || '#94a3b8';
              return (
                <div key={stat.subjectId || stat.subjectName} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: barColor, flexShrink: 0 }} />
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-1)' }}>{stat.subjectName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{formatSeconds(stat.focusSeconds)}</span>
                      <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>{stat.focusPercentage}%</span>
                      {stat.totalTasks > 0 && (
                        <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>
                          {stat.completedTasks}/{stat.totalTasks} tasks
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{
                    width: '100%', height: '8px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-pill)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(0, stat.focusPercentage))}%`,
                      backgroundColor: barColor,
                      borderRadius: 'var(--radius-pill)',
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Two Column: Tasks + Sessions ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '20px',
      }}>
        {/* Active Tasks */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-1)', marginBottom: '2px' }}>
                Active Tasks
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>Recent assignments &amp; study goals</p>
            </div>
            <Link
              to="/tasks"
              style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>View all</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {data.recentTasks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '36px 16px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-strong)',
            }}>
              <p style={{ color: 'var(--text-2)', fontSize: '13px', marginBottom: '14px' }}>No tasks added yet.</p>
              <Link to="/tasks" className="btn btn-outline" style={{ display: 'inline-flex', fontSize: '12px', padding: '7px 14px' }}>
                <Plus size={13} />
                <span>Create First Task</span>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {data.recentTasks.map((task) => {
                const isCompleted = task.status === 'COMPLETED';
                return (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      backgroundColor: isCompleted ? 'var(--bg-subtle)' : 'var(--surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      opacity: isCompleted ? 0.65 : 1,
                      transition: 'var(--transition)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        aria-label={isCompleted ? 'Mark pending' : 'Mark completed'}
                        style={{ background: 'none', color: isCompleted ? 'var(--accent)' : 'var(--text-3)', padding: '2px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                      >
                        {isCompleted ? <CheckCircle2 size={18} color="var(--accent)" /> : <Circle size={18} />}
                      </button>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{
                          fontSize: '13.5px', fontWeight: 500,
                          textDecoration: isCompleted ? 'line-through' : 'none',
                          color: isCompleted ? 'var(--text-3)' : 'var(--text-1)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '1px' }}>{task.subject}</div>
                      </div>
                    </div>
                    <span className={`badge badge-priority-${task.priority}`} style={{ flexShrink: 0, marginLeft: '8px' }}>
                      {task.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Focus Sessions */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-1)', marginBottom: '2px' }}>
                Recent Focus Sessions
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>Latest completed study intervals</p>
            </div>
            <Link
              to="/history"
              style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Full History</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <FocusHistoryList
            sessions={data.recentSessions}
            onDeleteSession={handleDeleteSession}
            emptyMessage="No focus sessions yet. Start your first session to build momentum!"
          />
        </div>
      </div>

      <DailyGoalModal
        isOpen={isGoalModalOpen}
        currentGoalMinutes={data.dailyFocusGoalMinutes || 120}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={handleSaveGoal}
      />
    </div>
  );
};
