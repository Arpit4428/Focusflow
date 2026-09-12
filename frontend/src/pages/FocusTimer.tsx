import React, { useState, useEffect, useCallback } from 'react';
import { useTimer } from '../hooks/useTimer';
import { sessionService } from '../services/sessionService';
import { taskService } from '../services/taskService';
import { FocusHistoryList } from '../components/focus/FocusHistoryList';
import type { FocusSession } from '../types/session';
import type { ApiError } from '../types/auth';
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  Clock,
  CheckCircle,
  AlertCircle,
  Flame,
} from 'lucide-react';

export const FocusTimer: React.FC = () => {
  const { status, formattedTime, start, pause, resume, stop, reset } = useTimer();

  const [subject, setSubject] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [recentSessions, setRecentSessions] = useState<FocusSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  // Fetch subjects from existing tasks and recent sessions
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sessions, tasks] = await Promise.all([
        sessionService.getSessions(),
        taskService.getTasks(),
      ]);

      setRecentSessions(sessions);

      // Extract unique subject names
      const subjectsFromTasks = tasks.map((t) => t.subject);
      const subjectsFromSessions = sessions.map((s) => s.subject);
      const combined: string[] = Array.from(new Set([...subjectsFromTasks, ...subjectsFromSessions])).filter(Boolean);

      if (combined.length > 0) {
        setAvailableSubjects(combined);
        setSubject((prev) => prev || combined[0]);
      } else {
        setSubject((prev) => prev || 'General Study');
      }
    } catch {
      // Fallback
      setSubject((prev) => prev || 'General Study');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate today's focus time in seconds
  const todayFocusSeconds = recentSessions
    .filter((s) => {
      const sessionDate = new Date(s.startedAt).toDateString();
      const today = new Date().toDateString();
      return sessionDate === today;
    })
    .reduce((sum, s) => sum + s.duration, 0);

  const formatTotalTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m ${totalSecs % 60}s`;
  };

  const handleStart = () => {
    if (!subject.trim()) {
      setFeedbackMessage({ type: 'warning', text: 'Please enter or select a study subject before starting.' });
      return;
    }
    setFeedbackMessage(null);
    start();
  };

  const handleStop = async () => {
    const sessionData = stop();
    if (!sessionData) {
      reset();
      return;
    }

    // Meaningful duration check: sessions under 10 seconds are not saved
    if (sessionData.durationSeconds < 10) {
      setFeedbackMessage({
        type: 'warning',
        text: 'Session was under 10 seconds and was not saved to history.',
      });
      reset();
      return;
    }

    setIsSaving(true);
    setFeedbackMessage(null);

    try {
      const saved = await sessionService.createSession({
        subject: subject.trim(),
        duration: sessionData.durationSeconds,
        startedAt: sessionData.startedAt,
        endedAt: sessionData.endedAt,
        completed: true,
      });

      setRecentSessions((prev) => [saved, ...prev]);
      setFeedbackMessage({
        type: 'success',
        text: `Great work! Logged ${Math.floor(sessionData.durationSeconds / 60)}m ${sessionData.durationSeconds % 60}s of focused study for ${subject}.`,
      });
      reset();
    } catch (err) {
      const apiErr = err as ApiError;
      setFeedbackMessage({
        type: 'error',
        text: apiErr.message || 'Failed to save focus session to MongoDB.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    await sessionService.deleteSession(id);
    setRecentSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'RUNNING':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--accent-lime)',
            color: '#111111',
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            boxShadow: '0 2px 8px rgba(231, 255, 99, 0.4)',
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#111111',
              animation: 'spin 2s linear infinite',
            }} />
            FOCUS SESSION ACTIVE
          </span>
        );
      case 'PAUSED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#FCEFD8',
            color: '#8C5914',
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}>
            <Pause size={13} /> SESSION PAUSED
          </span>
        );
      case 'COMPLETED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--surface)',
            color: '#1F4C27',
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '12px',
            fontWeight: 600,
          }}>
            <CheckCircle size={13} /> SESSION SAVED
          </span>
        );
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            color: 'var(--text-secondary)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.03em',
          }}>
            READY TO FOCUS
          </span>
        );
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
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
          <span>Deep Concentration Studio</span>
        </div>
        <h1 className="title-hero">
          Focus Study Timer
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '6px' }}>
          Lock in your concentration, track active minutes, and build uninterrupted academic momentum.
        </p>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`alert-banner ${
            feedbackMessage.type === 'success'
              ? 'alert-success'
              : feedbackMessage.type === 'warning'
              ? 'alert-banner'
              : 'alert-danger'
          }`}
          style={{
            backgroundColor: feedbackMessage.type === 'warning' ? '#FCEFD8' : undefined,
            color: feedbackMessage.type === 'warning' ? '#8C5914' : undefined,
            border: feedbackMessage.type === 'warning' ? '1px solid rgba(245, 158, 11, 0.3)' : undefined,
          }}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{feedbackMessage.text}</span>
          <button
            onClick={() => setFeedbackMessage(null)}
            style={{ marginLeft: 'auto', background: 'none', color: 'inherit', padding: '2px 6px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Immersive Timer Studio Container */}
      <div style={{
        backgroundColor: 'var(--surface-mint)',
        borderRadius: 'var(--radius-lg)',
        padding: '56px 40px 48px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-card)',
        marginBottom: '36px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Organic subtle glow when running */}
        {status === 'RUNNING' && (
          <div style={{
            position: 'absolute',
            top: '-80px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '380px',
            height: '240px',
            background: 'radial-gradient(circle, rgba(231, 255, 99, 0.5) 0%, transparent 70%)',
            filter: 'blur(30px)',
            pointerEvents: 'none',
          }} />
        )}

        {/* Status Pill */}
        <div style={{ marginBottom: '28px' }}>
          {getStatusBadge()}
        </div>

        {/* Large Digital Timer Display */}
        <div style={{
          fontSize: 'clamp(56px, 14vw, 92px)',
          fontWeight: 600,
          letterSpacing: '-0.04em',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          color: 'var(--text-primary)',
          lineHeight: 1,
          marginBottom: '28px',
        }}>
          {formattedTime}
        </div>

        {/* Subject Selection / Active Indicator */}
        <div style={{ maxWidth: '380px', margin: '0 auto 36px' }}>
          {status === 'RUNNING' || status === 'PAUSED' ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}>
              <span>Subject:</span>
              <span style={{ color: '#111111', textDecoration: 'underline' }}>{subject}</span>
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                Study Subject / Topic:
              </label>
              <input
                type="text"
                className="form-input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Algorithms &amp; Data Structures"
                style={{
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '15px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--surface)',
                }}
              />

              {availableSubjects.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px', justifyContent: 'center' }}>
                  {availableSubjects.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSubject(s)}
                      style={{
                        fontSize: '12px',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: subject === s ? 'var(--accent-lime)' : 'rgba(255, 255, 255, 0.7)',
                        color: 'var(--text-primary)',
                        fontWeight: subject === s ? 700 : 500,
                        border: 'none',
                        transition: 'var(--transition)',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          {status === 'IDLE' && (
            <button
              onClick={handleStart}
              className="btn btn-lime"
              style={{
                padding: '16px 44px',
                fontSize: '16px',
              }}
            >
              <Play size={18} fill="currentColor" />
              <span>Start Focus Session</span>
            </button>
          )}

          {status === 'RUNNING' && (
            <>
              <button
                onClick={pause}
                className="btn"
                style={{
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-primary)',
                  padding: '14px 32px',
                  fontSize: '15px',
                }}
              >
                <Pause size={18} />
                <span>Pause</span>
              </button>
              <button
                onClick={handleStop}
                className="btn btn-dark"
                style={{ padding: '14px 32px', fontSize: '15px' }}
                disabled={isSaving}
              >
                <Square size={16} fill="currentColor" />
                <span>{isSaving ? 'Saving...' : 'End & Save Session'}</span>
              </button>
            </>
          )}

          {status === 'PAUSED' && (
            <>
              <button
                onClick={resume}
                className="btn btn-lime"
                style={{ padding: '14px 32px', fontSize: '15px' }}
              >
                <Play size={18} fill="currentColor" />
                <span>Resume</span>
              </button>
              <button
                onClick={handleStop}
                className="btn btn-dark"
                style={{ padding: '14px 32px', fontSize: '15px' }}
                disabled={isSaving}
              >
                <Square size={16} fill="currentColor" />
                <span>{isSaving ? 'Saving...' : 'End & Save'}</span>
              </button>
              <button
                onClick={reset}
                className="btn"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-secondary)',
                  padding: '14px 20px',
                  fontSize: '15px',
                }}
                title="Discard & Reset"
              >
                <RotateCcw size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Today's Focus Overview Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '40px',
      }}>
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: 'var(--shadow-subtle)',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'var(--surface-mint)',
            color: '#1F4C27',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Clock size={20} />
          </div>
          <div>
            <div className="text-meta" style={{ textTransform: 'uppercase' }}>TODAY'S FOCUS TIME</div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginTop: '2px' }}>
              {formatTotalTime(todayFocusSeconds)}
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: 'var(--shadow-subtle)',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-lime)',
            color: '#111111',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Flame size={20} />
          </div>
          <div>
            <div className="text-meta" style={{ textTransform: 'uppercase' }}>TODAY'S SESSIONS</div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginTop: '2px' }}>
              {recentSessions.filter((s) => new Date(s.startedAt).toDateString() === new Date().toDateString()).length} completed
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions History Section */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Recent Focus Sessions
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Detailed activity log from your current and prior sessions
            </p>
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
            <p>Loading focus sessions...</p>
          </div>
        ) : (
          <FocusHistoryList
            sessions={recentSessions}
            onDeleteSession={handleDeleteSession}
          />
        )}
      </div>
    </div>
  );
};
