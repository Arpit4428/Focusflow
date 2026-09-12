import { useContext } from 'react';
import { FocusTimerContext } from '../context/FocusTimerContext';
import type { FocusTimerContextType } from '../context/FocusTimerContext';

export const useFocusTimer = (): FocusTimerContextType => {
  const context = useContext(FocusTimerContext);
  if (!context) {
    throw new Error('useFocusTimer must be used within a FocusTimerProvider');
  }
  return context;
};
