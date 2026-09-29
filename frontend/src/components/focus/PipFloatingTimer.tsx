import React from 'react';
import { useFocusTimer } from '../../hooks/useFocusTimer';
import { Play, Pause, Square, ExternalLink } from 'lucide-react';

interface PipFloatingTimerProps {
  onClose: () => void;
  onFocusOpener: () => void;
}

export const PipFloatingTimer: React.FC<PipFloatingTimerProps> = ({ onClose, onFocusOpener }) => {
  const {
    status,
    formattedTime,
    elapsedSeconds,
    selectedSubjectName,
    selectedSubjectColor,
    targetDurationSeconds,
    pause,
    resume,
    stopAndSave,
  } = useFocusTimer();

  const isRunning = status === 'RUNNING';
  const isPaused = status === 'PAUSED';

  const duration = targetDurationSeconds > 0 ? targetDurationSeconds : 25 * 60;
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / duration) * 100));

  const handleTogglePlayPause = () => {
    if (isRunning) {
      pause();
    } else {
      resume();
    }
  };

  const handleEndSession = async () => {
    try {
      await stopAndSave();
    } finally {
      onClose();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        padding: '16px 20px',
        boxSizing: 'border-box',
        backgroundColor: 'var(--bg)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
        userSelect: 'none',
      }}
    >
      {/* ── Top Bar: Veyro Identity & Status Badge ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        {/* Brand identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '4px',
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-inverse)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 800,
            }}
          >
            ✦
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
            }}
          >
            VEYRO
          </span>
        </div>

        {/* Status & Subject Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', maxWidth: '180px', overflow: 'hidden' }}>
          {selectedSubjectName && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 7px',
                borderRadius: 'var(--radius-badge)',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                fontSize: '10.5px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: selectedSubjectColor || 'var(--accent-olive)',
                  flexShrink: 0,
                }}
              />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedSubjectName}
              </span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '2px 7px',
              borderRadius: 'var(--radius-badge)',
              backgroundColor: isRunning ? 'var(--accent-olive-light)' : 'var(--accent-amber-subtle)',
              border: `1px solid ${isRunning ? 'rgba(68, 89, 62, 0.3)' : 'rgba(212, 168, 67, 0.3)'}`,
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: isRunning ? 'var(--text-primary)' : 'var(--accent-amber)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isRunning ? 'var(--accent-olive)' : 'var(--accent-amber)',
                boxShadow: isRunning ? '0 0 6px rgba(68, 89, 62, 0.8)' : 'none',
              }}
            />
            <span>{isRunning ? 'Focus' : 'Paused'}</span>
          </div>
        </div>
      </div>

      {/* ── Centerpiece: Large Elegant Digital Countdown ── */}
      <div style={{ textAlign: 'center', margin: 'auto 0' }}>
        <div
          style={{
            fontFamily: 'var(--font-digits)',
            fontVariantNumeric: 'tabular-nums',
            fontFeatureSettings: '"tnum" 1',
            fontSize: '44px',
            fontWeight: 600,
            letterSpacing: '-0.025em',
            color: isRunning ? 'var(--text-primary)' : isPaused ? 'var(--accent-amber)' : 'var(--text-primary)',
            lineHeight: 1.1,
            transition: 'color 0.2s ease',
          }}
        >
          {formattedTime}
        </div>

        {/* Thin Animated Progress Line */}
        <div
          style={{
            width: '180px',
            height: '3px',
            backgroundColor: 'var(--border-subtle)',
            borderRadius: '2px',
            margin: '8px auto 0',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: isRunning ? 'var(--accent-olive)' : 'var(--accent-amber)',
              borderRadius: '2px',
              transition: 'width 0.4s ease, background-color 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* ── Bottom Controls ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          paddingTop: '6px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Pause / Resume Button */}
          <button
            type="button"
            onClick={handleTogglePlayPause}
            className={isRunning ? 'btn btn-outline' : 'btn btn-primary'}
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              borderRadius: 'var(--radius-btn)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            {isRunning ? (
              <>
                <Pause size={12} strokeWidth={2.2} />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play size={12} fill="currentColor" strokeWidth={0} />
                <span>Resume</span>
              </>
            )}
          </button>

          {/* End Session Button */}
          <button
            type="button"
            onClick={handleEndSession}
            className="btn btn-outline"
            style={{
              padding: '5px 11px',
              fontSize: '12px',
              borderRadius: 'var(--radius-btn)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
            title="End and save session"
          >
            <Square size={11} fill="currentColor" />
            <span>End</span>
          </button>
        </div>

        {/* Return to App Button */}
        <button
          type="button"
          onClick={onFocusOpener}
          className="btn btn-ghost"
          style={{
            padding: '5px 8px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title="Switch to Veyro tab"
        >
          <ExternalLink size={12} />
          <span>App</span>
        </button>
      </div>
    </div>
  );
};
