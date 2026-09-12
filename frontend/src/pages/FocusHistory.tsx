import React, { useState, useEffect, useCallback } from 'react';
import { sessionService } from '../services/sessionService';
import { FocusHistoryList } from '../components/focus/FocusHistoryList';
import type { FocusSession } from '../types/session';
import type { ApiError } from '../types/auth';
import { Filter, AlertCircle } from 'lucide-react';

export const FocusHistory: React.FC = () => {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
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

  // Distinct subjects for filter dropdown
  const uniqueSubjects = Array.from(new Set(sessions.map((s) => s.subject))).filter(Boolean);

  // Client-side date filter if selected
  const displayedSessions = sessions.filter((s) => {
    if (!dateFilter) return true;
    const sessionDate = new Date(s.startedAt).toISOString().slice(0, 10);
    return sessionDate === dateFilter;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Editorial Header */}
      <div style={{ marginBottom: '32px' }}>
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
          <span>Chronological Focus Record</span>
        </div>
        <h1 className="title-hero">
          Focus Session History
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '6px' }}>
          Review all logged study sessions, filtered by subject and completion date.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-subtle)',
        marginBottom: '28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Filters:</span>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Subject Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Subject:</span>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="form-input"
              style={{ height: '38px', padding: '6px 14px', fontSize: '13px', width: 'auto', borderRadius: 'var(--radius-pill)' }}
            >
              <option value="ALL">All Subjects</option>
              {uniqueSubjects.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Date:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="form-input"
              style={{ height: '38px', padding: '6px 14px', fontSize: '13px', width: 'auto', borderRadius: 'var(--radius-pill)' }}
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                style={{ background: 'none', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600, textDecoration: 'underline' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert-banner alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Spinner */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <div style={{
            width: '36px',
            height: '36px',
            border: '3px solid var(--border)',
            borderTopColor: 'var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p>Loading focus session history...</p>
        </div>
      ) : (
        <FocusHistoryList
          sessions={displayedSessions}
          onDeleteSession={handleDeleteSession}
          emptyMessage={
            subjectFilter !== 'ALL' || dateFilter
              ? 'No focus sessions match your selected filters.'
              : 'No focus sessions recorded yet. Complete a study session in the Focus Timer to see it here!'
          }
        />
      )}
    </div>
  );
};

