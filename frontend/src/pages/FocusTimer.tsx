import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFocusTimer } from '../hooks/useFocusTimer';
import { subjectService } from '../services/subjectService';
import { sessionService } from '../services/sessionService';
import { FocusHistoryList } from '../components/focus/FocusHistoryList';
import type { Subject } from '../types/subject';
import type { FocusSession } from '../types/session';
import type { ApiError } from '../types/auth';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  AlertCircle,
  Clock,
  BookOpen,
  ExternalLink,
  Info,
} from 'lucide-react';

export const FocusTimer: React.FC = () => {
  const {
    status,
    formattedTime,
    elapsedSeconds,
    targetDurationSeconds,
    setTargetDuration,
    selectedSubjectId,
    selectedSubjectName,
    selectedSubjectColor,
    start,
    pause,
    resume,
    stopAndSave,
    reset,
    setSelectedSubject,
    isPipSupported,
    isPipActive,
    openPip,
    closePip,
  } = useFocusTimer();

  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [todaySessions, setTodaySessions] = useState<FocusSession[]>([]);
  const [todaySeconds, setTodaySeconds] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const fetchSubjects = useCallback(async () => {
    setLoadingSubjects(true);
    try {
      const data = await subjectService.getSubjects();
      setSubjects(data);
    } catch {
      // silent
    } finally {
      setLoadingSubjects(false);
    }
  }, []);

  const fetchTodaySessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const allSessions = await sessionService.getSessions();
      const todayStr = new Date().toISOString().slice(0, 10);
      const sessions = allSessions.filter((s: FocusSession) =>
        new Date(s.startedAt).toISOString().slice(0, 10) === todayStr
      );
      setTodaySessions(sessions);
      const totalSec = sessions.reduce((acc: number, s: FocusSession) => acc + s.duration, 0);
      setTodaySeconds(totalSec);
    } catch {
      // silent
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
    fetchTodaySessions();
  }, [fetchSubjects, fetchTodaySessions]);

  // Notify on session completion
  useEffect(() => {
    if (status === 'COMPLETED') {
      setFeedback({ type: 'success', message: 'Focus session completed! Great work.' });
      fetchTodaySessions();
    }
  }, [status, fetchTodaySessions]);

  const formatSecondsHuman = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return `${sec}s`;
  };

  // Ensure default session duration (25m) when idle
  useEffect(() => {
    if (status === 'IDLE' && targetDurationSeconds !== 25 * 60) {
      setTargetDuration(25 * 60);
    }
  }, [status, targetDurationSeconds, setTargetDuration]);

  const handleStart = () => {
    if (!selectedSubjectId) {
      setFeedback({ type: 'error', message: 'Please select a subject before starting a focus session.' });
      return;
    }

    if (targetDurationSeconds < 10) {
      setFeedback({ type: 'error', message: 'Minimum focus session duration is 10 seconds.' });
      return;
    }

    setFeedback(null);
    const result = start();
    if (!result.success && result.error) {
      setFeedback({ type: 'error', message: result.error });
    }
  };

  const handleStop = async () => {
    setFeedback(null);
    try {
      await stopAndSave();
      setFeedback({ type: 'success', message: 'Session saved! Great work.' });
      await fetchTodaySessions();
    } catch (err) {
      const apiErr = err as ApiError;
      setFeedback({ type: 'error', message: apiErr.message || 'Failed to save session.' });
    }
  };

  const handleReset = () => {
    reset();
    setFeedback(null);
    fetchTodaySessions();
  };

  const handleDeleteSession = async (id: string) => {
    await sessionService.deleteSession(id);
    setTodaySessions((prev) => prev.filter((s) => s.id !== id));
  };

  const isIdle = status === 'IDLE';
  const isRunning = status === 'RUNNING';
  const isPaused = status === 'PAUSED';
  const isCompleted = status === 'COMPLETED';
  const isActive = isRunning || isPaused;

  const duration = targetDurationSeconds > 0 ? targetDurationSeconds : 25 * 60;
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / duration) * 100));

  return (
    <div className="page-enter" style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: '36px' }}>
        <div className="text-meta" style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>Deep Work Studio</div>
        <h1 className="title-hero">Focus Timer</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px', lineHeight: 1.5 }}>
          Start a timed study session and track your focused productivity.
        </p>
      </div>

      {/* ── Feedback Banner ── */}
      {feedback && (
        <div className={`alert-banner alert-${feedback.type === 'success' ? 'success' : 'danger'}`} style={{ marginBottom: '24px' }}>
          <AlertCircle size={15} />
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} style={{ marginLeft: 'auto', background: 'none', color: 'inherit', opacity: 0.7 }}>×</button>
        </div>
      )}

      {/* ── Main Timer Block ── */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        marginBottom: '20px',
      }}>
        {/* Top status bar & progress track */}
        <div style={{
          backgroundColor: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border)',
          transition: 'background-color 0.3s ease',
        }}>
          <div style={{
            padding: '12px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isRunning && (
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-olive)',
                  boxShadow: '0 0 0 2px var(--accent-olive-light)',
                  animation: 'pulseDot 1.4s ease-in-out infinite',
                }} />
              )}
              {isPaused && (
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-amber)',
                }} />
              )}
              {isIdle && (
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--text-dim)',
                }} />
              )}
              {isCompleted && (
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#86EFAC',
                }} />
              )}
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                color: isRunning ? 'var(--text-primary)' : isPaused ? 'var(--accent-amber)' : isCompleted ? '#86EFAC' : 'var(--text-muted)',
              }}>
                {isRunning ? 'Session Running' : isPaused ? 'Session Paused' : isCompleted ? 'Session Completed' : 'Ready to Focus'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {selectedSubjectName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: selectedSubjectColor || 'var(--accent-olive)',
                  }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {selectedSubjectName}
                  </span>
                </div>
              )}

              {/* Header pop-out quick button when active */}
              {isPipSupported && isActive && (
                <button
                  type="button"
                  onClick={isPipActive ? closePip : openPip}
                  className="btn btn-outline"
                  style={{
                    padding: '3px 10px',
                    fontSize: '11px',
                    height: '26px',
                    borderRadius: 'var(--radius-btn)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                  title={isPipActive ? 'Close floating window' : 'Pop out floating mini window'}
                >
                  <ExternalLink size={12} />
                  <span>{isPipActive ? 'Floating Active' : 'Pop Out'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Progress track */}
          {isActive && (
            <div
              style={{
                height: '3px',
                width: '100%',
                backgroundColor: 'var(--border-subtle)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  backgroundColor: isRunning ? 'var(--accent-olive)' : 'var(--accent-amber)',
                  transition: 'width 0.4s ease, background-color 0.3s ease',
                }}
              />
            </div>
          )}
        </div>

        <div style={{ padding: '48px 36px 44px' }}>
          {/* ── Giant Timer Display ── */}
          <div style={{
            textAlign: 'center',
            fontFamily: 'var(--font-digits)',
            fontVariantNumeric: 'tabular-nums',
            fontFeatureSettings: '"tnum" 1',
            fontSize: 'clamp(64px, 14vw, 108px)',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: isRunning ? 'var(--text-primary)' : isPaused ? 'var(--accent-amber)' : isCompleted ? '#86EFAC' : 'var(--text-primary)',
            lineHeight: 1,
            marginBottom: '36px',
            transition: 'color 0.3s ease',
          }}>
            {formattedTime}
          </div>

          {/* ── Subject Selector (only visible when idle) ── */}
          {isIdle && (
            <div style={{ marginBottom: '36px' }}>
              <label className="form-label" style={{ textAlign: 'center', display: 'block', marginBottom: '14px' }}>
                Select Subject to Focus On
              </label>
              {loadingSubjects ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Loading subjects...</p>
              ) : subjects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-lg)' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>No subjects yet.</p>
                  <button onClick={() => navigate('/subjects')} className="btn btn-outline" style={{ fontSize: '12px', padding: '7px 16px' }}>
                    <BookOpen size={13} />
                    <span>Create a Subject</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {subjects.map((sub) => {
                    const isSelected = selectedSubjectId === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSelectedSubject(sub.id, sub.name, sub.color || '')}
                        className={`subject-select-btn ${isSelected ? 'is-selected' : ''}`}
                      >
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: sub.color || 'var(--accent-olive)',
                          flexShrink: 0,
                        }} />
                        <span>{sub.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Active session subject badge (RUNNING/PAUSED) ── */}
          {isActive && selectedSubjectName && (
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-badge)',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: selectedSubjectColor || 'var(--accent-olive)' }} />
                <span>{selectedSubjectName}</span>
              </div>
            </div>
          )}

          {/* ── Action Buttons ── */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            {isIdle && (
              <>
                <button onClick={handleStart} className="btn btn-primary" style={{ padding: '12px 32px', fontSize: '15px', minWidth: '160px' }}>
                  <Play size={16} fill="currentColor" />
                  <span>Start Session</span>
                </button>

                {isPipSupported && (
                  <button
                    type="button"
                    onClick={() => {
                      setFeedback({
                        type: 'error',
                        message: 'Select a subject and click "Start Session" to open the floating mini window.',
                      });
                    }}
                    className="btn btn-outline"
                    style={{ padding: '12px 20px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '7px' }}
                    title="Pop out floating timer (requires active session)"
                  >
                    <ExternalLink size={14} />
                    <span>Pop out timer</span>
                  </button>
                )}
              </>
            )}

            {isRunning && (
              <>
                <button onClick={pause} className="btn btn-outline" style={{ padding: '12px 28px', fontSize: '15px' }}>
                  <Pause size={15} />
                  <span>Pause</span>
                </button>
                <button
                  onClick={handleStop}
                  className="btn btn-primary"
                  style={{ padding: '12px 28px', fontSize: '15px' }}
                >
                  <Square size={14} fill="currentColor" />
                  <span>End &amp; Save</span>
                </button>
              </>
            )}

            {isPaused && (
              <>
                <button onClick={resume} className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '15px' }}>
                  <Play size={16} fill="currentColor" />
                  <span>Resume</span>
                </button>
                <button
                  onClick={handleStop}
                  className="btn btn-outline"
                  style={{ padding: '12px 28px', fontSize: '15px' }}
                >
                  <Square size={14} fill="currentColor" />
                  <span>End &amp; Save</span>
                </button>
              </>
            )}

            {isActive && (
              <>
                {/* Pop out timer button / Fallback indicator */}
                {isPipSupported ? (
                  <button
                    type="button"
                    onClick={isPipActive ? closePip : openPip}
                    className="btn btn-outline"
                    style={{
                      padding: '12px 22px',
                      fontSize: '15px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    title={isPipActive ? 'Dock floating timer back to page' : 'Pop out timer into an always-on-top floating mini player'}
                  >
                    <ExternalLink size={15} />
                    <span>{isPipActive ? 'Dock Timer' : 'Pop out timer'}</span>
                  </button>
                ) : (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-btn)',
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                    }}
                    title="Document Picture-in-Picture API is supported in Chrome & Edge (v116+). The in-app mini timer remains active when navigating across Veyro."
                  >
                    <Info size={13} />
                    <span>In-app mini timer active</span>
                  </div>
                )}

                <button onClick={handleReset} className="btn btn-danger" style={{ padding: '12px 20px', fontSize: '15px' }}>
                  <RotateCcw size={14} />
                  <span>Reset</span>
                </button>
              </>
            )}

            {isCompleted && (
              <button
                onClick={handleReset}
                className="btn btn-primary"
                style={{ padding: '12px 32px', fontSize: '15px', minWidth: '180px' }}
              >
                <RotateCcw size={15} />
                <span>Start New Session</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Today Stats ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Clock size={15} color="var(--text-muted)" />
            <span className="text-meta">Today's Focus Time</span>
          </div>
          <div style={{ fontFamily: 'var(--font-digits)', fontVariantNumeric: 'tabular-nums', fontSize: '28px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            {loadingSessions ? '—' : formatSecondsHuman(todaySeconds)}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Play size={15} color="var(--text-muted)" />
            <span className="text-meta">Sessions Today</span>
          </div>
          <div style={{ fontFamily: 'var(--font-digits)', fontVariantNumeric: 'tabular-nums', fontSize: '28px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            {loadingSessions ? '—' : todaySessions.length}
          </div>
        </div>
      </div>

      {/* ── Today's Sessions History ── */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px', letterSpacing: '-0.01em' }}>
          Today's Sessions
        </h3>
        {loadingSessions ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ width: '28px', height: '28px', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          </div>
        ) : (
          <FocusHistoryList
            sessions={todaySessions}
            onDeleteSession={handleDeleteSession}
            emptyMessage="No sessions completed today yet. Start a timer to record your first session!"
          />
        )}
      </div>
    </div>
  );
};
