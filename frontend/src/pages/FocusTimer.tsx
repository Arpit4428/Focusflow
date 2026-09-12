import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTimer } from '../hooks/useTimer';
import { sessionService } from '../services/sessionService';
import { subjectService } from '../services/subjectService';
import { FocusHistoryList } from '../components/focus/FocusHistoryList';
import type { FocusSession } from '../types/session';
import type { Subject } from '../types/subject';
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
  Plus,
} from 'lucide-react';

export const FocusTimer: React.FC = () => {
  const { status, formattedTime, start, pause, resume, stop, reset } = useTimer();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>('');
  const [recentSessions, setRecentSessions] = useState<FocusSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  // Fetch subjects and recent sessions
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sessions, subs] = await Promise.all([
        sessionService.getSessions(),
        subjectService.getSubjects(),
      ]);

      setRecentSessions(sessions);
      setSubjects(subs);

      if (subs.length > 0) {
        setSelectedSubjectId((prev) => {
          if (prev && subs.some((s) => s.id === prev)) return prev;
          return subs[0].id;
        });
        setSelectedSubjectName((prev) => {
          const matched = subs.find((s) => s.id === (selectedSubjectId || subs[0].id));
          return matched ? matched.name : (prev || subs[0].name);
        });
      }
    } catch {
      // Non-blocking
    } finally {
      setIsLoading(false);
    }
  }, [selectedSubjectId]);

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
    if (!selectedSubjectId) {
      setFeedbackMessage({ type: 'warning', text: 'Please create and select a study subject before starting.' });
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
        subjectId: selectedSubjectId,
        subject: selectedSubjectName,
        duration: sessionData.durationSeconds,
        startedAt: sessionData.startedAt,
        endedAt: sessionData.endedAt,
        completed: true,
      });

      setRecentSessions((prev) => [saved, ...prev]);
      setFeedbackMessage({
        type: 'success',
        text: `Great work! Logged ${Math.floor(sessionData.durationSeconds / 60)}m ${sessionData.durationSeconds % 60}s of focused study for ${selectedSubjectName}.`,
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
            backgroundColor: 'var(--accent-mustard)',
            color: 'var(--text-primary)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            boxShadow: '0 2px 8px rgba(214, 184, 90, 0.3)',
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--text-primary)',
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
            backgroundColor: 'var(--accent-mustard-subtle)',
            color: '#7A5F12',
            border: '1px solid var(--accent-mustard-border)',
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
            color: 'var(--accent-primary)',
            border: '1px solid var(--border)',
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
            backgroundColor: 'rgba(251, 249, 243, 0.85)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
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
            backgroundColor: feedbackMessage.type === 'warning' ? 'var(--accent-mustard-subtle)' : undefined,
            color: feedbackMessage.type === 'warning' ? '#7A5F12' : undefined,
            border: feedbackMessage.type === 'warning' ? '1px solid var(--accent-mustard-border)' : undefined,
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
        backgroundColor: 'var(--surface-sage)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
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
            background: 'radial-gradient(circle, rgba(214, 184, 90, 0.35) 0%, transparent 70%)',
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
        <div style={{ maxWidth: '440px', margin: '0 auto 36px' }}>
          {status === 'RUNNING' || status === 'PAUSED' ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(251, 249, 243, 0.9)',
              border: '1px solid var(--border-strong)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: subjects.find((s) => s.id === selectedSubjectId)?.color || '#D8E2D2',
              }} />
              <span>Subject:</span>
              <span style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>{selectedSubjectName}</span>
            </div>
          ) : subjects.length === 0 ? (
            <div style={{
              backgroundColor: 'var(--surface)',
              padding: '24px',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border)',
              textAlign: 'center',
            }}>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', fontSize: '14px' }}>
                No subjects yet.
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Create a subject before starting a focus session.
              </p>
              <Link
                to="/subjects"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 16px' }}
              >
                <Plus size={14} />
                <span>Create Subject</span>
              </Link>
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 600 }}>
                Select Study Subject:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {subjects.map((sub) => {
                  const isSelected = sub.id === selectedSubjectId;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        setSelectedSubjectId(sub.id);
                        setSelectedSubjectName(sub.name);
                      }}
                      style={{
                        fontSize: '13px',
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: isSelected ? 'var(--surface)' : 'rgba(251, 249, 243, 0.65)',
                        color: 'var(--text-primary)',
                        fontWeight: isSelected ? 700 : 500,
                        border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                        boxShadow: isSelected ? 'var(--shadow-subtle)' : 'none',
                      }}
                    >
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: sub.color || '#D8E2D2',
                        border: '1px solid rgba(0,0,0,0.1)',
                      }} />
                      <span>{sub.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          {status === 'IDLE' && (
            <button
              onClick={handleStart}
              className="btn btn-primary"
              style={{
                padding: '16px 44px',
                fontSize: '16px',
                opacity: subjects.length === 0 ? 0.5 : 1,
                cursor: subjects.length === 0 ? 'not-allowed' : 'pointer',
              }}
              disabled={subjects.length === 0}
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
                  border: '1px solid var(--border-strong)',
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
                className="btn btn-primary"
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
                <span>{isSaving ? 'Saving...' : 'End & Save Session'}</span>
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
