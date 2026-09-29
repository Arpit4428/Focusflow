import React from 'react';
import type { DailyFocusStat } from '../../types/dashboard';

interface WeeklyBarChartProps {
  data: DailyFocusStat[];
}

export const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({ data }) => {
  const maxMinutes = Math.max(...data.map((d) => d.minutes), 60);
  const totalMinutes = data.reduce((acc, d) => acc + d.minutes, 0);

  return (
    <div style={{
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      padding: '28px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-1)', margin: 0, marginBottom: '3px' }}>
            Weekly Focus Rhythm
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: 0 }}>Daily study minutes — past 7 days</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.03em' }}>
            {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block', fontWeight: 600, marginTop: '1px' }}>
            7-day aggregate
          </span>
        </div>
      </div>

      {totalMinutes === 0 ? (
        <div style={{
          height: '160px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--border-strong)',
          color: 'var(--text-3)',
          fontSize: '13px',
          textAlign: 'center',
          padding: '24px',
        }}>
          No focus activity recorded in the past 7 days.
        </div>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          height: '160px',
          paddingTop: '20px',
          gap: '8px',
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
                title={`${dayStat.day}: ${dayStat.minutes} min`}
              >
                {/* Minute Label */}
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: dayStat.minutes > 0 ? 'var(--text-1)' : 'transparent',
                  marginBottom: '6px',
                  userSelect: 'none',
                }}>
                  {dayStat.minutes > 0 ? `${dayStat.minutes}m` : '0'}
                </span>

                {/* Bar */}
                <div style={{
                  width: '100%',
                  maxWidth: '36px',
                  height: `${heightPercent}%`,
                  borderRadius: '6px 6px 3px 3px',
                  backgroundColor: isToday
                    ? (dayStat.minutes > 0 ? 'var(--accent)' : 'var(--border-strong)')
                    : dayStat.minutes > 0
                    ? 'var(--sage-dark)'
                    : 'var(--bg-subtle)',
                  border: isToday ? '1px solid var(--accent-hover)' : 'none',
                  transition: 'height 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: 'pointer',
                }} />

                {/* Day Label */}
                <div style={{
                  fontSize: '11px',
                  fontWeight: isToday ? 700 : 500,
                  color: isToday ? 'var(--text-1)' : 'var(--text-3)',
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}>
                  {isToday ? 'Today' : dayStat.day}
                  {isToday && (
                    <span style={{
                      width: '4px', height: '4px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent)',
                      display: 'inline-block',
                    }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
