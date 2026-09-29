import React, { createContext, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import type { TimerStatus, CompletedSessionData } from '../hooks/useTimer';
import { sessionService } from '../services/sessionService';
import { PipFloatingTimer } from '../components/focus/PipFloatingTimer';

export interface FocusTimerContextType {
  status: TimerStatus;
  elapsedSeconds: number;
  remainingSeconds: number;
  targetDurationSeconds: number;
  setTargetDuration: (seconds: number) => { success: boolean; error?: string };
  formattedTime: string;
  selectedSubjectId: string;
  selectedSubjectName: string;
  selectedSubjectColor: string;
  setSelectedSubject: (id: string, name: string, color?: string) => void;
  start: () => { success: boolean; error?: string };
  pause: () => void;
  resume: () => void;
  stop: () => CompletedSessionData | null;
  stopAndSave: () => Promise<CompletedSessionData | null>;
  reset: () => void;
  // Picture-in-Picture Mini Player
  isPipSupported: boolean;
  isPipActive: boolean;
  openPip: () => Promise<void>;
  closePip: () => void;
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

  const selectedSubjectIdRef = useRef<string>(initialSaved?.selectedSubjectId ?? '');
  const selectedSubjectNameRef = useRef<string>(initialSaved?.selectedSubjectName ?? '');

  useEffect(() => {
    selectedSubjectIdRef.current = selectedSubjectId;
    selectedSubjectNameRef.current = selectedSubjectName;
  }, [selectedSubjectId, selectedSubjectName]);

  // Picture-in-Picture window reference
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const isPipSupported = typeof window !== 'undefined' && 'documentPictureInPicture' in window;
  const isPipActive = pipWindow !== null && !pipWindow.closed;

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

  const setTargetDuration = useCallback((_seconds: number): { success: boolean; error?: string } => {
    return { success: true };
  }, []);

  const start = useCallback((): { success: boolean; error?: string } => {
    const now = Date.now();
    startTimeRef.current = now;
    accumulatedPausedMsRef.current = 0;
    pauseStartTimeRef.current = null;
    setElapsedSeconds(0);
    setStatus('RUNNING');
    return { success: true };
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
    startTimeRef.current = null;
    accumulatedPausedMsRef.current = 0;
    pauseStartTimeRef.current = null;
    setElapsedSeconds(0);
    setStatus('IDLE');
    localStorage.removeItem(TIMER_STORAGE_KEY);

    // Close PiP window if open when session ends
    if (pipWindow && !pipWindow.closed) {
      pipWindow.close();
      setPipWindow(null);
    }

    return result;
  }, [status, pipWindow]);

  const stopAndSave = useCallback(async (): Promise<CompletedSessionData | null> => {
    const result = stop();
    if (result && selectedSubjectName) {
      if (result.durationSeconds >= 1) {
        try {
          await sessionService.createSession({
            subjectId: selectedSubjectId || undefined,
            subject: selectedSubjectName,
            duration: result.durationSeconds,
            startedAt: result.startedAt,
            endedAt: result.endedAt,
            completed: true,
          });
        } catch (e) {
          console.error('Failed to automatically save focus session:', e);
          throw e;
        }
      }
    }
    return result;
  }, [stop, selectedSubjectId, selectedSubjectName]);

  const reset = useCallback(() => {
    clearTimerInterval();
    startTimeRef.current = null;
    accumulatedPausedMsRef.current = 0;
    pauseStartTimeRef.current = null;
    setElapsedSeconds(0);
    setStatus('IDLE');
    localStorage.removeItem(TIMER_STORAGE_KEY);

    if (pipWindow && !pipWindow.closed) {
      pipWindow.close();
      setPipWindow(null);
    }
  }, [pipWindow]);

  // Close floating window helper
  const closePip = useCallback(() => {
    if (pipWindow && !pipWindow.closed) {
      pipWindow.close();
    }
    setPipWindow(null);
  }, [pipWindow]);

  // Open Document Picture-in-Picture window
  const openPip = useCallback(async () => {
    if (!isPipSupported) {
      return;
    }

    // If window is already open, simply bring it to focus
    if (pipWindow && !pipWindow.closed) {
      pipWindow.focus();
      return;
    }

    try {
      type PipApi = {
        documentPictureInPicture?: {
          requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>;
        };
      };
      const api = window as unknown as PipApi;
      if (!api.documentPictureInPicture) return;

      const pipWin = await api.documentPictureInPicture.requestWindow({
        width: 340,
        height: 240,
      });

      // Clone existing styles into PiP document
      document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
        pipWin.document.head.appendChild(node.cloneNode(true));
      });

      // Match current application theme
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      pipWin.document.documentElement.setAttribute('data-theme', currentTheme);

      // Base reset styling for PiP canvas
      const baseStyle = pipWin.document.createElement('style');
      baseStyle.textContent = `
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background-color: var(--bg);
          color: var(--text-primary);
          font-family: var(--font-sans);
          -webkit-font-smoothing: antialiased;
        }
      `;
      pipWin.document.head.appendChild(baseStyle);

      // Listen for window close
      pipWin.addEventListener('pagehide', () => {
        setPipWindow(null);
      });

      setPipWindow(pipWin);
    } catch (err) {
      console.error('Failed to open Document Picture-in-Picture window:', err);
    }
  }, [isPipSupported, pipWindow]);

  // Synchronize theme changes from main document to PiP window
  useEffect(() => {
    if (pipWindow && !pipWindow.closed) {
      const syncTheme = () => {
        const theme = document.documentElement.getAttribute('data-theme') || 'dark';
        pipWindow.document.documentElement.setAttribute('data-theme', theme);
      };
      syncTheme();

      const observer = new MutationObserver(syncTheme);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      return () => observer.disconnect();
    }
  }, [pipWindow]);

  // Interval loop calculating exact difference between current timestamp and start timestamp
  useEffect(() => {
    if (status === 'RUNNING') {
      const updateTick = () => {
        if (startTimeRef.current !== null) {
          const now = Date.now();
          const currentElapsedMs = now - startTimeRef.current - accumulatedPausedMsRef.current;
          const currentElapsed = Math.max(0, Math.floor(currentElapsedMs / 1000));
          setElapsedSeconds(currentElapsed);
        }
      };

      updateTick();
      intervalRef.current = window.setInterval(updateTick, 250);
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
        remainingSeconds: 0,
        targetDurationSeconds: 0,
        setTargetDuration,
        formattedTime: formatTime(elapsedSeconds),
        selectedSubjectId,
        selectedSubjectName,
        selectedSubjectColor,
        setSelectedSubject,
        start,
        pause,
        resume,
        stop,
        stopAndSave,
        reset,
        isPipSupported,
        isPipActive,
        openPip,
        closePip,
      }}
    >
      {children}

      {/* Render floating PiP window content via React Portal directly into pipWindow document body */}
      {pipWindow && !pipWindow.closed && createPortal(
        <PipFloatingTimer
          onClose={closePip}
          onFocusOpener={() => {
            window.focus();
          }}
        />,
        pipWindow.document.body
      )}
    </FocusTimerContext.Provider>
  );
};
