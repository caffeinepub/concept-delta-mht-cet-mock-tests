import { useViewActivation } from '../contexts/ViewActivationContext';
import { Loader2 } from 'lucide-react';

interface ViewActivationOverlayProps {
  currentView: string;
}

export default function ViewActivationOverlay({ currentView }: ViewActivationOverlayProps) {
  const { isActivating, targetView } = useViewActivation();

  // Only render overlay when:
  // 1. Activation is in progress
  // 2. Target view is set
  // 3. Current view matches the target view
  if (!isActivating || !targetView || currentView !== targetView) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 pointer-events-auto">
      <div className="flex flex-col items-center gap-4 text-white">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="text-lg font-medium">
          Loading {targetView === 'dashboard' ? 'Dashboard' : 'View'}...
        </p>
      </div>
    </div>
  );
}
