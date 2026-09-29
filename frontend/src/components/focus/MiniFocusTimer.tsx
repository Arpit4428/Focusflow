import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFocusTimer } from '../../hooks/useFocusTimer';
import { Play, Pause, ExternalLink } from 'lucide-react';

export const MiniFocusTimer: React.FC = () => {
  const {
    status,
    formattedTime,
    selectedSubjectName,
    selectedSubjectColor,
    pause,
    resume,
    isPipSupported,
    isPipActive,
    openPip,
    closePip,
  } = useFocusTimer();

  const location = useLocation();
  const navigate = useNavigate();

  // Mini timer is only visible during active focus sessions and outside the main focus page
  if (status !== 'RUNNING' && status !== 'PAUSED') {
    return null;
  }

  if (location.pathname === '/focus') {
    return null;
  }

  const isRunning = status === 'RUNNING';

  const handleClickContainer = () => {
    navigate('/focus');
  };

  const handleTogglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRunning) {
      pause();
    } else {
      resume();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClickContainer}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClickContainer();
        }
      }}
      className="mini-focus-timer"
      aria-label={`Mini Focus Timer: ${isRunning ? 'Focusing' : 'Paused'}, ${formattedTime}. Click to open full focus studio.`}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '28px',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: 'var(--surface-overlay)',
        border: '1px solid var(--border-strong)',
        borderRadius: '9999px',
        padding: '7px 12px 7px 16px',
        boxShadow: 'var(--shadow-lg)',
        backdropFilter: 'blur(12px)',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Status indicator & state label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isRunning ? 'var(--accent-olive)' : 'var(--accent-amber)',
            boxShadow: isRunning ? '0 0 8px rgba(68, 89, 62, 0.65)' : 'none',
            flexShrink: 0,
            transition: 'all 0.2s ease',
          }}
        />
        <span
          className="mini-timer-label"
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: isRunning ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          {isRunning ? 'Focusing' : 'Paused'}
        </span>
      </div>

      {/* Optional Subject Indicator */}
      {selectedSubjectName && (
        <>
          <span
            className="mini-timer-divider"
            style={{
              width: '1px',
              height: '14px',
              backgroundColor: 'var(--border)',
            }}
          />
          <div
            className="mini-timer-subject"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
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
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {selectedSubjectName}
            </span>
          </div>
        </>
      )}

      {/* Vertical Divider */}
      <span
        style={{
          width: '1px',
          height: '14px',
          backgroundColor: 'var(--border)',
        }}
      />

      {/* Elapsed Digital Time */}
      <div
        style={{
          fontFamily: 'var(--font-digits)',
          fontVariantNumeric: 'tabular-nums',
          fontFeatureSettings: '"tnum" 1',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
          minWidth: '64px',
          textAlign: 'center',
        }}
      >
        {formattedTime}
      </div>

      {/* Action Buttons: Pause/Resume + Pop Out */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          type="button"
          onClick={handleTogglePlayPause}
          title={isRunning ? 'Pause session' : 'Resume session'}
          aria-label={isRunning ? 'Pause session' : 'Resume session'}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isRunning ? 'var(--surface-raised)' : 'var(--accent)',
            color: isRunning ? 'var(--text-primary)' : 'var(--accent-inverse)',
            border: isRunning ? '1px solid var(--border)' : 'none',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isRunning ? (
            <Pause size={13} strokeWidth={2.5} />
          ) : (
            <Play size={13} fill="currentColor" strokeWidth={0} style={{ marginLeft: '1px' }} />
          )}
        </button>

        {isPipSupported && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isPipActive) {
                closePip();
              } else {
                openPip();
              }
            }}
            title={isPipActive ? 'Close floating window' : 'Pop out floating timer window'}
            aria-label={isPipActive ? 'Close floating window' : 'Pop out floating timer window'}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid transparent',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ExternalLink size={12} />
          </button>
        )}
      </div>
    </div>
  );
};
