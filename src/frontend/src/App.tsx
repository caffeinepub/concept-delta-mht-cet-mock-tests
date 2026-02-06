import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useBootstrappedCallerRole } from './hooks/useBootstrappedCallerRole';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import TestInterface from './pages/TestInterface';
import ResultPage from './pages/ResultPage';
import AdminPanel from './pages/AdminPanel';
import AboutPage from './pages/AboutPage';
import ProfileSetup from './components/ProfileSetup';
import ViewActivationOverlay from './components/ViewActivationOverlay';
import { useState, useEffect, useRef } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { ViewActivationProvider, useViewActivation } from './contexts/ViewActivationContext';
import { saveView, getLastView, getLastNonTestView, clearPersistedView } from './utils/viewPersistence';

export type AppView = 'landing' | 'dashboard' | 'test' | 'result' | 'admin' | 'about';

export interface TestState {
  testId: bigint;
  startTime: number;
  answers: (bigint | null)[];
  markedForReview: Set<number>;
}

function AppContent() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { isAdmin, isRoleKnown, roleLoading } = useBootstrappedCallerRole();
  const { startActivation, finishActivation } = useViewActivation();
  
  // Initialize view from persisted state or default to landing
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const lastView = getLastView();
    // Don't restore test/result views on refresh
    if (lastView && lastView !== 'test' && lastView !== 'result') {
      // If restoring admin view, verify role is known and admin
      if (lastView === 'admin') {
        // We'll validate this in useEffect after role loads
        return lastView;
      }
      return lastView;
    }
    // Try to restore last non-test view
    const lastNonTestView = getLastNonTestView();
    return lastNonTestView || 'landing';
  });
  
  const [currentTestState, setCurrentTestState] = useState<TestState | null>(null);
  const [lastTestAttemptId, setLastTestAttemptId] = useState<bigint | null>(null);
  const [pendingAdminNavigation, setPendingAdminNavigation] = useState(false);
  
  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;
  
  // Track if we've already auto-navigated after login
  const hasAutoNavigated = useRef(false);

  // Set SEO metadata
  useEffect(() => {
    document.title = 'Concept Delta - MHT-CET Mock Tests by COEPian Mentor';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Practice MHT-CET with real exam-level mock tests. Founded by COEP Technological University student. Get COEP background guidance and CET strategy for Maharashtra engineering entrance exam.');
    }

    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', 'MHT-CET, COEPian mentor, COEP background guidance, Maharashtra top engineering college experience, CET strategy by COEP student, MHT-CET mock tests, Physics Chemistry Mathematics');
    }
  }, []);

  // Validate restored admin view: if role resolves to non-admin, redirect to dashboard
  useEffect(() => {
    if (currentView === 'admin' && isRoleKnown && !isAdmin) {
      // User tried to restore admin view but is not admin
      setCurrentView('dashboard');
      saveView('dashboard');
      toast.error('Access Denied: Admin privileges required');
    }
  }, [currentView, isRoleKnown, isAdmin]);

  // Auto-navigate to Dashboard after successful login (if profile exists)
  useEffect(() => {
    if (isAuthenticated && !profileLoading && isFetched && userProfile && !hasAutoNavigated.current) {
      // Only auto-navigate if we're on landing page
      if (currentView === 'landing') {
        startActivation('dashboard');
        setCurrentView('dashboard');
        saveView('dashboard');
        hasAutoNavigated.current = true;
      }
    }
    
    // Reset auto-navigation flag when user logs out
    if (!isAuthenticated) {
      hasAutoNavigated.current = false;
      finishActivation();
    }
  }, [isAuthenticated, profileLoading, isFetched, userProfile, currentView, startActivation, finishActivation]);

  // Handle pending admin navigation once role resolves
  useEffect(() => {
    if (pendingAdminNavigation && isRoleKnown) {
      setPendingAdminNavigation(false);
      if (isAdmin) {
        setCurrentView('admin');
        saveView('admin');
        toast.success('Welcome to Admin Panel');
      } else {
        finishActivation();
        setCurrentView('dashboard');
        saveView('dashboard');
        toast.error('Access Denied: Admin privileges required');
      }
    }
  }, [pendingAdminNavigation, isRoleKnown, isAdmin, finishActivation]);

  // Persist view changes
  useEffect(() => {
    saveView(currentView);
  }, [currentView]);

  const handleStartTest = (testId: bigint) => {
    setCurrentTestState({
      testId,
      startTime: Date.now(),
      answers: [],
      markedForReview: new Set(),
    });
    setCurrentView('test');
  };

  const handleTestSubmit = (testId: bigint) => {
    setLastTestAttemptId(testId);
    setCurrentTestState(null);
    setCurrentView('result');
  };

  const handleNavigate = (view: AppView) => {
    // Check admin access when navigating to admin panel
    if (view === 'admin') {
      if (!isAuthenticated) {
        toast.error('Please login to access the Admin Panel');
        setCurrentView('landing');
        saveView('landing');
        return;
      }
      if (!isRoleKnown || roleLoading) {
        // Store pending navigation intent and show activation
        startActivation('admin');
        setPendingAdminNavigation(true);
        toast.info('Checking permissions...');
        return;
      }
      if (!isAdmin) {
        toast.error('Access Denied: Admin privileges required');
        setCurrentView('dashboard');
        saveView('dashboard');
        return;
      }
      // Admin access confirmed - start activation
      startActivation('admin');
    }

    // Dashboard navigation - start activation
    if (view === 'dashboard') {
      startActivation('dashboard');
    }

    setCurrentView(view);
    saveView(view);
  };

  if (showProfileSetup) {
    return (
      <>
        <ProfileSetup />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <ViewActivationOverlay />
      {currentView === 'landing' && (
        <LandingPage onNavigate={handleNavigate} />
      )}
      {currentView === 'about' && (
        <AboutPage onNavigate={handleNavigate} />
      )}
      {currentView === 'dashboard' && (
        <Dashboard onNavigate={handleNavigate} onStartTest={handleStartTest} />
      )}
      {currentView === 'test' && currentTestState && (
        <TestInterface
          testState={currentTestState}
          onTestSubmit={handleTestSubmit}
          onNavigate={handleNavigate}
        />
      )}
      {currentView === 'result' && (
        <ResultPage testId={lastTestAttemptId} onNavigate={handleNavigate} />
      )}
      {currentView === 'admin' && isAdmin && (
        <AdminPanel onNavigate={handleNavigate} />
      )}
      <Toaster />
    </>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ViewActivationProvider>
        <AppContent />
      </ViewActivationProvider>
    </ThemeProvider>
  );
}

export default App;
