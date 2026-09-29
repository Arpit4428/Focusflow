import React, { useState, useEffect, useCallback } from 'react';
import { sessionService } from '../services/sessionService';
import { FocusHistoryList } from '../components/focus/FocusHistoryList';
import type { FocusSession } from '../types/session';
import type { ApiError } from '../types/auth';
import { SlidersHorizontal, AlertCircle, X } from 'lucide-react';

export const FocusHistory: React.FC = () => {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const subjectParam = subjectFilter === 'ALL' ? undefined : subjectFilter;
      const data = await sessionService.getSessions(subjectParam);
      setSessions(data);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to load focus sessions.');
    } finally {
      setLoading(false);
    }
  }, [subjectFilter]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleDeleteSession = async (id: string) => {
    await sessionService.deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const uniqueSubjects = Array.from(new Set(sessions.map((s) => s.subject))).filter(Boolean);

  const displayedSessions = sessions.filter((s) => {
    if (!dateFilter) return true;
    const sessionDate = new Date(s.startedAt).toISOString().slice(0, 10);
    return sessionDate === dateFilter;
  });

  const hasActiveFilter = subjectFilter !== 'ALL' || dateFilter;

  return (
    <div className="page-enter" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '36px' }}>
        <div className="section-label" style={{ marginBottom: '10px' }}>Chronological Focus Record</div>
        <h1 className="title-hero">Focus Session History</h1>
        <p style={{ color: 'var(--text-2)', fontSize: '14px', marginTop: '8px', lineHeight: 1.5 }}>
          Review all logged study sessions, filtered by subject and completion date.
        </p>
      </div>

      {/* ── Filter Bar ── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        padding: '14px 18px',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <SlidersHorizontal size={14} color="var(--text-3)" />
          <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)' }}>
            Filters
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
          {/* Subject Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600 }}>Subject:</span>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="form-input"
              style={{ height: '36px', padding: '4px 12px', fontSize: '13px', width: 'auto', borderRadius: 'var(--radius-md)' }}
            >
              <option value="ALL">All Subjects</option>
              {uniqueSubjects.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600 }}>Date:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="form-input"
              style={{ height: '36px', padding: '4px 12px', fontSize: '13px', width: 'auto', borderRadius: 'var(--radius-md)' }}
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                style={{ background: 'none', color: 'var(--text-3)', display: 'flex', alignItems: 'center', padding: '4px' }}
                aria-label="Clear date filter"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Clear all filters */}
          {hasActiveFilter && (
            <button
              onClick={() => { setSubjectFilter('ALL'); setDateFilter(''); }}
              style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', background: 'none', textDecoration: 'underline', textUnderlineOffset: '2px', marginLeft: 'auto' }}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-danger">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-2)' }}>
          <div style={{
            width: '32px', height: '32px',
            border: '2.5px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 14px',
          }} />
          <p style={{ fontSize: '13px' }}>Loading focus session history...</p>
        </div>
      ) : (
        <FocusHistoryList
          sessions={displayedSessions}
          onDeleteSession={handleDeleteSession}
          emptyMessage={
            hasActiveFilter
              ? 'No focus sessions match your selected filters.'
              : 'No focus sessions recorded yet. Complete a study session in the Focus Timer to see it here!'
          }
        />
      )}
    </div>
  );
};
