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
    <div className="page-enter" style={{ maxWidth: '1360px', margin: '0 auto' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
          <CalendarIcon size={13} color="var(--text-3)" />
          <span className="section-label">Academic Calendar</span>
        </div>
        <h1 className="title-hero">Schedule &amp; Activity</h1>
        <p style={{ color: 'var(--text-2)', fontSize: '14px', marginTop: '8px', lineHeight: 1.5 }}>
          Explore your daily focus duration, task deadlines, and coursework consistency across the month.
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: '24px' }}>
          <div className="alert-banner alert-danger">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button
              onClick={() => fetchCalendar(currentYear, currentMonth)}
              style={{ marginLeft: 'auto', textDecoration: 'underline', background: 'none', color: 'inherit', fontWeight: 600 }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-2)' }}>
          <div style={{
            width: '32px', height: '32px',
            border: '2.5px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 14px',
          }} />
          <p style={{ fontSize: '13px' }}>Loading monthly calendar data...</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px',
          alignItems: 'start',
        }}>
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

          <div style={{ flex: '1 1 40%', minWidth: '300px' }}>
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
