import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { X, Clock, AlertCircle } from 'lucide-react';

interface DailyGoalModalProps {
  isOpen: boolean;
  currentGoalMinutes: number;
  onClose: () => void;
  onSave: (newGoalMinutes: number) => Promise<void>;
}

const PRESETS = [
  { label: '30m',    minutes: 30 },
  { label: '1h',     minutes: 60 },
  { label: '1h 30m', minutes: 90 },
  { label: '2h',     minutes: 120 },
  { label: '3h',     minutes: 180 },
  { label: '4h',     minutes: 240 },
];

export const DailyGoalModal: React.FC<DailyGoalModalProps> = ({
  isOpen,
  currentGoalMinutes,
  onClose,
  onSave,
}) => {
  const [totalMinutes, setTotalMinutes] = useState<number>(currentGoalMinutes || 120);
  const [hours, setHours] = useState<number>(Math.floor((currentGoalMinutes || 120) / 60));
  const [minutes, setMinutes] = useState<number>((currentGoalMinutes || 120) % 60);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initial = currentGoalMinutes || 120;
      setTotalMinutes(initial);
      setHours(Math.floor(initial / 60));
      setMinutes(initial % 60);
      setError(null);
      setLoading(false);
    }
  }, [isOpen, currentGoalMinutes]);

  if (!isOpen) return null;

  const handleHoursChange = (val: string) => {
    const h = Math.max(0, parseInt(val, 10) || 0);
    setHours(h);
    const tot = h * 60 + minutes;
    setTotalMinutes(tot);
    validate(tot);
  };

  const handleMinutesChange = (val: string) => {
    const m = Math.max(0, parseInt(val, 10) || 0);
    setMinutes(m);
    const tot = hours * 60 + m;
    setTotalMinutes(tot);
    validate(tot);
  };

  const handleSelectPreset = (presetMinutes: number) => {
    setTotalMinutes(presetMinutes);
    setHours(Math.floor(presetMinutes / 60));
    setMinutes(presetMinutes % 60);
    setError(null);
  };

  const validate = (val: number): boolean => {
    if (val < 15) {
      setError('Daily focus goal must be at least 15 minutes.');
      return false;
    }
    if (val > 720) {
      setError('Daily focus goal cannot exceed 720 minutes (12 hours).');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(totalMinutes)) return;

    setLoading(true);
    setError(null);
    try {
      await onSave(totalMinutes);
      onClose();
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Failed to update daily goal.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="440px">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-primary)',
          }}>
            <Clock size={16} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
            Daily Focus Goal
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="Close"
          style={{
            background: 'none', padding: '5px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}
        >
          <X size={18} />
        </button>
      </div>

        <form onSubmit={handleSubmit}>
          {/* Quick Presets */}
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label">Quick Presets</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '7px' }}>
              {PRESETS.map((p) => {
                const isSelected = totalMinutes === p.minutes;
                return (
                  <button
                    key={p.minutes}
                    type="button"
                    onClick={() => handleSelectPreset(p.minutes)}
                    disabled={loading}
                    style={{
                      padding: '8px 10px',
                      fontSize: '13px',
                      fontFamily: 'var(--font-digits)',
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: isSelected ? 700 : 500,
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--text-1)' : 'var(--bg-subtle)',
                      color: isSelected ? '#fff' : 'var(--text-1)',
                      border: isSelected ? 'none' : '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Time Input */}
          <div style={{ marginBottom: '14px' }}>
            <label className="form-label">Custom Duration</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={hours}
                  onChange={(e) => handleHoursChange(e.target.value)}
                  disabled={loading}
                  className="form-input"
                  style={{ paddingRight: '42px', fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-digits)', fontVariantNumeric: 'tabular-nums' }}
                />
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--text-3)', pointerEvents: 'none' }}>
                  hrs
                </span>
              </div>

              <span style={{ fontWeight: 600, color: 'var(--text-3)' }}>:</span>

              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="number"
                  min="0"
                  max="59"
                  step="5"
                  value={minutes}
                  onChange={(e) => handleMinutesChange(e.target.value)}
                  disabled={loading}
                  className="form-input"
                  style={{ paddingRight: '42px', fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-digits)', fontVariantNumeric: 'tabular-nums' }}
                />
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--text-3)', pointerEvents: 'none' }}>
                  mins
                </span>
              </div>
            </div>
          </div>

          {/* Range Helper */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: 'var(--text-3)',
            marginBottom: '18px',
          }}>
            <span>Range: <strong style={{ color: 'var(--text-2)' }}>15 min – 12 hrs</strong></span>
            <span style={{ fontWeight: 700, fontFamily: 'var(--font-digits)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-1)' }}>
              Total: {totalMinutes}m
            </span>
          </div>

          {error && (
            <div className="alert-banner alert-danger" style={{ marginBottom: '16px' }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '12px' }}>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-outline"
              style={{ padding: '9px 18px', fontSize: '13px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || totalMinutes < 15 || totalMinutes > 720}
              className="btn btn-primary"
              style={{ padding: '9px 20px', fontSize: '13px', minWidth: '110px' }}
            >
              {loading ? 'Saving...' : 'Save Goal'}
            </button>
          </div>
        </form>
    </Modal>
  );
};
