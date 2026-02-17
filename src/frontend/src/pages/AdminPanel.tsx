import { useEffect } from 'react';
import { useViewActivation } from '../contexts/ViewActivationContext';
import { useBootstrappedCallerRole } from '../hooks/useBootstrappedCallerRole';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SuggestionModerationPanel from '../components/SuggestionModerationPanel';
import QuestionManagementPanel from '../components/QuestionManagementPanel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';
import { AppView } from '../App';

interface AdminPanelProps {
  onNavigate: (view: AppView) => void;
}

export default function AdminPanel({ onNavigate }: AdminPanelProps) {
  const { role, isLoading } = useBootstrappedCallerRole();
  const { finishActivation } = useViewActivation();

  const isAdmin = role === 'admin';

  useEffect(() => {
    if (!isLoading) {
      finishActivation('admin');
    }
  }, [isLoading, finishActivation]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header currentView="admin" onNavigate={onNavigate} />
      
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm sm:text-base text-muted-foreground">System administration and management</p>
          </div>

          {/* Access Control */}
          {!isAdmin ? (
            <Alert variant="destructive" className="border-destructive/50">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="text-base font-semibold">Access Denied</AlertTitle>
              <AlertDescription className="text-sm">
                You do not have permission to access the admin panel. Only administrators can view this page.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {/* Suggestion Moderation */}
              <SuggestionModerationPanel />

              {/* Question Management */}
              <QuestionManagementPanel />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
