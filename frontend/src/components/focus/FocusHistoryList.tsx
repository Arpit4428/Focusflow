import React, { useState } from 'react';
import type { FocusSession } from '../../types/session';
import { Calendar, Clock, Trash2, BookOpen } from 'lucide-react';

interface FocusHistoryListProps {
  sessions: FocusSession[];
  onDeleteSession?: (id: string) => Promise<void>;
  emptyMessage?: string;
}

export const FocusHistoryList: React.FC<FocusHistoryListProps> = ({
  sessions,
  onDeleteSession,
  emptyMessage = 'No focus sessions recorded yet. Start a timer to log your first study session!',
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const formatDate = (isoString: string): string => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTimeRange = (startIso: string, endIso: string): string => {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    return `${start.toLocaleTimeString(undefined, timeOptions)} – ${end.toLocaleTimeString(undefined, timeOptions)}`;
  };

  const handleDelete = async (id: string) => {
    if (!onDeleteSession) return;
    setIsDeleting(true);
    try {
      await onDeleteSession(id);
      setDeleteConfirmId(null);
    } catch {
      alert('Failed to delete focus session.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (sessions.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '48px 24px',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px dashed var(--border-strong)',
      }}>
        <div style={{
          width: '44px', height: '44px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-subtle)',
          color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px',
        }}>
          <Clock size={20} />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', maxWidth: '420px', margin: '0 auto', lineHeight: 1.55 }}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
    }}>
      {sessions.map((session, index) => {
        const isLast = index === sessions.length - 1;

        return (
          <div
            key={session.id}
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              borderBottom: isLast ? 'none' : '1px solid var(--border)',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            {/* Subject and Duration */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-primary)',
                flexShrink: 0,
              }}>
                <BookOpen size={16} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {session.subject}
                  </h4>
                  <span className="badge badge-status-COMPLETED" style={{ fontSize: '10px', padding: '2px 7px' }}>
                    Completed
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-digits)', fontVariantNumeric: 'tabular-nums', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                  {formatDuration(session.duration)}
                </div>
              </div>
            </div>

            {/* Date & Time Range + Delete */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '12px', fontFamily: 'var(--font-digits)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={12} />
                <span>{formatDate(session.startedAt)}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={12} />
                <span>{formatTimeRange(session.startedAt, session.endedAt)}</span>
              </div>

              {onDeleteSession && (
                <button
                  onClick={() => setDeleteConfirmId(session.id)}
                  title="Delete Session"
                  aria-label="Delete Session"
                  style={{
                    background: 'none',
                    color: 'var(--text-muted)',
                    padding: '5px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                    display: 'flex', alignItems: 'center',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-coral)'; e.currentTarget.style.backgroundColor = 'var(--accent-coral-subtle)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '360px', textAlign: 'center' }}>
            <div style={{
              width: '44px', height: '44px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-coral-subtle)',
              color: 'var(--accent-coral-text)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <Trash2 size={20} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Delete Focus Session?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '22px', lineHeight: 1.5 }}>
              Remove this focus session record from your history?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="btn btn-outline"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="btn btn-danger"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
