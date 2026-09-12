import React, { useState, useEffect } from 'react';
import { X, Clock, AlertCircle } from 'lucide-react';

interface DailyGoalModalProps {
  isOpen: boolean;
  currentGoalMinutes: number;
  onClose: () => void;
  onSave: (newGoalMinutes: number) => Promise<void>;
}

const PRESETS = [
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '1h 30m', minutes: 90 },
  { label: '2h', minutes: 120 },
  { label: '3h', minutes: 180 },
  { label: '4h', minutes: 240 },
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(52, 59, 47, 0.45)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '440px',
        boxShadow: 'var(--shadow-float)',
        padding: '28px',
        animation: 'scaleUp 0.15s ease-out',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--surface-sage)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
              background: 'none',
              padding: '6px',
              borderRadius: '50%',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Quick Presets */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
              Quick Presets
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {PRESETS.map((p) => {
                const isSelected = totalMinutes === p.minutes;
                return (
                  <button
                    key={p.minutes}
                    type="button"
                    onClick={() => handleSelectPreset(p.minutes)}
                    disabled={loading}
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      fontWeight: isSelected ? 700 : 500,
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: isSelected ? 'var(--accent-mustard)' : 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      border: isSelected ? '1px solid var(--accent-mustard-border)' : '1px solid var(--border)',
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

          {/* Custom Time Input (Hours & Minutes) */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
              Custom Duration
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={hours}
                    onChange={(e) => handleHoursChange(e.target.value)}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 14px',
                      fontSize: '15px',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-strong)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                    hrs
                  </span>
                </div>
              </div>

              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>:</span>

              <div style={{ flex: 1 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    step="5"
                    value={minutes}
                    onChange={(e) => handleMinutesChange(e.target.value)}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 14px',
                      fontSize: '15px',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-strong)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                    mins
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Range Helper Text */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginBottom: '20px',
          }}>
            <span>Allowed range: <strong>15 minutes – 12 hours</strong></span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Total: {totalMinutes}m
            </span>
          </div>

          {/* Inline Error */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: 'var(--accent-coral-soft)',
              color: 'var(--accent-coral-text)',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              marginBottom: '18px',
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
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
      </div>
    </div>
  );
};
