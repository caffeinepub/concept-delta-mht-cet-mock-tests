import { useViewActivation } from '../contexts/ViewActivationContext';
import { Loader2 } from 'lucide-react';

export default function ViewActivationOverlay() {
  const { activationState } = useViewActivation();

  if (!activationState.isActivating || !activationState.targetView) {
    return null;
  }

  const getViewLabel = (view: string) => {
    switch (view) {
      case 'dashboard':
        return 'Dashboard';
      case 'admin':
        return 'Admin Panel';
      default:
        return view;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-card border-2 border-border rounded-lg p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Loading {getViewLabel(activationState.targetView)}
          </h3>
          <p className="text-sm text-muted-foreground">
            Please wait while we prepare your view...
          </p>
        </div>
      </div>
    </div>
  );
}
