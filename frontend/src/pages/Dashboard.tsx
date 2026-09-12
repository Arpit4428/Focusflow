import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { taskService } from '../services/taskService';
import { sessionService } from '../services/sessionService';
import { WeeklyBarChart } from '../components/charts/WeeklyBarChart';
import { FocusHistoryList } from '../components/focus/FocusHistoryList';
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
  HelpCircle,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);

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

  if (loading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #334155',
          borderTopColor: '#6366f1',
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
            className="btn btn-lime"
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
          backgroundColor: 'var(--surface-mint)',
          borderRadius: 'var(--radius-lg)',
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
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}>
                <Clock size={13} />
                <span>TODAY'S FOCUS TIME</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Goal: 2h 00m
              </span>
            </div>

            <div className="metric-giant" style={{ marginBottom: '12px' }}>
              {formatSeconds(data.todayFocusSeconds)}
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              {data.todayFocusSeconds >= 7200
                ? '✦ Daily target achieved! Fantastic concentration today.'
                : `${Math.max(0, Math.round((7200 - data.todayFocusSeconds) / 60))} minutes remaining to hit your 2-hour daily benchmark.`}
            </p>

            {/* Benchmark Progress Bar */}
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'rgba(17, 17, 17, 0.08)',
              borderRadius: 'var(--radius-pill)',
              overflow: 'hidden',
              marginBottom: '32px',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, Math.round((data.todayFocusSeconds / 7200) * 100))}%`,
                backgroundColor: 'var(--text-primary)',
                borderRadius: 'var(--radius-pill)',
                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              }} />
            </div>
          </div>

          <button
            onClick={() => navigate('/focus')}
            className="btn btn-lime"
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

        {/* Secondary Column: Productivity Score + Task Progress */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Card A: Productivity Score */}
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-card)',
            position: 'relative',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span className="text-meta" style={{ textTransform: 'uppercase' }}>PRODUCTIVITY SCORE</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Rule-based Evaluation
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowFormulaInfo(!showFormulaInfo)}
                    style={{ background: 'none', color: 'var(--text-muted)', padding: '2px' }}
                    title="View deterministic formula"
                  >
                    <HelpCircle size={15} />
                  </button>
                </div>
              </div>

              <span className="badge" style={{
                backgroundColor: data.productivityScore >= 70 ? 'var(--surface-mint)' : data.productivityScore >= 40 ? '#FCEFD8' : 'var(--bg-secondary)',
                color: data.productivityScore >= 70 ? '#1F4C27' : data.productivityScore >= 40 ? '#8C5914' : 'var(--text-secondary)',
              }}>
                {data.productivityScore >= 70 ? 'OPTIMAL' : data.productivityScore >= 40 ? 'CONSISTENT' : 'STARTING'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '8px 0' }}>
              <span style={{ fontSize: '52px', fontWeight: 600, letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
                {data.productivityScore}
              </span>
              <span style={{ fontSize: '18px', color: 'var(--text-muted)', fontWeight: 500 }}>/ 100</span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Weighted synthesis of completion rate (40%), 7-day consistency (30%), and today's focus benchmark (30%).
            </p>

            {/* Formula Info Popover */}
            {showFormulaInfo && (
              <div style={{
                position: 'absolute',
                top: '70px',
                right: '24px',
                zIndex: 30,
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                boxShadow: 'var(--shadow-float)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                maxWidth: '280px',
                lineHeight: '1.6',
              }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Deterministic Score Formula:
                </div>
                <div>• <strong>40%</strong> Task Completion Ratio</div>
                <div>• <strong>30%</strong> 7-Day Active Study Days</div>
                <div>• <strong>30%</strong> Focus Target (up to 2h)</div>
                <button
                  onClick={() => setShowFormulaInfo(false)}
                  style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'underline', background: 'none' }}
                >
                  Close details
                </button>
              </div>
            )}
          </div>

          {/* Card B: Task Completion Momentum */}
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="text-meta" style={{ textTransform: 'uppercase' }}>STUDY TASKS STATUS</span>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {data.completedTasks} completed <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 400 }}>of {data.totalTasks} total</span>
                </div>
              </div>
              <span className="badge" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                {data.pendingTasks} pending
              </span>
            </div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
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
                  backgroundColor: 'var(--surface-green)',
                  borderRadius: 'var(--radius-pill)',
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Focus Rhythm Chart */}
      <div style={{ marginBottom: '36px' }}>
        <WeeklyBarChart data={data.weeklyFocus} />
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
                          color: isCompleted ? '#1F4C27' : 'var(--text-muted)',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {isCompleted ? <CheckCircle2 size={19} color="#1F4C27" /> : <Circle size={19} />}
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
    </div>
  );
};

