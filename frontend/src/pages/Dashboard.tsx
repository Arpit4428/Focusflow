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
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p>Loading your study dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '40px 0' }}>
        <div className="alert-banner alert-danger">
          <AlertCircle size={18} />
          <span>{error || 'Unable to fetch dashboard metrics.'}</span>
          <button onClick={fetchDashboard} style={{ marginLeft: 'auto', textDecoration: 'underline', background: 'none', color: 'inherit' }}>
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
    <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
      {/* Editorial Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '36px',
        flexWrap: 'wrap',
        gap: '20px',
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '8px',
          }}>
            <span>✦</span>
            <span>Academic Command Studio</span>
          </div>
          <h1 className="title-hero">
            Welcome back, {user?.name?.split(' ')[0] || 'Student'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '6px' }}>
            Here is your daily study activity, focus momentum, and academic rhythm.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/tasks')}
            className="btn btn-outline"
            style={{ padding: '11px 22px' }}
          >
            <Plus size={16} />
            <span>New Task</span>
          </button>
          <button
            onClick={() => navigate('/focus')}
            className="btn btn-primary"
            style={{ padding: '11px 24px' }}
          >
            <Play size={15} fill="currentColor" />
            <span>Start Focus</span>
          </button>
        </div>
      </div>

      {/* Hero Hierarchy Grid: Dominant Focus Studio + Secondary Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '24px',
        marginBottom: '36px',
      }}>
        {/* Dominant Hero Card: Today's Focus */}
        <div style={{
          gridColumn: 'span 1',
          minWidth: '320px',
          backgroundColor: 'var(--surface-sage)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '36px 36px 32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '28px',
            }}>
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
              }}>
                <Clock size={13} />
                <span>TODAY'S FOCUS TIME</span>
              </div>
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(251, 249, 243, 0.85)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '4px 10px',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(251, 249, 243, 0.85)';
                }}
                title="Edit Daily Focus Goal"
                aria-label="Edit Daily Focus Goal"
              >
                <span>Goal: {formatGoal(goalMinutes)}</span>
                <Pencil size={11} />
              </button>
            </div>

            <div className="metric-giant" style={{ marginBottom: '12px' }}>
              {formatSeconds(data.todayFocusSeconds)}
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              {isGoalReached
                ? overMinutes > 0
                  ? `Goal reached — ${overMinutes} ${overMinutes === 1 ? 'minute' : 'minutes'} over`
                  : '✦ Daily target achieved! Fantastic concentration today.'
                : `${remainingMinutes} minutes remaining to hit your ${formatGoal(goalMinutes)} daily benchmark.`}
            </p>

            {/* Benchmark Progress Bar */}
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'rgba(52, 59, 47, 0.12)',
              borderRadius: 'var(--radius-pill)',
              overflow: 'hidden',
              marginBottom: '32px',
            }}>
              <div style={{
                height: '100%',
                width: `${progressPercent}%`,
                backgroundColor: 'var(--accent-primary)',
                borderRadius: 'var(--radius-pill)',
                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              }} />
            </div>
          </div>

          <button
            onClick={() => navigate('/focus')}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '14px 24px',
              fontSize: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Play size={16} fill="currentColor" />
              <span>Launch Focus Studio</span>
            </span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Compact Companion Card: Study Tasks Status */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '36px 32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}>
              <span className="text-meta" style={{ textTransform: 'uppercase' }}>STUDY TASKS STATUS</span>
              <span className="badge" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                {data.pendingTasks} pending
              </span>
            </div>

            <div style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
              {data.completedTasks} completed
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              {data.totalTasks > 0
                ? `${data.completedTasks} of ${data.totalTasks} total coursework tasks completed.`
                : 'No tasks scheduled yet for your courses.'}
            </p>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span>Completion progress</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{data.taskCompletionRate}%</span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-pill)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${data.taskCompletionRate}%`,
                  backgroundColor: 'var(--accent-primary)',
                  borderRadius: 'var(--radius-pill)',
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '20px',
            borderTop: '1px solid var(--border)',
          }}>
            <Link
              to="/tasks"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>Manage Coursework Tasks</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Weekly Focus Rhythm Chart */}
      <div style={{ marginBottom: '28px' }}>
        <WeeklyBarChart data={data.weeklyFocus} />
      </div>

      {/* Study Distribution by Subject */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px',
        boxShadow: 'var(--shadow-card)',
        marginBottom: '28px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: 'var(--text-secondary)' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
                Study Distribution by Subject
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Academic focus volume and task distribution across your enrolled subjects
            </p>
          </div>
          <Link
            to="/subjects"
            style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>Manage Subjects</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {(!data.subjectAnalytics ||
          data.subjectAnalytics.length === 0 ||
          data.subjectAnalytics.every((s) => s.focusSeconds === 0 && s.totalTasks === 0)) ? (
          <div style={{
            textAlign: 'center',
            padding: '36px 20px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border)',
            color: 'var(--text-secondary)',
          }}>
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              No study data yet
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
              Create a subject and start a focus session to see your study distribution.
            </p>
            <Link to="/subjects" className="btn btn-outline" style={{ display: 'inline-flex', padding: '8px 18px', fontSize: '12px' }}>
              <span>Go to Subjects</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {data.subjectAnalytics.map((stat) => {
              const barColor = stat.color || '#94a3b8';
              return (
                <div key={stat.subjectId || stat.subjectName} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* Top row: Subject name with color dot, and stats on the right */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: barColor,
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {stat.subjectName}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {formatSeconds(stat.focusSeconds)}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 500, minWidth: '36px', textAlign: 'right' }}>
                        {stat.focusPercentage}%
                      </span>
                      {stat.totalTasks > 0 && (
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {stat.completedTasks}/{stat.totalTasks} tasks
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Visual colored bar matching subject color */}
                  <div style={{
                    width: '100%',
                    height: '10px',
                    backgroundColor: 'var(--bg-secondary)',
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

      {/* Two Column Layout: Active Tasks & Recent Focus History */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '28px',
      }}>
        {/* Left: Active Tasks */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Active Tasks
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Recent assignments &amp; study goals</p>
            </div>
            <Link
              to="/tasks"
              style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>View all</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {data.recentTasks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '44px 16px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border)',
              color: 'var(--text-secondary)',
              fontSize: '13px',
            }}>
              No tasks added yet.
              <div style={{ marginTop: '14px' }}>
                <Link to="/tasks" className="btn btn-outline" style={{ display: 'inline-flex' }}>
                  <Plus size={14} />
                  <span>Create First Task</span>
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.recentTasks.map((task) => {
                const isCompleted = task.status === 'COMPLETED';
                return (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      backgroundColor: isCompleted ? 'var(--bg-primary)' : 'var(--surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      opacity: isCompleted ? 0.6 : 1,
                      transition: 'var(--transition)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        aria-label={isCompleted ? 'Mark pending' : 'Mark completed'}
                        style={{
                          background: 'none',
                          color: isCompleted ? 'var(--accent-primary)' : 'var(--text-muted)',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {isCompleted ? <CheckCircle2 size={19} color="var(--accent-primary)" /> : <Circle size={19} />}
                      </button>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          textDecoration: isCompleted ? 'line-through' : 'none',
                          color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
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

        {/* Right: Recent Focus Sessions */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Recent Focus Sessions
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Latest completed study intervals</p>
            </div>
            <Link
              to="/history"
              style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Full History</span>
              <ArrowRight size={14} />
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

