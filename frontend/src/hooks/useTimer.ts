import { useState, useRef, useEffect, useCallback } from 'react';

export type TimerStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED';

export interface CompletedSessionData {
  durationSeconds: number;
  startedAt: string;
  endedAt: string;
}

export const useTimer = () => {
  const [status, setStatus] = useState<TimerStatus>('IDLE');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // References to preserve precise millisecond timestamps across renders without drift
  const startTimeRef = useRef<number | null>(null);
  const accumulatedPausedMsRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const clearTimerInterval = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

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
    pauseStartTimeRef.current = Date.now();
    setStatus('PAUSED');
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
    if (status === 'IDLE' || startTimeRef.current === null) return null;

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
    return result;
  }, [status]);

  const reset = useCallback(() => {
    clearTimerInterval();
    startTimeRef.current = null;
    accumulatedPausedMsRef.current = 0;
    pauseStartTimeRef.current = null;
    setElapsedSeconds(0);
    setStatus('IDLE');
  }, []);

  // Interval loop calculating exact difference between current timestamp and start timestamp
  useEffect(() => {
    if (status === 'RUNNING') {
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

  // Format seconds into HH:MM:SS
  const formatTime = (totalSecs: number): string => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  return {
    status,
    elapsedSeconds,
    formattedTime: formatTime(elapsedSeconds),
    start,
    pause,
    resume,
    stop,
    reset,
  };
};
