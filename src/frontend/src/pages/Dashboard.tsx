import { lazy, Suspense, useEffect } from 'react';
import { useGetCallerUserProfile, useGetCallerRole, useGetTestConfigsWithStatus } from '../hooks/useQueries';
import { useViewActivation } from '../contexts/ViewActivationContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ShareButtons from '../components/ShareButtons';
import TestConfigList from '../components/TestConfigList';
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
    data: testConfigsWithStatus = [], 
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
  }, [profileFetched, profileError, profileLoading, profileFetching, testsFetched, testsError, testsLoading, testsFetching, finishActivation]);

  const handleRetry = () => {
    if (profileError) refetchProfile();
    if (testsError) refetchTests();
  };

  const showLoadingSkeleton = (profileLoading || profileFetching || testsLoading || testsFetching) && !profileError && !testsError;
  const showError = profileError || testsError;
  const showEmptyState = !showLoadingSkeleton && !showError && testConfigsWithStatus.length === 0;
  const showTestList = !showLoadingSkeleton && !showError && testConfigsWithStatus.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header currentView="dashboard" onNavigate={onNavigate} />
      
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* Hero Banner */}
          <div className="relative w-full h-32 sm:h-40 md:h-48 rounded-xl overflow-hidden shadow-lg">
            <img
              src="/assets/generated/hero-banner.dim_800x400.png"
              alt="Concept Delta Banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-transparent flex items-center px-4 sm:px-6 md:px-8">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">
                  Welcome to Concept Delta!
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-white/90">
                  Your MHT-CET preparation platform
                </p>
              </div>
            </div>
          </div>

          {/* Error State */}
          {showError && (
            <Alert variant="destructive" className="border-destructive/50">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="text-base font-semibold">Unable to load dashboard</AlertTitle>
              <AlertDescription className="mt-2 space-y-3">
                <p className="text-sm">
                  {profileError ? 'Failed to load your profile. ' : ''}
                  {testsError ? 'Failed to load available tests. ' : ''}
                  Please check your connection and try again.
                </p>
                <Button onClick={handleRetry} variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Loading Skeleton */}
          {showLoadingSkeleton && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-card border-border">
                    <CardContent className="p-6 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {showEmptyState && (
            <Card className="bg-card border-border">
              <CardContent className="py-16 text-center">
                <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Backend Integration In Progress</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  The full backend functionality is currently being integrated. Test features will be available soon!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Test List */}
          {showTestList && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Available Tests</h2>
              <TestConfigList testConfigs={testConfigsWithStatus} onStartTest={onStartTest} />
            </div>
          )}

          {/* Suggestions & Reviews Section */}
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <div className="border-b border-border px-4 sm:px-6 py-4">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Suggestions & Reviews
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                <Suspense fallback={
                  <div className="py-8 text-center">
                    <Skeleton className="h-32 w-full" />
                  </div>
                }>
                  <SuggestionSection userName={userProfile?.fullName || 'Guest'} />
                </Suspense>
              </div>
            </CardContent>
          </Card>

          {/* Share Section */}
          <Card className="bg-card border-border">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3">Share with Friends</h3>
              <ShareButtons />
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
