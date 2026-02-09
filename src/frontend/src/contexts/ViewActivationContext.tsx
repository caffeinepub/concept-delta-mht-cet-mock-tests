import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { AppView } from '../App';

interface ViewActivationState {
  isActivating: boolean;
  targetView: AppView | null;
  startTime: number | null;
}

interface ViewActivationContextType {
  activationState: ViewActivationState;
  startActivation: (view: AppView) => void;
  finishActivation: () => void;
  isActivatingView: (view: AppView) => boolean;
}

const ViewActivationContext = createContext<ViewActivationContextType | undefined>(undefined);

const ACTIVATION_TIMEOUT = 10000; // 10 seconds safety timeout

export function ViewActivationProvider({ children }: { children: ReactNode }) {
  const [activationState, setActivationState] = useState<ViewActivationState>({
    isActivating: false,
    targetView: null,
    startTime: null,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentViewRef = useRef<AppView | null>(null);

  const startActivation = useCallback((view: AppView) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    currentViewRef.current = view;
    setActivationState({
      isActivating: true,
      targetView: view,
      startTime: Date.now(),
    });

    // Set new safety timeout
    timeoutRef.current = setTimeout(() => {
      console.warn(`View activation timeout for ${view} - forcing finish`);
      setActivationState({
        isActivating: false,
        targetView: null,
        startTime: null,
      });
      currentViewRef.current = null;
    }, ACTIVATION_TIMEOUT);
  }, []);

  const finishActivation = useCallback(() => {
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    currentViewRef.current = null;
    setActivationState({
      isActivating: false,
      targetView: null,
      startTime: null,
    });
  }, []);

  const isActivatingView = useCallback((view: AppView) => {
    return activationState.isActivating && activationState.targetView === view;
  }, [activationState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <ViewActivationContext.Provider value={{ activationState, startActivation, finishActivation, isActivatingView }}>
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
