import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
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

  const startActivation = useCallback((view: AppView) => {
    setActivationState({
      isActivating: true,
      targetView: view,
      startTime: Date.now(),
    });
  }, []);

  const finishActivation = useCallback(() => {
    setActivationState({
      isActivating: false,
      targetView: null,
      startTime: null,
    });
  }, []);

  const isActivatingView = useCallback((view: AppView) => {
    return activationState.isActivating && activationState.targetView === view;
  }, [activationState]);

  // Safety timeout to prevent indefinite loading
  useEffect(() => {
    if (activationState.isActivating && activationState.startTime) {
      const elapsed = Date.now() - activationState.startTime;
      const remaining = ACTIVATION_TIMEOUT - elapsed;

      if (remaining > 0) {
        const timeoutId = setTimeout(() => {
          console.warn('View activation timeout - forcing finish');
          finishActivation();
        }, remaining);

        return () => clearTimeout(timeoutId);
      } else {
        finishActivation();
      }
    }
  }, [activationState, finishActivation]);

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
