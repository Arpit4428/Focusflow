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

    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
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
        padding: '52px 20px',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border)',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'var(--surface-mint)',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px',
        }}>
          <Clock size={22} />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '420px', margin: '0 auto' }}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
    }}>
      {sessions.map((session, index) => {
        const isLast = index === sessions.length - 1;

        return (
          <div
            key={session.id}
            style={{
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
              borderBottom: isLast ? 'none' : '1px solid var(--border)',
              transition: 'var(--transition)',
            }}
          >
            {/* Subject and Duration */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'var(--surface-mint)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                flexShrink: 0,
              }}>
                <BookOpen size={18} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {session.subject}
                  </h4>
                  <span className="badge badge-status-COMPLETED" style={{ fontSize: '10px', padding: '2px 8px' }}>
                    Completed
                  </span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                  {formatDuration(session.duration)}
                </div>
              </div>
            </div>

            {/* Date & Time Range */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                <span>{formatDate(session.startedAt)}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                <span>{formatTimeRange(session.startedAt, session.endedAt)}</span>
              </div>

              {/* Delete Action */}
              {onDeleteSession && (
                <button
                  onClick={() => setDeleteConfirmId(session.id)}
                  title="Delete Session"
                  aria-label="Delete Session"
                  style={{
                    background: 'none',
                    color: 'var(--text-muted)',
                    padding: '6px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-coral)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '380px', textAlign: 'center' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-coral-soft)',
              color: 'var(--accent-coral-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <Trash2 size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>Delete Focus Session?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
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

