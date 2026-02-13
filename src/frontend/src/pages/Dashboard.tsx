import { lazy, Suspense, useEffect } from 'react';
import { useGetCallerUserProfile, useGetCallerRole, useGetTestConfigsWithStatus } from '../hooks/useQueries';
import { useViewActivation } from '../contexts/ViewActivationContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ShareButtons from '../components/ShareButtons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AppView } from '../App';
import { AlertCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const SuggestionSection = lazy(() => import('../components/SuggestionSection'));

interface DashboardProps {
  onNavigate: (view: AppView) => void;
  onStartTest: (testId: bigint) => void;
}

export default function Dashboard({ onNavigate, onStartTest }: DashboardProps) {
  const { 
    data: userProfile, 
    isLoading: profileLoading, 
    isFetching: profileFetching, 
    isFetched: profileFetched,
    isError: profileError,
    error: profileErrorObj,
    refetch: refetchProfile
  } = useGetCallerUserProfile();
  
  const { 
    data: userRole,
    isError: roleError,
    error: roleErrorObj
  } = useGetCallerRole();
  
  const { 
    data: testConfigsWithStatus, 
    isLoading: testsLoading, 
    isFetching: testsFetching, 
    isError: testsError,
    error: testsErrorObj,
    isFetched: testsFetched,
    refetch: refetchTests
  } = useGetTestConfigsWithStatus();
  
  const { finishActivation, cancelActivation } = useViewActivation();

  const isAdmin = userRole === 'admin';

  // Finish activation when Dashboard has loaded or errored
  useEffect(() => {
    const profileSettled = profileFetched || profileError || (!profileLoading && !profileFetching);
    const testsSettled = testsFetched || testsError || (!testsLoading && !testsFetching);
    
    if (profileSettled && testsSettled) {
      finishActivation('dashboard');
    }
  }, [profileLoading, profileFetching, profileFetched, profileError, testsLoading, testsFetching, testsFetched, testsError, finishActivation]);

  // Cancel activation on unmount (user navigated away mid-load)
  useEffect(() => {
    return () => {
      cancelActivation('dashboard');
    };
  }, [cancelActivation]);

  // Loading state - show skeletons
  if (profileLoading || testsLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onNavigate={onNavigate} currentView="dashboard" />
        <main className="flex-1 container py-6 sm:py-8 px-4 sm:px-6">
          <div className="space-y-6">
            <Skeleton className="h-24 sm:h-32 w-full" />
            <Skeleton className="h-64 sm:h-96 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state - show error message with retry
  if (profileError || roleError || testsError) {
    const errorMessage = 
      (profileErrorObj as any)?.message || 
      (roleErrorObj as any)?.message || 
      (testsErrorObj as any)?.message || 
      'An error occurred while loading dashboard data';

    return (
      <div className="min-h-screen flex flex-col">
        <Header onNavigate={onNavigate} currentView="dashboard" />
        <main className="flex-1 container py-6 sm:py-8 px-4 sm:px-6">
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Error Loading Dashboard</AlertTitle>
            <AlertDescription className="mt-2">
              {errorMessage}
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-3 mb-6">
            {profileError && (
              <Button onClick={() => refetchProfile()} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Retry Profile
              </Button>
            )}
            {testsError && (
              <Button onClick={() => refetchTests()} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Retry Tests
              </Button>
            )}
          </div>

          <Card className="bg-card border-2 border-muted mb-8">
            <CardContent className="p-8 sm:p-12 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-foreground">
                Unable to Load Dashboard
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md">
                Please try refreshing the page or contact support if the problem persists.
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Empty state - no tests available
  const hasTests = testConfigsWithStatus && testConfigsWithStatus.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header onNavigate={onNavigate} currentView="dashboard" />
      
      <main className="flex-1 container py-6 sm:py-8 px-4 sm:px-6">
        <div className="mb-6 sm:mb-8 flex justify-center">
          <img 
            src="/assets/photo_2026-01-08_11-34-29.jpg" 
            alt="Concept Delta - MHT CET Mock Tests Portal" 
            className="concept-delta-banner"
          />
        </div>

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-foreground">
            Welcome to Concept Delta!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Your MHT-CET preparation platform
          </p>
        </div>

        {!hasTests && (
          <Card className="bg-card border-2 border-info/50 mb-8">
            <CardContent className="p-8 sm:p-12 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-info mb-4" />
              <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-foreground">
                Backend Integration In Progress
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md">
                The full backend functionality is currently being integrated. Test features will be available soon!
              </p>
            </CardContent>
          </Card>
        )}

        <div className="mb-8">
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <SuggestionSection userName={userProfile?.fullName || 'User'} />
          </Suspense>
        </div>

        <div className="mb-8">
          <ShareButtons />
        </div>
      </main>

      <Footer />
    </div>
  );
}
