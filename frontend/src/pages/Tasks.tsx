import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../components/common/Modal';
import { taskService } from '../services/taskService';
import { subjectService } from '../services/subjectService';
import type { Task, Priority, TaskStatus } from '../types/task';
import type { Subject } from '../types/subject';
import type { ApiError } from '../types/auth';
import {
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Calendar,
  BookOpen,
  Edit2,
  Trash2,
  AlertCircle,
  X,
} from 'lucide-react';

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | Priority>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [formTitle, setFormTitle] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<Priority>('MEDIUM');
  const [formDueDate, setFormDueDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = statusFilter === 'ALL' ? undefined : statusFilter;
      const priorityParam = priorityFilter === 'ALL' ? undefined : priorityFilter;
      const data = await taskService.getTasks(statusParam, priorityParam);
      setTasks(data);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  const fetchSubjects = useCallback(async () => {
    try {
      const data = await subjectService.getSubjects();
      setSubjects(data);
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchSubjects();
  }, [fetchTasks, fetchSubjects]);

  const openCreateModal = () => {
    setFormTitle('');
    const defaultSubId = subjects.length > 0 ? subjects[0].id : '';
    const defaultSubName = subjects.length > 0 ? subjects[0].name : '';
    setFormSubjectId(defaultSubId);
    setFormSubject(defaultSubName);
    setFormDescription('');
    setFormPriority('MEDIUM');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);
    setFormDueDate(tomorrow.toISOString().slice(0, 16));
    setFormError(null);
    setIsCreateOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);

    let matchedSubjectId = task.subjectId || '';
    if (!matchedSubjectId && task.subject) {
      const matched = subjects.find((s) => s.name.toLowerCase() === task.subject.toLowerCase());
      if (matched) matchedSubjectId = matched.id;
    }
    setFormSubjectId(matchedSubjectId);
    setFormSubject(task.subject);
    setFormDescription(task.description || '');
    setFormPriority(task.priority);
    const date = new Date(task.dueDate);
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    setFormDueDate(localISOTime);
    setFormError(null);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || (!formSubjectId && !formSubject.trim()) || !formDueDate) {
      setFormError('Title, subject, and due date are required.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const payload = {
      title: formTitle.trim(),
      subjectId: formSubjectId || undefined,
      subject: formSubject.trim(),
      description: formDescription.trim() || undefined,
      priority: formPriority,
      dueDate: new Date(formDueDate).toISOString(),
    };

    try {
      if (editingTask) {
        const updated = await taskService.updateTask(editingTask.id, payload);
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setEditingTask(null);
      } else {
        const created = await taskService.createTask(payload);
        setTasks((prev) => [...prev, created]);
        setIsCreateOpen(false);
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setFormError(apiErr.message || 'Failed to save task.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    try {
      const updated = await taskService.toggleComplete(taskId);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      const apiErr = err as ApiError;
      alert(apiErr.message || 'Failed to update task.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setDeleteConfirmId(null);
    } catch (err) {
      const apiErr = err as ApiError;
      alert(apiErr.message || 'Failed to delete task.');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q);
  });

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const STATUS_FILTERS = ['ALL', 'PENDING', 'COMPLETED'] as const;

  return (
    <div className="page-enter" style={{ maxWidth: '1100px', margin: '0 auto' }}>

      {/* ── Page Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '36px', flexWrap: 'wrap', gap: '20px',
      }}>
        <div>
          <div className="section-label" style={{ marginBottom: '10px' }}>Task Organization Studio</div>
          <h1 className="title-hero">Tasks &amp; Assignments</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '14px', marginTop: '8px', lineHeight: 1.5 }}>
            Track academic milestones, set deadlines, and focus on pending course goals.
          </p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary" style={{ padding: '10px 22px' }}>
          <Plus size={15} />
          <span>New Task</span>
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '12px',
        alignItems: 'center',
        padding: '14px 18px',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '24px',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', minWidth: '220px', flex: '1' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by title or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', height: '38px', fontSize: '13px', borderRadius: 'var(--radius-md)' }}
          />
        </div>

        {/* Status Pills */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-subtle)', padding: '3px', borderRadius: 'var(--radius-md)' }}>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '5px 13px', fontSize: '12px', fontWeight: 600,
                borderRadius: 'var(--radius-md)',
                backgroundColor: statusFilter === s ? 'var(--surface)' : 'transparent',
                color: statusFilter === s ? 'var(--text-1)' : 'var(--text-3)',
                boxShadow: statusFilter === s ? 'var(--shadow-sm)' : 'none',
                transition: 'var(--transition)',
              }}
            >
              {s === 'ALL' ? 'All' : s === 'PENDING' ? 'Pending' : 'Completed'}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as 'ALL' | Priority)}
          className="form-input"
          style={{ height: '38px', padding: '4px 12px', fontSize: '12px', width: 'auto', borderRadius: 'var(--radius-md)' }}
        >
          <option value="ALL">All Priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {error && (
        <div className="alert-banner alert-danger">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={fetchTasks} style={{ marginLeft: 'auto', textDecoration: 'underline', background: 'none', color: 'inherit', fontWeight: 600 }}>Retry</button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-2)' }}>
          <div style={{
            width: '32px', height: '32px',
            border: '2.5px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 14px',
          }} />
          <p style={{ fontSize: '13px' }}>Loading your study tasks...</p>
        </div>
      )}

      {!loading && filteredTasks.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '64px 24px',
          backgroundColor: 'var(--surface)',
          border: '1px dashed var(--border-strong)',
          borderRadius: 'var(--radius-xl)',
        }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            backgroundColor: 'var(--sage)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <BookOpen size={22} color="var(--accent)" />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-1)' }}>No tasks found</h3>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', maxWidth: '380px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
              ? 'No tasks match your active filters. Try resetting the filters.'
              : 'You have no study tasks logged yet. Create your first task to plan your academic focus!'}
          </p>
          <button onClick={openCreateModal} className="btn btn-primary" style={{ display: 'inline-flex' }}>
            <Plus size={15} />
            <span>Create First Task</span>
          </button>
        </div>
      )}

      {!loading && filteredTasks.length > 0 && (
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden',
        }}>
          {filteredTasks.map((task, index) => {
            const isCompleted = task.status === 'COMPLETED';
            const isLast = index === filteredTasks.length - 1;
            return (
              <div
                key={task.id}
                style={{
                  padding: '18px 22px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '14px',
                  borderBottom: isLast ? 'none' : '1px solid var(--border)',
                  backgroundColor: isCompleted ? 'var(--bg-subtle)' : 'var(--surface)',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: 0 }}>
                  <button
                    onClick={() => handleToggleComplete(task.id)}
                    style={{ background: 'none', color: isCompleted ? 'var(--accent)' : 'var(--text-3)', padding: '2px', cursor: 'pointer', marginTop: '2px', flexShrink: 0 }}
                    title={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                    aria-label={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                  >
                    {isCompleted ? <CheckCircle2 size={20} color="var(--accent)" /> : <Circle size={20} />}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <h3 style={{
                        fontSize: '14.5px', fontWeight: 600,
                        color: isCompleted ? 'var(--text-3)' : 'var(--text-1)',
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        lineHeight: 1.3,
                      }}>
                        {task.title}
                      </h3>
                      <span className="badge badge-subject" style={{ fontSize: '10px' }}>{task.subject}</span>
                      <span className={`badge badge-priority-${task.priority}`} style={{ fontSize: '10px' }}>{task.priority}</span>
                    </div>

                    {task.description && (
                      <p style={{ fontSize: '12.5px', color: 'var(--text-2)', marginBottom: '6px', lineHeight: 1.5 }}>
                        {task.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={11} />
                        <span>Due {formatDate(task.dueDate)}</span>
                      </div>
                      {isCompleted && (
                        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>· Completed</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button
                    onClick={() => openEditModal(task)}
                    title="Edit Task" aria-label="Edit Task"
                    style={{ background: 'none', color: 'var(--text-3)', padding: '7px', borderRadius: 'var(--radius-sm)', transition: 'var(--transition)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(task.id)}
                    title="Delete Task" aria-label="Delete Task"
                    style={{ background: 'none', color: 'var(--text-3)', padding: '7px', borderRadius: 'var(--radius-sm)', transition: 'var(--transition)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--coral)'; e.currentTarget.style.backgroundColor = 'var(--coral-light)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isCreateOpen || !!editingTask}
        onClose={() => { setIsCreateOpen(false); setEditingTask(null); }}
        maxWidth="520px"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={() => { setIsCreateOpen(false); setEditingTask(null); }}
            aria-label="Close modal"
            style={{ background: 'none', color: 'var(--text-muted)', padding: '5px', borderRadius: 'var(--radius-sm)' }}
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

        <form onSubmit={handleSaveTask}>
          <div className="form-group">
            <label className="form-label" htmlFor="taskTitle">Task Title *</label>
            <input
              id="taskTitle" type="text" className="form-input"
              placeholder="e.g. Chapter 4 Practice Problems"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="taskSubject">Subject *</label>
              {subjects.length === 0 ? (
                <div style={{
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  fontSize: '13px', color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  border: '1.5px solid var(--border)',
                }}>
                  <span>No subjects yet.</span>
                  <Link to="/subjects" style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '12px' }}>
                    Create Subject
                  </Link>
                </div>
              ) : (
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <select
                    id="taskSubject" className="form-input"
                    value={formSubjectId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      setFormSubjectId(selectedId);
                      const sub = subjects.find((s) => s.id === selectedId);
                      if (sub) setFormSubject(sub.name);
                    }}
                    required
                    style={{ paddingLeft: '32px' }}
                  >
                    <option value="" disabled>Select a subject...</option>
                    {formSubject && !subjects.some((s) => s.id === formSubjectId) && (
                      <option value="">{formSubject} (Legacy)</option>
                    )}
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <div style={{
                    position: 'absolute', left: '12px',
                    width: '10px', height: '10px', borderRadius: '50%',
                    backgroundColor: subjects.find((s) => s.id === formSubjectId)?.color || 'var(--accent-olive)',
                    border: '1px solid rgba(0,0,0,0.12)',
                    pointerEvents: 'none',
                  }} />
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="taskPriority">Priority *</label>
              <select
                id="taskPriority" className="form-input"
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as Priority)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="taskDueDate">Due Date &amp; Time *</label>
            <input
              id="taskDueDate" type="datetime-local" className="form-input"
              value={formDueDate}
              onChange={(e) => setFormDueDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="taskDescription">Description (Optional)</label>
            <textarea
              id="taskDescription" className="form-input" rows={3}
              placeholder="Key notes, reference pages, or assignment instructions..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => { setIsCreateOpen(false); setEditingTask(null); }}
              className="btn btn-outline" disabled={isSaving}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        maxWidth="380px"
        style={{ textAlign: 'center' }}
      >
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          backgroundColor: 'var(--accent-coral-subtle)', color: 'var(--accent-coral-text)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <Trash2 size={22} />
        </div>
        <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>Delete Task?</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px', lineHeight: 1.5 }}>
          Are you sure you want to delete this task? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => setDeleteConfirmId(null)} className="btn btn-outline">Cancel</button>
          <button onClick={() => handleDeleteTask(deleteConfirmId!)} className="btn btn-danger">Yes, Delete</button>
        </div>
      </Modal>
    </div>
  );
};
