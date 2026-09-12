import React from 'react';
import type { DailyFocusStat } from '../../types/dashboard';

interface WeeklyBarChartProps {
  data: DailyFocusStat[];
}

export const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({ data }) => {
  // Find maximum minutes for scaling (minimum scale ceiling of 60 mins to keep empty charts sensible)
  const maxMinutes = Math.max(...data.map((d) => d.minutes), 60);

  const totalMinutes = data.reduce((acc, d) => acc + d.minutes, 0);

  return (
    <div style={{
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '28px',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Weekly Focus Rhythm
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Daily study minutes over the past 7 days</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', fontWeight: 500 }}>
            7-day aggregate
          </span>
        </div>
      </div>

      {totalMinutes === 0 ? (
        <div style={{
          height: '180px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border)',
          color: 'var(--text-secondary)',
          fontSize: '13px',
          textAlign: 'center',
          padding: '24px',
        }}>
          No focus activity recorded in the past 7 days. Start a timer to build your study rhythm!
        </div>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          height: '180px',
          paddingTop: '20px',
          gap: '12px',
        }}>
          {data.map((dayStat, idx) => {
            const heightPercent = Math.max(6, Math.round((dayStat.minutes / maxMinutes) * 100));
            const isToday = idx === data.length - 1;

            return (
              <div
                key={dayStat.date}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
                title={`${dayStat.day}, ${dayStat.date}: ${dayStat.minutes} minutes (${Math.floor(dayStat.seconds / 3600)}h ${Math.floor((dayStat.seconds % 3600) / 60)}m)`}
              >
                {/* Minute Value Tooltip/Label */}
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: dayStat.minutes > 0 ? 'var(--text-primary)' : 'transparent',
                  marginBottom: '8px',
                  userSelect: 'none',
                }}>
                  {dayStat.minutes > 0 ? `${dayStat.minutes}m` : '0'}
                </span>

                {/* Vertical Bar */}
                <div style={{
                  width: '100%',
                  maxWidth: '38px',
                  height: `${heightPercent}%`,
                  borderRadius: '10px 10px 4px 4px',
                  backgroundColor: isToday
                    ? (dayStat.minutes > 0 ? 'var(--accent-mustard)' : 'var(--border-strong)')
                    : dayStat.minutes > 0
                    ? 'var(--surface-sage)'
                    : 'var(--bg-secondary)',
                  border: isToday ? '1px solid var(--border-strong)' : 'none',
                  boxShadow: isToday && dayStat.minutes > 0 ? '0 2px 6px rgba(214, 184, 90, 0.3)' : 'none',
                  transition: 'height 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: 'pointer',
                }} />

                {/* Day Label */}
                <span style={{
                  fontSize: '12px',
                  fontWeight: isToday ? 700 : 500,
                  color: isToday ? 'var(--text-primary)' : 'var(--text-muted)',
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  {isToday ? 'Today' : dayStat.day}
                  {isToday && (
                    <span style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-mustard)',
                      display: 'inline-block',
                    }} />
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

