import React, { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/taskService';
import type { Task, Priority, TaskStatus } from '../types/task';
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

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | Priority>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
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

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const openCreateModal = () => {
    setFormTitle('');
    setFormSubject('');
    setFormDescription('');
    setFormPriority('MEDIUM');
    // Default to tomorrow 23:59
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
    setFormSubject(task.subject);
    setFormDescription(task.description || '');
    setFormPriority(task.priority);
    // Format ISO string to datetime-local format YYYY-MM-DDTHH:mm
    const date = new Date(task.dueDate);
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    setFormDueDate(localISOTime);
    setFormError(null);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formSubject.trim() || !formDueDate) {
      setFormError('Title, subject, and due date are required.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const payload = {
      title: formTitle.trim(),
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

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '20px',
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
            <span>Task Organization Studio</span>
          </div>
          <h1 className="title-hero">
            Tasks &amp; Assignments
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '6px' }}>
            Track academic milestones, set deadlines, and focus on pending course goals.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="btn btn-lime"
          style={{ padding: '12px 24px' }}
        >
          <Plus size={16} />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '14px',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-subtle)',
        marginBottom: '28px',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', minWidth: '240px', flex: '1' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by title or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '40px', height: '42px', fontSize: '14px', borderRadius: 'var(--radius-pill)' }}
          />
        </div>

        {/* Status Filter Pills */}
        <div style={{
          display: 'flex',
          gap: '4px',
          backgroundColor: 'var(--bg-secondary)',
          padding: '4px',
          borderRadius: 'var(--radius-pill)',
        }}>
          {(['ALL', 'PENDING', 'COMPLETED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: 'var(--radius-pill)',
                backgroundColor: statusFilter === s ? 'var(--surface-mint)' : 'transparent',
                color: statusFilter === s ? 'var(--text-primary)' : 'var(--text-secondary)',
                transition: 'var(--transition)',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as 'ALL' | Priority)}
            className="form-input"
            style={{ height: '40px', padding: '6px 14px', fontSize: '13px', width: 'auto', borderRadius: 'var(--radius-pill)' }}
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="alert-banner alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={fetchTasks} style={{ marginLeft: 'auto', textDecoration: 'underline', background: 'none', color: 'inherit' }}>
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <div style={{
            width: '36px',
            height: '36px',
            border: '3px solid var(--border-strong)',
            borderTopColor: 'var(--text-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p>Loading your study tasks...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredTasks.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '64px 24px',
          backgroundColor: 'var(--surface)',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--radius-lg)',
          marginTop: '12px',
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: 'var(--surface-mint)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <BookOpen size={24} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>No tasks found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '420px', margin: '0 auto 20px' }}>
            {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
              ? 'No tasks match your active filters. Try resetting the filters.'
              : 'You have no study tasks logged yet. Create your first task to plan your academic focus!'}
          </p>
          <button onClick={openCreateModal} className="btn btn-lime" style={{ width: 'auto' }}>
            <Plus size={16} />
            <span>Create First Task</span>
          </button>
        </div>
      )}

      {/* Clean Productivity List */}
      {!loading && filteredTasks.length > 0 && (
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
        }}>
          {filteredTasks.map((task, index) => {
            const isCompleted = task.status === 'COMPLETED';
            const isLast = index === filteredTasks.length - 1;

            return (
              <div
                key={task.id}
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px',
                  borderBottom: isLast ? 'none' : '1px solid var(--border)',
                  backgroundColor: isCompleted ? 'rgba(243, 246, 241, 0.4)' : 'transparent',
                  transition: 'var(--transition)',
                }}
              >
                {/* Completion button & Title content */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1, minWidth: 0 }}>
                  <button
                    onClick={() => handleToggleComplete(task.id)}
                    style={{
                      background: 'none',
                      color: isCompleted ? '#1F4C27' : 'var(--text-muted)',
                      padding: '2px',
                      cursor: 'pointer',
                      marginTop: '3px',
                      flexShrink: 0,
                    }}
                    title={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                    aria-label={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                  >
                    {isCompleted ? <CheckCircle2 size={22} color="#1F4C27" /> : <Circle size={22} />}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <h3 style={{
                        fontSize: '17px',
                        fontWeight: 600,
                        color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        lineHeight: '1.3',
                      }}>
                        {task.title}
                      </h3>

                      <span className="badge badge-subject" style={{ fontSize: '11px' }}>
                        {task.subject}
                      </span>

                      <span className={`badge badge-priority-${task.priority}`} style={{ fontSize: '10px' }}>
                        {task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        marginBottom: '8px',
                        lineHeight: '1.5',
                      }}>
                        {task.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={13} />
                        <span>Due {formatDate(task.dueDate)}</span>
                      </div>
                      {isCompleted && (
                        <span style={{ color: '#1F4C27', fontWeight: 600 }}>• Completed</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit & Delete Action Buttons */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={() => openEditModal(task)}
                    title="Edit Task"
                    aria-label="Edit Task"
                    style={{
                      background: 'none',
                      color: 'var(--text-muted)',
                      padding: '6px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(task.id)}
                    title="Delete Task"
                    aria-label="Delete Task"
                    style={{
                      background: 'none',
                      color: 'var(--text-muted)',
                      padding: '6px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-coral)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Task Modal */}
      {(isCreateOpen || editingTask) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em' }}>
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingTask(null);
                }}
                aria-label="Close modal"
                style={{ background: 'none', color: 'var(--text-muted)', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="alert-banner alert-danger">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTask}>
              <div className="form-group">
                <label className="form-label" htmlFor="taskTitle">Task Title *</label>
                <input
                  id="taskTitle"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Chapter 4 Practice Problems"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="taskSubject">Subject / Category *</label>
                  <input
                    id="taskSubject"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Mathematics"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="taskPriority">Priority *</label>
                  <select
                    id="taskPriority"
                    className="form-input"
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
                  id="taskDueDate"
                  type="datetime-local"
                  className="form-input"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="taskDescription">Description (Optional)</label>
                <textarea
                  id="taskDescription"
                  className="form-input"
                  rows={3}
                  placeholder="Key notes, reference pages, or assignment instructions..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingTask(null);
                  }}
                  className="btn btn-outline"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-lime"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-coral-soft)',
              color: 'var(--accent-coral-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Delete Task?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTask(deleteConfirmId)}
                className="btn btn-danger"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

