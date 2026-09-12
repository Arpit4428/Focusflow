import React from 'react';
import type { CalendarDayActivity } from '../../types/calendar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarGridProps {
  year: number;
  month: number; // 1-12
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  activities: CalendarDayActivity[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Convert 3 or 6 digit hex color to RGBA string with specified alpha
 */
function hexToRgba(hex: string, alpha: number): string {
  if (!hex) return `rgba(216, 226, 210, ${alpha})`;
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  if (c.length !== 6) {
    return `rgba(216, 226, 210, ${alpha})`;
  }
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Returns focus intensity alpha (0 to 0.90) based on duration in minutes.
 * Scale:
 * 0 min       -> 0 (neutral)
 * 1-30 min    -> 0.15
 * 31-60 min   -> 0.30
 * 61-120 min  -> 0.50
 * 121-180 min -> 0.70
 * 180+ min    -> 0.90
 */
function getIntensityAlpha(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes <= 30) return 0.15;
  if (minutes <= 60) return 0.30;
  if (minutes <= 120) return 0.50;
  if (minutes <= 180) return 0.70;
  return 0.90;
}

/**
 * Determine if text on this background needs to be light for high contrast
 */
function needsLightText(hex: string, alpha: number): boolean {
  if (alpha < 0.5) return false;
  let c = hex.replace('#', '').trim();
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  if (c.length !== 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 135;
}

/**
 * Option A: Determine dominant subject color (subject with highest focus duration)
 */
function getDominantSubjectColor(activity?: CalendarDayActivity): string | null {
  if (!activity) return null;
  if (activity.subjectBreakdown && activity.subjectBreakdown.length > 0) {
    let dominant = activity.subjectBreakdown[0];
    for (const sb of activity.subjectBreakdown) {
      if (sb.focusSeconds > dominant.focusSeconds) {
        dominant = sb;
      }
    }
    return dominant.color || '#94a3b8';
  }
  if (activity.sessions && activity.sessions.length > 0) {
    return activity.sessions[0].color || '#94a3b8';
  }
  return null;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  year,
  month,
  selectedDate,
  onSelectDate,
  activities,
  onPrevMonth,
  onNextMonth,
  onToday,
}) => {
  // Activity map by date
  const activityMap = React.useMemo(() => {
    const map = new Map<string, CalendarDayActivity>();
    for (const act of activities) {
      map.set(act.date, act);
    }
    return map;
  }, [activities]);

  const todayStr = React.useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Compute calendar days
  const calendarCells = React.useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInCurrentMonth = new Date(year, month, 0).getDate();
    const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

    const cells: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
    }> = [];

    // Leading days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({ dateStr, dayNum, isCurrentMonth: false });
    }

    // Days in current month
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dateStr, dayNum: d, isCurrentMonth: true });
    }

    // Trailing days from next month to fill grid to multiple of 7
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }

    return cells;
  }, [year, month]);

  return (
    <div style={{
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      boxShadow: 'var(--shadow-card)',
    }}>
      {/* Month Navigation Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            margin: 0,
          }}>
            {MONTH_NAMES[month - 1]} {year}
          </h2>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Study Activity
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onToday}
            className="btn btn-outline"
            style={{ padding: '6px 14px', fontSize: '12px', height: '34px' }}
          >
            Today
          </button>
          <div style={{ display: 'flex', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
            <button
              onClick={onPrevMonth}
              aria-label="Previous month"
              style={{
                padding: '7px 12px',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <div style={{ width: '1px', backgroundColor: 'var(--border-strong)' }} />
            <button
              onClick={onNextMonth}
              aria-label="Next month"
              style={{
                padding: '7px 12px',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Names Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '6px',
        marginBottom: '8px',
        textAlign: 'center',
      }}>
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--text-muted)',
              padding: '6px 0',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 7-Column Grid Cells with Study Intensity Heatmap */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '6px',
      }}>
        {calendarCells.map((cell) => {
          const isSelected = cell.dateStr === selectedDate;
          const isToday = cell.dateStr === todayStr;
          const activity = activityMap.get(cell.dateStr);
          const focusMinutes = activity ? activity.totalFocusMinutes : 0;
          const hasFocus = focusMinutes > 0;
          const hasTasks = activity && activity.taskCount > 0;

          // Subject-Aware Color & Intensity Math
          const dominantColor = hasFocus ? getDominantSubjectColor(activity) || '#94a3b8' : null;
          const alpha = getIntensityAlpha(focusMinutes);
          const isTextLight = dominantColor ? needsLightText(dominantColor, alpha) : false;

          let cellBg = 'transparent';
          if (isSelected) {
            cellBg = hasFocus && dominantColor
              ? hexToRgba(dominantColor, Math.max(0.35, alpha))
              : 'var(--surface-sage)';
          } else if (hasFocus && dominantColor) {
            cellBg = hexToRgba(dominantColor, alpha);
          } else if (isToday) {
            cellBg = 'var(--bg-secondary)';
          } else if (cell.isCurrentMonth) {
            cellBg = 'var(--surface)';
          }

          const dayNumColor = isSelected
            ? 'var(--text-primary)'
            : isTextLight
            ? '#FFFFFF'
            : cell.isCurrentMonth
            ? 'var(--text-primary)'
            : 'var(--text-muted)';

          const metaTextColor = isTextLight
            ? 'rgba(255, 255, 255, 0.9)'
            : 'var(--text-secondary)';

          return (
            <button
              key={cell.dateStr}
              onClick={() => onSelectDate(cell.dateStr)}
              type="button"
              style={{
                minHeight: '76px',
                padding: '8px 6px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: cellBg,
                border: isSelected
                  ? '2px solid var(--accent-primary)'
                  : isToday
                  ? '1px solid var(--accent-primary)'
                  : '1px solid var(--border)',
                opacity: cell.isCurrentMonth ? 1 : 0.38,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'stretch',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              {/* Day Header: Number + Focus Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '13px',
                  fontWeight: isSelected || isToday ? 700 : 500,
                  color: dayNumColor,
                }}>
                  {cell.dayNum}
                </span>

                {hasFocus && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: isTextLight ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.08)',
                    color: isTextLight ? '#FFFFFF' : 'var(--text-primary)',
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-pill)',
                    lineHeight: '1.3',
                  }}>
                    {focusMinutes}m
                  </span>
                )}
              </div>

              {/* Day Body: Task Count + Subject Color Dots */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                {hasTasks && activity && (
                  <div style={{
                    fontSize: '10px',
                    color: metaTextColor,
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {activity.completedTaskCount}/{activity.taskCount} tasks
                  </div>
                )}

                {activity && activity.subjectBreakdown && activity.subjectBreakdown.length > 0 && (
                  <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '2px' }}>
                    {activity.subjectBreakdown.slice(0, 4).map((sub, sIdx) => (
                      <span
                        key={sIdx}
                        title={`${sub.subjectName} (${sub.focusMinutes}m)`}
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: sub.color || '#94a3b8',
                          boxShadow: isTextLight ? '0 0 0 1px rgba(255, 255, 255, 0.6)' : '0 0 0 1px rgba(0, 0, 0, 0.1)',
                          display: 'inline-block',
                        }}
                      />
                    ))}
                    {activity.subjectBreakdown.length > 4 && (
                      <span style={{ fontSize: '9px', color: metaTextColor }}>+</span>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Subtle Unobtrusive Study Intensity Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '8px',
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1px solid var(--border)',
        fontSize: '11px',
        color: 'var(--text-muted)',
      }}>
        <span>Less focus</span>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span
            style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
            title="0 min"
          />
          <span
            style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(31, 76, 39, 0.15)' }}
            title="1–30 min"
          />
          <span
            style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(31, 76, 39, 0.30)' }}
            title="31–60 min"
          />
          <span
            style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(31, 76, 39, 0.50)' }}
            title="61–120 min"
          />
          <span
            style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(31, 76, 39, 0.70)' }}
            title="121–180 min"
          />
          <span
            style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(31, 76, 39, 0.90)' }}
            title="180+ min"
          />
        </div>
        <span>More focus</span>
      </div>
    </div>
  );
};
