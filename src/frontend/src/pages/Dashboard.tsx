import { lazy, Suspense, useEffect } from 'react';
import { useGetCallerUserProfile, useGetCallerRole, useGetTestConfigsWithStatus } from '../hooks/useQueries';
import { useViewActivation } from '../contexts/ViewActivationContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ShareButtons from '../components/ShareButtons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AppView } from '../App';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const SuggestionSection = lazy(() => import('../components/SuggestionSection'));

interface DashboardProps {
  onNavigate: (view: AppView) => void;
  onStartTest: (testId: bigint) => void;
}

export default function Dashboard({ onNavigate, onStartTest }: DashboardProps) {
  const { data: userProfile, isLoading: profileLoading, isFetching: profileFetching, isFetched: profileFetched } = useGetCallerUserProfile();
  const { data: userRole } = useGetCallerRole();
  const { data: testConfigsWithStatus, isLoading: testsLoading, isFetching: testsFetching, isError: testsError, isFetched: testsFetched } = useGetTestConfigsWithStatus();
  const { finishActivation } = useViewActivation();

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    const profileSettled = profileFetched || (!profileLoading && !profileFetching);
    const testsSettled = testsFetched || testsError || (!testsLoading && !testsFetching);
    
    if (profileSettled && testsSettled) {
      finishActivation();
    }
  }, [profileLoading, profileFetching, profileFetched, testsLoading, testsFetching, testsFetched, testsError, finishActivation]);

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

        <div className="mb-8">
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <SuggestionSection userName="User" />
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
