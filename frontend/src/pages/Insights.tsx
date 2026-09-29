import React, { useState, useEffect, useCallback } from 'react';
import { insightsService } from '../services/insightsService';
import type { InsightsData } from '../types/insights';
import type { ApiError } from '../types/auth';
import {
  Clock,
  BarChart2,
  AlertCircle,
  TrendingUp,
  CheckSquare,
  Star,
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', gap: '16px', color: 'var(--text-2)' }}>
        <div style={{
          width: '32px', height: '32px',
          border: '2.5px solid var(--border)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ fontSize: '13px' }}>Analyzing your study patterns...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '20px 0' }}>
        <div className="alert-banner alert-danger">
          <AlertCircle size={16} />
          <span>{error || 'Unable to load academic insights.'}</span>
          <button onClick={fetchInsights} style={{ marginLeft: 'auto', textDecoration: 'underline', background: 'none', color: 'inherit', fontWeight: 600 }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hasActivity = data.totalSessions > 0 || data.totalTasks > 0;

  return (
    <div className="page-enter" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '40px' }}>
        <div className="section-label" style={{ marginBottom: '10px' }}>Academic Analytics &amp; Habit Audit</div>
        <h1 className="title-hero">Productivity Insights</h1>
        <p style={{ color: 'var(--text-2)', fontSize: '14px', marginTop: '8px', lineHeight: 1.5 }}>
          Analytical breakdown of study consistency, subject time distribution, and task velocity.
        </p>
      </div>

      {!hasActivity ? (
        <div style={{
          textAlign: 'center',
          padding: '64px 24px',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px dashed var(--border-strong)',
        }}>
          <div style={{
            width: '52px', height: '52px',
            borderRadius: '50%',
            backgroundColor: 'var(--sage)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <BarChart2 size={22} color="var(--accent)" />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-1)' }}>
            No Activity Recorded Yet
          </h3>
          <p style={{ color: 'var(--text-2)', fontSize: '13.5px', maxWidth: '420px', margin: '0 auto', lineHeight: 1.55 }}>
            Insights will compute automatically as soon as you record your first focus session or create study tasks.
          </p>
        </div>
      ) : (
        <>
          {/* ── Metric Cards Grid ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '28px',
          }}>
            {/* Total Focus — Primary Hero Metric */}
            <div style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding: '28px 24px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '160px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Clock size={14} color="var(--text-3)" />
                <span className="text-meta">Total Focus Time</span>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-digits)', fontVariantNumeric: 'tabular-nums', fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-1)', lineHeight: 1, marginBottom: '6px' }}>
                  {formatDuration(data.totalFocusSeconds)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>All-time cumulative study volume</div>
              </div>
            </div>

            {/* Avg Session */}
            <div style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding: '28px 24px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '160px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <TrendingUp size={14} color="var(--text-3)" />
                <span className="text-meta">Avg Session</span>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-digits)', fontVariantNumeric: 'tabular-nums', fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-1)', lineHeight: 1, marginBottom: '6px' }}>
                  {formatDuration(data.averageSessionDurationSeconds)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                  Across {data.totalSessions} logged sessions
                </div>
              </div>
            </div>

            {/* Task Completion Rate */}
            <div style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding: '28px 24px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '160px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <CheckSquare size={14} color="var(--text-3)" />
                <span className="text-meta">Task Completion</span>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-digits)', fontVariantNumeric: 'tabular-nums', fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-1)', lineHeight: 1, marginBottom: '6px' }}>
                  {data.taskCompletionRate}%
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                  {data.completedTasks} of {data.totalTasks} tasks done
                </div>
              </div>
            </div>

            {/* Top Subject */}
            <div style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding: '28px 24px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '160px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Star size={14} color="var(--text-3)" />
                <span className="text-meta">Top Subject</span>
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-1)', marginBottom: '4px', lineHeight: 1.2 }}>
                  {data.mostFocusedSubject || 'General Study'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 500 }}>
                  Peak day: <strong style={{ color: 'var(--text-2)' }}>{data.mostProductiveDayOfWeek || 'N/A'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* ── Two-column: Subject Allocation + Weekly Distribution ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            {/* Subject Time Allocation */}
            <div style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding: '28px',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <h3 style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-1)', marginBottom: '4px' }}>
                Subject Time Allocation
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '24px' }}>
                Proportional focus hours across coursework
              </p>

              {data.subjectBreakdown.length === 0 ? (
                <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>No subjects logged yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {data.subjectBreakdown.map((item) => (
                    <div key={item.subject}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '7px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{item.subject}</span>
                        <span style={{ fontFamily: 'var(--font-digits)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-2)' }}>
                          {formatDuration(item.durationSeconds)} — <strong style={{ color: 'var(--text-1)' }}>{item.percentage}%</strong>
                        </span>
                      </div>
                      <div style={{
                        width: '100%', height: '8px',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-pill)',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${item.percentage}%`,
                          backgroundColor: 'var(--accent)',
                          borderRadius: 'var(--radius-pill)',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weekly Study Consistency */}
            <div style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding: '28px',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <h3 style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-1)', marginBottom: '4px' }}>
                Weekly Study Consistency
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '24px' }}>
                Cumulative focus duration by day of the week
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {data.dayOfWeekBreakdown.map((item) => {
                  const isTopDay = item.dayOfWeek === data.mostProductiveDayOfWeek && item.durationSeconds > 0;
                  return (
                    <div
                      key={item.dayOfWeek}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        backgroundColor: isTopDay ? 'var(--sage)' : 'transparent',
                        borderBottom: isTopDay ? 'none' : '1px solid var(--border)',
                        borderRadius: isTopDay ? 'var(--radius-md)' : '0',
                        transition: 'var(--transition)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: isTopDay ? 700 : 500, color: 'var(--text-1)', minWidth: '96px' }}>
                          {item.dayOfWeek}
                        </span>
                        {isTopDay && (
                          <span className="badge badge-status-COMPLETED" style={{ fontSize: '9px', fontWeight: 700 }}>Top Day</span>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', fontFamily: 'var(--font-digits)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-2)', textAlign: 'right' }}>
                        {item.durationSeconds > 0 ? (
                          <>
                            <strong style={{ color: 'var(--text-1)' }}>{formatDuration(item.durationSeconds)}</strong>
                            <span style={{ color: 'var(--text-3)', marginLeft: '6px', fontSize: '11px' }}>({item.sessionCount} sessions)</span>
                          </>
                        ) : (
                          <span style={{ color: 'var(--text-3)' }}>No sessions</span>
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
