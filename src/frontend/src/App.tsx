import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useBootstrappedCallerRole } from './hooks/useBootstrappedCallerRole';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AboutPage from './pages/AboutPage';
import ProfileSetup from './components/ProfileSetup';
import ViewActivationOverlay from './components/ViewActivationOverlay';
import { useState, useEffect, useRef } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { ViewActivationProvider, useViewActivation } from './contexts/ViewActivationContext';
import { saveView, getLastView, getLastNonTestView } from './utils/viewPersistence';

export type AppView = 'landing' | 'dashboard' | 'about';

function AppContent() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { isAdmin, isRoleKnown } = useBootstrappedCallerRole();
  const { startActivation, finishActivation } = useViewActivation();
  
  // Initialize view from persisted state or default to landing
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const lastView = getLastView();
    // Only restore valid views
    if (lastView === 'dashboard' || lastView === 'about') {
      return lastView;
    }
    const lastNonTestView = getLastNonTestView();
    if (lastNonTestView === 'dashboard' || lastNonTestView === 'about') {
      return lastNonTestView;
    }
    return 'landing';
  });
  
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
    
    // Reset auto-navigation flag and clear activation when user logs out
    if (!isAuthenticated) {
      hasAutoNavigated.current = false;
      finishActivation();
    }
  }, [isAuthenticated, profileLoading, isFetched, userProfile, currentView, startActivation, finishActivation]);

  // Persist view changes
  useEffect(() => {
    saveView(currentView);
  }, [currentView]);

  const handleNavigate = (view: AppView) => {
    // Dashboard navigation - start activation
    if (view === 'dashboard') {
      startActivation('dashboard');
    }

    // For About and Landing, finish any pending activation
    if (view === 'about' || view === 'landing') {
      finishActivation();
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
        <Dashboard onNavigate={handleNavigate} onStartTest={() => {}} />
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
