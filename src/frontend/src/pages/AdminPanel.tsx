import { useEffect } from 'react';
import { useViewActivation } from '../contexts/ViewActivationContext';
import { useBootstrappedCallerRole } from '../hooks/useBootstrappedCallerRole';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AppView } from '../App';
import { Shield, AlertTriangle, Settings } from 'lucide-react';

interface AdminPanelProps {
  onNavigate: (view: AppView) => void;
}

export default function AdminPanel({ onNavigate }: AdminPanelProps) {
  const { finishActivation } = useViewActivation();
  const { isAdmin, isLoading } = useBootstrappedCallerRole();

  // Signal view ready on mount
  useEffect(() => {
    finishActivation();
  }, [finishActivation]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onNavigate={onNavigate} currentView="landing" />
      
      <main className="flex-1 py-8 sm:py-12 md:py-16">
        <div className="container max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-full mb-4 sm:mb-6">
              <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 px-4">Admin Panel</h1>
            <p className="text-lg sm:text-xl text-muted-foreground px-4">
              System administration and management
            </p>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Loading...</p>
              </CardContent>
            </Card>
          ) : !isAdmin ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="text-base sm:text-lg">Access Denied</AlertTitle>
              <AlertDescription className="text-sm sm:text-base">
                You do not have permission to access the Admin Panel. This area is restricted to administrators only.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                    Admin Features
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Administrative tools and features will appear here
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 text-sm sm:text-base text-muted-foreground">
                  <p>
                    Welcome to the Admin Panel. This area is currently being set up with administrative features.
                  </p>
                  <p>
                    Future capabilities will include:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Question bank management</li>
                    <li>Test creation and scheduling</li>
                    <li>User management and moderation</li>
                    <li>System monitoring and analytics</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
