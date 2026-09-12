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
  { label: 'Mint', value: '#DDEBDF' },
  { label: 'Green', value: '#C9DCCB' },
  { label: 'Lime', value: '#E7FF63' },
  { label: 'Soft Coral', value: '#F0D5CF' },
  { label: 'Slate Blue', value: '#D4E4F0' },
  { label: 'Lavender', value: '#E2D4F0' },
  { label: 'Peach', value: '#FCEFD8' },
];

export const Subjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#DDEBDF');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Modal State
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
    setFormColor('#DDEBDF');
    setFormDescription('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (sub: Subject) => {
    setEditingSubject(sub);
    setFormName(sub.name);
    setFormColor(sub.color || '#DDEBDF');
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
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Editorial Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '32px',
      }}>
        <div>
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
            <span>ACADEMIC CURRICULUM</span>
          </div>
          <h1 className="title-hero">Academic Subjects</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '6px' }}>
            Organize coursework, assign distinct pastel identities, and structure focus analytics.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} />
          <span>New Subject</span>
        </button>
      </div>

      {/* Global Alert */}
      {error && (
        <div className="alert-banner alert-danger" style={{ marginBottom: '24px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            onClick={fetchSubjects}
            style={{ marginLeft: 'auto', textDecoration: 'underline', background: 'none', color: 'inherit' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <div style={{
            width: '36px',
            height: '36px',
            border: '3px solid var(--border-strong)',
            borderTopColor: 'var(--text-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p>Loading your academic subjects...</p>
        </div>
      ) : subjects.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '64px 24px',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--border)',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--surface-sage)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <BookOpen size={24} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Subjects Yet
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', margin: '0 auto 24px' }}>
            Create your university courses or study subjects to associate with tasks and timed focus sessions.
          </p>
          <button
            onClick={openCreateModal}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            <span>Create First Subject</span>
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
        }}>
          {subjects.map((sub) => (
            <div
              key={sub.id}
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                padding: '24px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Top Accent Strip */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                backgroundColor: sub.color || '#DDEBDF',
              }} />

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: sub.color || '#DDEBDF',
                    border: '1px solid rgba(0,0,0,0.1)',
                    flexShrink: 0,
                  }} />
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    margin: 0,
                  }}>
                    {sub.name}
                  </h3>
                </div>

                {sub.description ? (
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.5',
                    marginBottom: '20px',
                  }}>
                    {sub.description}
                  </p>
                ) : (
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                    marginBottom: '20px',
                  }}>
                    No description provided.
                  </p>
                )}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '16px',
                borderTop: '1px solid var(--border)',
              }}>
                <span className="text-meta">
                  Added {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => openEditModal(sub)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                    title="Edit Subject"
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => {
                      setSubjectToDelete(sub);
                      setDeleteError(null);
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      backgroundColor: 'transparent',
                      color: '#8C3D32',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                    title="Delete Subject"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(17, 17, 17, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '480px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '24px 28px',
              borderBottom: '1px solid var(--border)',
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {editingSubject ? 'Edit Subject' : 'New Academic Subject'}
              </h2>
              <button
                onClick={closeModal}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
              {formError && (
                <div className="alert-banner alert-danger" style={{ marginBottom: '20px' }}>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Subject Name */}
              <div style={{ marginBottom: '20px' }}>
                <label className="text-meta" style={{ display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  className="input-custom"
                  placeholder="e.g., Computer Networks, Algorithms"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              {/* Color Swatch Picker */}
              <div style={{ marginBottom: '20px' }}>
                <label className="text-meta" style={{ display: 'block', marginBottom: '10px', textTransform: 'uppercase' }}>
                  Subject Identity Color
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map((c) => {
                    const isSelected = formColor.toUpperCase() === c.value.toUpperCase();
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setFormColor(c.value)}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          backgroundColor: c.value,
                          border: isSelected ? '2px solid var(--text-primary)' : '1px solid rgba(0,0,0,0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          position: 'relative',
                        }}
                        title={c.label}
                      >
                        {isSelected && <Check size={16} color="#111111" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '28px' }}>
                <label className="text-meta" style={{ display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  className="input-custom"
                  placeholder="Course topics, professor, or module notes..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-outline"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {subjectToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(52, 59, 47, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '440px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)',
            padding: '28px',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Delete Subject
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5', marginBottom: '20px' }}>
              Are you sure you want to delete <strong>{subjectToDelete.name}</strong>?
            </p>

            {deleteError && (
              <div className="alert-banner alert-danger" style={{ marginBottom: '20px' }}>
                <AlertCircle size={16} />
                <span>{deleteError}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setSubjectToDelete(null)}
                className="btn btn-outline"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="btn"
                style={{
                  backgroundColor: 'var(--accent-coral)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                }}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
