import React, { useState, useEffect, useCallback } from 'react';
import { subjectService } from '../services/subjectService';
import type { Subject, SubjectRequest } from '../types/subject';
import type { ApiError } from '../types/auth';
import {
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  BookOpen,
  X,
  Check,
} from 'lucide-react';

const PRESET_COLORS = [
  { label: 'Sage',        value: '#A8C5A3' },
  { label: 'Forest',      value: '#6B8F71' },
  { label: 'Teal',        value: '#7BB5B8' },
  { label: 'Sky',         value: '#8ABBE8' },
  { label: 'Lavender',    value: '#A89EC4' },
  { label: 'Dusty Rose',  value: '#D4857B' },
  { label: 'Warm Sand',   value: '#C9A97B' },
  { label: 'Mustard',     value: '#C9A94A' },
  { label: 'Slate',       value: '#8FA3B1' },
];

export const Subjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState(PRESET_COLORS[0].value);
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await subjectService.getSubjects();
      setSubjects(data);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to load subjects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const openCreateModal = () => {
    setEditingSubject(null);
    setFormName('');
    setFormColor(PRESET_COLORS[0].value);
    setFormDescription('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (sub: Subject) => {
    setEditingSubject(sub);
    setFormName(sub.name);
    setFormColor(sub.color || PRESET_COLORS[0].value);
    setFormDescription(sub.description || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSubject(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Subject name is required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload: SubjectRequest = {
      name: formName.trim(),
      color: formColor,
      description: formDescription.trim() || undefined,
    };

    try {
      if (editingSubject) {
        await subjectService.updateSubject(editingSubject.id, payload);
      } else {
        await subjectService.createSubject(payload);
      }
      closeModal();
      await fetchSubjects();
    } catch (err) {
      const apiErr = err as ApiError;
      setFormError(apiErr.message || 'Failed to save subject.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!subjectToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await subjectService.deleteSubject(subjectToDelete.id);
      setSubjectToDelete(null);
      await fetchSubjects();
    } catch (err) {
      const apiErr = err as ApiError;
      setDeleteError(apiErr.message || 'Cannot delete subject because it has associated tasks or focus sessions.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-enter" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* ── Page Header ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '36px',
      }}>
        <div>
          <div className="section-label" style={{ marginBottom: '10px' }}>Academic Curriculum</div>
          <h1 className="title-hero">Academic Subjects</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '14px', marginTop: '8px', lineHeight: 1.5 }}>
            Organize coursework, assign color identities, and structure focus analytics by subject.
          </p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary" style={{ padding: '10px 22px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={15} />
          <span>New Subject</span>
        </button>
      </div>

      {error && (
        <div className="alert-banner alert-danger" style={{ marginBottom: '24px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={fetchSubjects} style={{ marginLeft: 'auto', textDecoration: 'underline', background: 'none', color: 'inherit', fontWeight: 600 }}>Retry</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-2)' }}>
          <div style={{
            width: '32px', height: '32px',
            border: '2.5px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 14px',
          }} />
          <p style={{ fontSize: '13px' }}>Loading your academic subjects...</p>
        </div>
      ) : subjects.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '64px 24px',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px dashed var(--border-strong)',
        }}>
          <div style={{
            width: '52px', height: '52px',
            borderRadius: '50%',
            backgroundColor: 'var(--sage)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <BookOpen size={22} color="var(--accent)" />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '8px' }}>
            No Subjects Yet
          </h3>
          <p style={{ color: 'var(--text-2)', fontSize: '13.5px', maxWidth: '400px', margin: '0 auto 24px', lineHeight: 1.55 }}>
            Create your university courses or study subjects to associate with tasks and focus sessions.
          </p>
          <button onClick={openCreateModal} className="btn btn-primary" style={{ display: 'inline-flex' }}>
            <Plus size={15} />
            <span>Create First Subject</span>
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px',
        }}>
          {subjects.map((sub) => (
            <div
              key={sub.id}
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                padding: '22px 22px 18px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                transition: 'box-shadow 0.2s ease, transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Top Accent Strip */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: '3px',
                backgroundColor: sub.color || 'var(--sage-dark)',
              }} />

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', marginTop: '6px' }}>
                  <div style={{
                    width: '32px', height: '32px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: sub.color || 'var(--sage)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    opacity: 0.8,
                  }}>
                    <BookOpen size={14} color="rgba(0,0,0,0.5)" />
                  </div>
                  <h3 style={{
                    fontSize: '16px', fontWeight: 700,
                    color: 'var(--text-1)',
                    letterSpacing: '-0.02em',
                    margin: 0,
                  }}>
                    {sub.name}
                  </h3>
                </div>

                {sub.description ? (
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-2)',
                    lineHeight: 1.55,
                    marginBottom: '18px',
                  }}>
                    {sub.description}
                  </p>
                ) : (
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-3)',
                    fontStyle: 'italic',
                    marginBottom: '18px',
                  }}>
                    No description added.
                  </p>
                )}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '14px',
                borderTop: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 500 }}>
                  {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => openEditModal(sub)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '5px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-2)',
                      fontSize: '12px', fontWeight: 600,
                      cursor: 'pointer', transition: 'var(--transition)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    title="Edit"
                  >
                    <Edit2 size={12} />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => { setSubjectToDelete(sub); setDeleteError(null); }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '5px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid transparent',
                      backgroundColor: 'transparent',
                      color: 'var(--text-3)',
                      fontSize: '12px', fontWeight: 600,
                      cursor: 'pointer', transition: 'var(--transition)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--coral-light)';
                      e.currentTarget.style.color = 'var(--coral-text)';
                      e.currentTarget.style.borderColor = 'rgba(232,123,106,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-3)';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                    title="Delete"
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
                {editingSubject ? 'Edit Subject' : 'New Academic Subject'}
              </h2>
              <button
                onClick={closeModal}
                aria-label="Close"
                style={{ background: 'none', color: 'var(--text-3)', padding: '5px', borderRadius: 'var(--radius-sm)' }}
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="alert-banner alert-danger">
                <AlertCircle size={14} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="subjectName">Subject Name *</label>
                <input
                  id="subjectName"
                  type="text"
                  required
                  maxLength={50}
                  className="form-input"
                  placeholder="e.g., Computer Networks, Algorithms"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Color Swatch Picker */}
              <div className="form-group">
                <label className="form-label">Subject Color</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map((c) => {
                    const isSelected = formColor.toUpperCase() === c.value.toUpperCase();
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setFormColor(c.value)}
                        style={{
                          width: '34px', height: '34px',
                          borderRadius: '50%',
                          backgroundColor: c.value,
                          border: isSelected ? '2.5px solid var(--text-1)' : '2px solid transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 0 0 2px rgba(26,26,24,0.15)' : 'none',
                          transition: 'var(--transition)',
                        }}
                        title={c.label}
                      >
                        {isSelected && <Check size={14} color="#fff" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="subjectDesc">Description (Optional)</label>
                <textarea
                  id="subjectDesc"
                  rows={3}
                  maxLength={500}
                  className="form-input"
                  placeholder="Course topics, professor, or module notes..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={closeModal} className="btn btn-outline" disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {subjectToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{
              width: '48px', height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--coral-light)',
              color: 'var(--coral-text)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Trash2 size={22} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-1)' }}>Delete Subject?</h3>
            <p style={{ color: 'var(--text-2)', fontSize: '13px', marginBottom: '20px', lineHeight: 1.5 }}>
              Delete <strong>{subjectToDelete.name}</strong>? This cannot be undone.
            </p>

            {deleteError && (
              <div className="alert-banner alert-danger">
                <AlertCircle size={14} />
                <span style={{ fontSize: '12px' }}>{deleteError}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button type="button" onClick={() => setSubjectToDelete(null)} className="btn btn-outline" disabled={deleting}>Cancel</button>
              <button type="button" onClick={confirmDelete} className="btn btn-danger" disabled={deleting}>
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
