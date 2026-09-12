import React, { useState, useEffect, useCallback } from 'react';
import { insightsService } from '../services/insightsService';
import type { InsightsData } from '../types/insights';
import type { ApiError } from '../types/auth';
import {
  Clock,
  BarChart2,
  AlertCircle,
} from 'lucide-react';

export const Insights: React.FC = () => {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await insightsService.getInsights();
      setData(result);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to load productivity insights.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m`;
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p>Analyzing your study patterns...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '20px 0' }}>
        <div className="alert-banner alert-danger">
          <AlertCircle size={18} />
          <span>{error || 'Unable to load academic insights.'}</span>
          <button onClick={fetchInsights} style={{ marginLeft: 'auto', textDecoration: 'underline', background: 'none', color: 'inherit' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hasActivity = data.totalSessions > 0 || data.totalTasks > 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Editorial Report Header */}
      <div style={{ marginBottom: '36px' }}>
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
          <span>Academic Analytics &amp; Habit Audit</span>
        </div>
        <h1 className="title-hero">
          Academic Productivity Insights
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '6px' }}>
          Analytical breakdown of study consistency, subject time distribution, and task velocity.
        </p>
      </div>

      {!hasActivity ? (
        <div style={{
          textAlign: 'center',
          padding: '64px 20px',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--border)',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: 'var(--surface-sage)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <BarChart2 size={24} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
            No Activity Recorded Yet
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '420px', margin: '0 auto' }}>
            Insights will compute automatically as soon as you record your first focus session or create study tasks.
          </p>
        </div>
      ) : (
        <>
          {/* Dominant Hero Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '36px',
          }}>
            {/* Metric 1: Total Focus (Dominant Muted Sage) */}
            <div style={{
              backgroundColor: 'var(--surface-sage)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-card)',
            }}>
              <div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--text-primary)',
                  marginBottom: '12px',
                }}>
                  <Clock size={14} />
                  <span>TOTAL FOCUS TIME</span>
                </div>
                <div style={{ fontSize: '42px', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1 }}>
                  {formatDuration(data.totalFocusSeconds)}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '16px' }}>
                All-time cumulative study volume
              </div>
            </div>

            {/* Metric 2: Average Duration */}
            <div style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-card)',
            }}>
              <div>
                <div className="text-meta" style={{ textTransform: 'uppercase', marginBottom: '12px' }}>
                  AVG SESSION DURATION
                </div>
                <div style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {formatDuration(data.averageSessionDurationSeconds)}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px' }}>
                Across {data.totalSessions} logged sessions
              </div>
            </div>

            {/* Metric 3: Task Completion Rate */}
            <div style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-card)',
            }}>
              <div>
                <div className="text-meta" style={{ textTransform: 'uppercase', marginBottom: '12px' }}>
                  TASK COMPLETION RATE
                </div>
                <div style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {data.taskCompletionRate}%
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px' }}>
                {data.completedTasks} of {data.totalTasks} tasks completed
              </div>
            </div>

            {/* Metric 4: Top Subject & Peak Day */}
            <div style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-card)',
            }}>
              <div>
                <div className="text-meta" style={{ textTransform: 'uppercase', marginBottom: '12px' }}>
                  TOP SUBJECT &amp; PEAK DAY
                </div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {data.mostFocusedSubject || 'General Study'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Peak output: <strong>{data.mostProductiveDayOfWeek || 'N/A'}</strong>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px' }}>
                Highest frequency concentration
              </div>
            </div>
          </div>


          {/* Two-Column Section: Subject Allocation & Weekly Distribution */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '28px' }}>
            {/* Subject Time Allocation */}
            <div style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px',
              boxShadow: 'var(--shadow-card)',
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Subject Time Allocation
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Proportional distribution of study hours across coursework
              </p>

              {data.subjectBreakdown.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No subjects logged yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {data.subjectBreakdown.map((item) => (
                    <div key={item.subject}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.subject}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {formatDuration(item.durationSeconds)} ({item.percentage}%)
                        </span>
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
                          width: `${item.percentage}%`,
                          backgroundColor: 'var(--accent-primary)',
                          borderRadius: 'var(--radius-pill)',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Day of Week Distribution */}
            <div style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px',
              boxShadow: 'var(--shadow-card)',
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Weekly Study Consistency
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Cumulative focus duration by day of the week
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.dayOfWeekBreakdown.map((item) => {
                  const isTopDay = item.dayOfWeek === data.mostProductiveDayOfWeek && item.durationSeconds > 0;
                  return (
                    <div
                      key={item.dayOfWeek}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        backgroundColor: isTopDay ? 'var(--surface-sage)' : 'transparent',
                        borderBottom: isTopDay ? 'none' : '1px solid var(--border)',
                        borderRadius: isTopDay ? 'var(--radius-md)' : '0',
                        transition: 'var(--transition)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: isTopDay ? 700 : 500, color: 'var(--text-primary)' }}>
                          {item.dayOfWeek}
                        </span>
                        {isTopDay && (
                          <span className="badge" style={{ backgroundColor: 'var(--accent-mustard)', color: 'var(--text-primary)', fontSize: '9px', fontWeight: 700 }}>
                            Top Day
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {item.durationSeconds > 0 ? (
                          <>
                            <strong style={{ color: 'var(--text-primary)' }}>{formatDuration(item.durationSeconds)}</strong> ({item.sessionCount} sessions)
                          </>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>0m</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

