import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

type ActivationTarget = 'dashboard' | null;

interface ViewActivationContextType {
  isActivating: boolean;
  targetView: ActivationTarget;
  startActivation: (target: 'dashboard', currentView?: string) => void;
  finishActivation: (currentView?: string) => void;
  cancelActivation: (currentView?: string) => void;
  isActivatingView: (view: string) => boolean;
}

const ViewActivationContext = createContext<ViewActivationContextType | undefined>(undefined);

const SAFETY_TIMEOUT_MS = 5000;

// Dev-only logging helper
const logActivation = (event: string, target: ActivationTarget, currentView?: string) => {
  if (import.meta.env.DEV) {
    console.log(`[ViewActivation] ${event}:`, { target, currentView, timestamp: new Date().toISOString() });
  }
};

export function ViewActivationProvider({ children }: { children: React.ReactNode }) {
  const [isActivating, setIsActivating] = useState(false);
  const [targetView, setTargetView] = useState<ActivationTarget>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentTargetRef = useRef<ActivationTarget>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const startActivation = useCallback((target: 'dashboard', currentView?: string) => {
    logActivation('START', target, currentView);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Set activation state
    setIsActivating(true);
    setTargetView(target);
    currentTargetRef.current = target;

    // Safety timeout - auto-finish after 5 seconds
    timeoutRef.current = setTimeout(() => {
      // Only finish if we're still activating the same target
      if (currentTargetRef.current === target) {
        logActivation('TIMEOUT', target, currentView);
        setIsActivating(false);
        setTargetView(null);
        currentTargetRef.current = null;
      }
      timeoutRef.current = null;
    }, SAFETY_TIMEOUT_MS);
  }, []);

  const finishActivation = useCallback((currentView?: string) => {
    logActivation('FINISH', currentTargetRef.current, currentView);

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Clear activation state
    setIsActivating(false);
    setTargetView(null);
    currentTargetRef.current = null;
  }, []);

  const cancelActivation = useCallback((currentView?: string) => {
    logActivation('CANCEL', currentTargetRef.current, currentView);

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Immediately clear activation state
    setIsActivating(false);
    setTargetView(null);
    currentTargetRef.current = null;
  }, []);

  const isActivatingView = useCallback((view: string) => {
    return isActivating && targetView === view;
  }, [isActivating, targetView]);

  return (
    <ViewActivationContext.Provider
      value={{
        isActivating,
        targetView,
        startActivation,
        finishActivation,
        cancelActivation,
        isActivatingView,
      }}
    >
      {children}
    </ViewActivationContext.Provider>
  );
}

export function useViewActivation() {
  const context = useContext(ViewActivationContext);
  if (!context) {
    throw new Error('useViewActivation must be used within ViewActivationProvider');
  }
  return context;
}
