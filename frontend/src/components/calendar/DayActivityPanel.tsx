import React from 'react';
import type { CalendarDayActivity } from '../../types/calendar';
import {
  Clock,
  CheckCircle2,
  Circle,
  Calendar as CalendarIcon,
  Play,
  Layers,
} from 'lucide-react';

interface DayActivityPanelProps {
  dateStr: string;
  activity: CalendarDayActivity | undefined;
  onToggleTask?: (taskId: string) => void;
}

export const DayActivityPanel: React.FC<DayActivityPanelProps> = ({
  dateStr,
  activity,
  onToggleTask,
}) => {
  // Format human-friendly date
  const formattedDate = React.useMemo(() => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }, [dateStr]);

  const formatSeconds = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m`;
    return `${totalSecs}s`;
  };

  const formatTime = (isoString: string) => {
    try {
      const dt = new Date(isoString);
      return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const hasContent =
    activity &&
    (activity.totalFocusSeconds > 0 ||
      (activity.tasks && activity.tasks.length > 0) ||
      (activity.sessions && activity.sessions.length > 0));

  return (
    <div style={{
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      padding: '28px',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    }}>
      {/* Panel Header */}
      <div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: 'var(--text-muted)',
          marginBottom: '6px',
        }}>
          <CalendarIcon size={13} />
          <span>DAY OVERVIEW</span>
        </div>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
          margin: 0,
        }}>
          {formattedDate}
        </h3>
      </div>

      {/* Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
      }}>
        <div style={{
          padding: '16px',
          backgroundColor: 'var(--surface-sage)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
            <Clock size={13} />
            <span>Focus Time</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginTop: '4px' }}>
            {activity ? formatSeconds(activity.totalFocusSeconds) : '0m'}
          </div>
        </div>

        <div style={{
          padding: '16px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            <CheckCircle2 size={13} />
            <span>Tasks Done</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginTop: '4px' }}>
            {activity ? `${activity.completedTaskCount} / ${activity.taskCount}` : '0 / 0'}
          </div>
        </div>
      </div>

      {!hasContent ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 16px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border)',
          color: 'var(--text-secondary)',
          fontSize: '13px',
        }}>
          <p style={{ margin: 0 }}>No study sessions or tasks logged for this date.</p>
        </div>
      ) : (
        <>
          {/* Focus By Subject Breakdown */}
          {activity?.subjectBreakdown && activity.subjectBreakdown.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Layers size={15} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Focus by Subject
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activity.subjectBreakdown.map((sb, idx) => {
                  const pct = activity.totalFocusSeconds > 0
                    ? Math.round((sb.focusSeconds / activity.totalFocusSeconds) * 100)
                    : 0;
                  return (
                    <div key={idx} style={{ fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: sb.color || '#94a3b8',
                            }}
                          />
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {sb.subjectName}
                          </span>
                        </div>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {formatSeconds(sb.focusSeconds)} ({pct}%)
                        </span>
                      </div>
                      <div style={{
                        height: '6px',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-pill)',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          backgroundColor: sb.color || '#94a3b8',
                          borderRadius: 'var(--radius-pill)',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tasks Due on this Day */}
          {activity?.tasks && activity.tasks.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Scheduled Tasks ({activity.tasks.length})
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activity.tasks.map((task) => {
                  const isCompleted = task.status === 'COMPLETED';
                  return (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        backgroundColor: isCompleted ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        opacity: isCompleted ? 0.65 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                        {onToggleTask ? (
                          <button
                            type="button"
                            onClick={() => onToggleTask(task.id)}
                            style={{ background: 'none', padding: 0, display: 'flex', alignItems: 'center', color: isCompleted ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                          >
                            {isCompleted ? <CheckCircle2 size={18} color="var(--accent-primary)" /> : <Circle size={18} />}
                          </button>
                        ) : (
                          isCompleted ? <CheckCircle2 size={18} color="var(--accent-primary)" /> : <Circle size={18} color="var(--text-muted)" />
                        )}
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            textDecoration: isCompleted ? 'line-through' : 'none',
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {task.title}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: task.color || '#94a3b8',
                              }}
                            />
                            <span>{task.subject}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`badge badge-priority-${task.priority}`} style={{ flexShrink: 0, fontSize: '10px' }}>
                        {task.priority}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Focus Sessions Logged on this Day */}
          {activity?.sessions && activity.sessions.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Play size={14} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Focus Sessions ({activity.sessions.length})
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activity.sessions.map((sess) => (
                  <div
                    key={sess.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: sess.color || '#94a3b8',
                        }}
                      />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {sess.subject}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {sess.startedAt ? formatTime(sess.startedAt) : ''}
                          {sess.endedAt ? ` - ${formatTime(sess.endedAt)}` : ''}
                        </div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: 'var(--surface-sage)',
                      color: 'var(--text-primary)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-pill)',
                    }}>
                      {formatSeconds(sess.duration)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
