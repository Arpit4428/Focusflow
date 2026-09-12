import React, { createContext, useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { TimerStatus, CompletedSessionData } from '../hooks/useTimer';

export interface FocusTimerContextType {
  status: TimerStatus;
  elapsedSeconds: number;
  formattedTime: string;
  selectedSubjectId: string;
  selectedSubjectName: string;
  selectedSubjectColor: string;
  setSelectedSubject: (id: string, name: string, color?: string) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => CompletedSessionData | null;
  reset: () => void;
}

const TIMER_STORAGE_KEY = 'focusflow_active_timer';

interface PersistedTimerState {
  status: TimerStatus;
  startTime: number | null;
  accumulatedPausedMs: number;
  pauseStartTime: number | null;
  selectedSubjectId: string;
  selectedSubjectName: string;
  selectedSubjectColor?: string;
}

const formatTime = (totalSecs: number): string => {
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const loadPersistedState = (): PersistedTimerState | null => {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedTimerState;
    if (parsed && (parsed.status === 'RUNNING' || parsed.status === 'PAUSED')) {
      return parsed;
    }
  } catch {
    // Ignore corrupted state
  }
  return null;
};

const getInitialElapsed = (saved: PersistedTimerState | null): number => {
  if (!saved || saved.startTime === null) return 0;
  if (saved.pauseStartTime !== null) {
    const pausedElapsedMs = saved.pauseStartTime - saved.startTime - saved.accumulatedPausedMs;
    return Math.max(0, Math.floor(pausedElapsedMs / 1000));
  }
  const now = Date.now();
  const currentElapsedMs = now - saved.startTime - saved.accumulatedPausedMs;
  return Math.max(0, Math.floor(currentElapsedMs / 1000));
};

export const FocusTimerContext = createContext<FocusTimerContextType | undefined>(undefined);

export const FocusTimerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [initialSaved] = useState<PersistedTimerState | null>(loadPersistedState);

  // Drift-free millisecond timestamp references
  const startTimeRef = useRef<number | null>(initialSaved?.startTime ?? null);
  const accumulatedPausedMsRef = useRef<number>(initialSaved?.accumulatedPausedMs ?? 0);
  const pauseStartTimeRef = useRef<number | null>(initialSaved?.pauseStartTime ?? null);
  const intervalRef = useRef<number | null>(null);

  const [status, setStatus] = useState<TimerStatus>(initialSaved?.status ?? 'IDLE');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => getInitialElapsed(initialSaved));
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSaved?.selectedSubjectId ?? '');
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>(initialSaved?.selectedSubjectName ?? '');
  const [selectedSubjectColor, setSelectedSubjectColor] = useState<string>(initialSaved?.selectedSubjectColor ?? '');

  const clearTimerInterval = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const persistState = useCallback((currentStatus: TimerStatus) => {
    if (currentStatus === 'RUNNING' || currentStatus === 'PAUSED') {
      const data: PersistedTimerState = {
        status: currentStatus,
        startTime: startTimeRef.current,
        accumulatedPausedMs: accumulatedPausedMsRef.current,
        pauseStartTime: pauseStartTimeRef.current,
        selectedSubjectId,
        selectedSubjectName,
        selectedSubjectColor,
      };
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    }
  }, [selectedSubjectId, selectedSubjectName, selectedSubjectColor]);

  const setSelectedSubject = useCallback((id: string, name: string, color?: string) => {
    setSelectedSubjectId(id);
    setSelectedSubjectName(name);
    if (color) setSelectedSubjectColor(color);
  }, []);

  const start = useCallback(() => {
    const now = Date.now();
    startTimeRef.current = now;
    accumulatedPausedMsRef.current = 0;
    pauseStartTimeRef.current = null;
    setElapsedSeconds(0);
    setStatus('RUNNING');
  }, []);

  const pause = useCallback(() => {
    if (status !== 'RUNNING') return;
    const now = Date.now();
    pauseStartTimeRef.current = now;
    setStatus('PAUSED');
    if (startTimeRef.current !== null) {
      const elapsedMs = now - startTimeRef.current - accumulatedPausedMsRef.current;
      setElapsedSeconds(Math.max(0, Math.floor(elapsedMs / 1000)));
    }
  }, [status]);

  const resume = useCallback(() => {
    if (status !== 'PAUSED') return;
    if (pauseStartTimeRef.current !== null) {
      accumulatedPausedMsRef.current += Date.now() - pauseStartTimeRef.current;
      pauseStartTimeRef.current = null;
    }
    setStatus('RUNNING');
  }, [status]);

  const stop = useCallback((): CompletedSessionData | null => {
    if ((status !== 'RUNNING' && status !== 'PAUSED') || startTimeRef.current === null) {
      return null;
    }

    const endTime = Date.now();
    let totalPausedMs = accumulatedPausedMsRef.current;
    if (status === 'PAUSED' && pauseStartTimeRef.current !== null) {
      totalPausedMs += endTime - pauseStartTimeRef.current;
    }

    const totalDurationMs = endTime - startTimeRef.current - totalPausedMs;
    const durationSeconds = Math.max(0, Math.floor(totalDurationMs / 1000));

    const result: CompletedSessionData = {
      durationSeconds,
      startedAt: new Date(startTimeRef.current).toISOString(),
      endedAt: new Date(endTime).toISOString(),
    };

    clearTimerInterval();
    setStatus('COMPLETED');
    localStorage.removeItem(TIMER_STORAGE_KEY);
    return result;
  }, [status]);

  const reset = useCallback(() => {
    clearTimerInterval();
    startTimeRef.current = null;
    accumulatedPausedMsRef.current = 0;
    pauseStartTimeRef.current = null;
    setElapsedSeconds(0);
    setStatus('IDLE');
    localStorage.removeItem(TIMER_STORAGE_KEY);
  }, []);

  // Interval loop calculating exact difference between current timestamp and start timestamp
  useEffect(() => {
    if (status === 'RUNNING') {
      // Immediate tick
      if (startTimeRef.current !== null) {
        const now = Date.now();
        const currentElapsedMs = now - startTimeRef.current - accumulatedPausedMsRef.current;
        setElapsedSeconds(Math.max(0, Math.floor(currentElapsedMs / 1000)));
      }

      intervalRef.current = window.setInterval(() => {
        if (startTimeRef.current !== null) {
          const now = Date.now();
          const currentElapsedMs = now - startTimeRef.current - accumulatedPausedMsRef.current;
          setElapsedSeconds(Math.max(0, Math.floor(currentElapsedMs / 1000)));
        }
      }, 250);
    } else {
      clearTimerInterval();
    }

    return () => clearTimerInterval();
  }, [status]);

  // Sync state to localStorage whenever critical timer properties change
  useEffect(() => {
    persistState(status);
  }, [status, persistState]);

  // Reset timer on auth expiration
  useEffect(() => {
    const handleAuthExpired = () => {
      reset();
    };

    window.addEventListener('focusflow_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('focusflow_auth_expired', handleAuthExpired);
  }, [reset]);

  return (
    <FocusTimerContext.Provider
      value={{
        status,
        elapsedSeconds,
        formattedTime: formatTime(elapsedSeconds),
        selectedSubjectId,
        selectedSubjectName,
        selectedSubjectColor,
        setSelectedSubject,
        start,
        pause,
        resume,
        stop,
        reset,
      }}
    >
      {children}
    </FocusTimerContext.Provider>
  );
};
