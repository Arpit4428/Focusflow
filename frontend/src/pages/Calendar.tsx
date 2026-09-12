import React, { useState, useEffect, useCallback } from 'react';
import { calendarService } from '../services/calendarService';
import { taskService } from '../services/taskService';
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import { DayActivityPanel } from '../components/calendar/DayActivityPanel';
import type { CalendarDayActivity } from '../types/calendar';
import type { ApiError } from '../types/auth';
import { Calendar as CalendarIcon, AlertCircle } from 'lucide-react';

export const Calendar: React.FC = () => {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState<number>(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(now.getMonth() + 1); // 1-12

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [activities, setActivities] = useState<CalendarDayActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendar = useCallback(async (year: number, month: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await calendarService.getCalendarActivity(year, month);
      setActivities(response.activities);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to load calendar activity.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendar(currentYear, currentMonth);
  }, [currentYear, currentMonth, fetchCalendar]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear((prev) => prev - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear((prev) => prev + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    setCurrentYear(y);
    setCurrentMonth(m);
    setSelectedDate(`${y}-${String(m).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      const updated = await taskService.toggleComplete(taskId);
      setActivities((prev) =>
        prev.map((act) => {
          const taskExists = act.tasks.some((t) => t.id === taskId);
          if (!taskExists) return act;

          const updatedTasks = act.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: updated.status as 'PENDING' | 'COMPLETED',
                }
              : t
          );
          const completedCount = updatedTasks.filter((t) => t.status === 'COMPLETED').length;
          const pendingCount = updatedTasks.length - completedCount;

          return {
            ...act,
            tasks: updatedTasks,
            completedTaskCount: completedCount,
            pendingTaskCount: pendingCount,
          };
        })
      );
    } catch {
      alert('Failed to update task status.');
    }
  };

  const selectedActivity = activities.find((a) => a.date === selectedDate);

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
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
          <CalendarIcon size={14} />
          <span>Academic Calendar</span>
        </div>
        <h1 className="title-hero">
          Schedule &amp; Activity
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '6px' }}>
          Explore your daily focus duration, task deadlines, and coursework consistency across the month.
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: '24px' }}>
          <div className="alert-banner alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button
              onClick={() => fetchCalendar(currentYear, currentMonth)}
              style={{ marginLeft: 'auto', textDecoration: 'underline', background: 'none', color: 'inherit' }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{
            width: '36px',
            height: '36px',
            border: '3px solid var(--border-strong)',
            borderTopColor: 'var(--text-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p>Loading monthly calendar data...</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '28px',
          alignItems: 'start',
        }}>
          {/* Main Month Grid (takes 1.4-1.5 flex ratio on wide screens) */}
          <div style={{ flex: '1 1 60%' }}>
            <CalendarGrid
              year={currentYear}
              month={currentMonth}
              selectedDate={selectedDate}
              onSelectDate={(dt) => setSelectedDate(dt)}
              activities={activities}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onToday={handleToday}
            />
          </div>

          {/* Side Panel: Selected Day Details */}
          <div style={{ flex: '1 1 40%', minWidth: '320px' }}>
            <DayActivityPanel
              dateStr={selectedDate}
              activity={selectedActivity}
              onToggleTask={handleToggleTask}
            />
          </div>
        </div>
      )}
    </div>
  );
};
