import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useBootstrappedCallerRole } from './hooks/useBootstrappedCallerRole';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AboutPage from './pages/AboutPage';
import AdminPanel from './pages/AdminPanel';
import ProfileSetup from './components/ProfileSetup';
import ViewActivationOverlay from './components/ViewActivationOverlay';
import AppErrorBoundary from './components/AppErrorBoundary';
import { useState, useEffect, useRef } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { ViewActivationProvider, useViewActivation } from './contexts/ViewActivationContext';
import { saveView, getLastView, getLastNonTestView } from './utils/viewPersistence';

export type AppView = 'landing' | 'dashboard' | 'about' | 'admin';

function AppContent() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { isAdmin, isRoleKnown } = useBootstrappedCallerRole();
  const { startActivation, finishActivation, cancelActivation } = useViewActivation();
  
  const isAuthenticated = !!identity;
  
  // Initialize view with safe restoration logic
  const [currentView, setCurrentView] = useState<AppView>(() => {
    // Always start with landing for fresh loads
    const lastView = getLastView();
    
    // Only restore About immediately (it's always accessible)
    if (lastView === 'about') {
      return 'about';
    }
    
    // For dashboard, admin, or any other view, default to landing
    // We'll handle restoration after auth check
    return 'landing';
  });
  
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;
  
  // Track if we've already auto-navigated after login
  const hasAutoNavigated = useRef(false);
  const isInitialMount = useRef(true);

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

  // Handle initial view restoration for dashboard/admin (only after auth is confirmed)
  useEffect(() => {
    if (isInitialMount.current && isAuthenticated && !profileLoading && isFetched && userProfile) {
      const lastView = getLastView();
      const lastNonTestView = getLastNonTestView();
      
      // Restore dashboard if it was the last view
      if (lastView === 'dashboard' || lastNonTestView === 'dashboard') {
        startActivation('dashboard', 'landing');
        setCurrentView('dashboard');
        saveView('dashboard');
        hasAutoNavigated.current = true;
      }
      // Restore admin panel if it was the last view and user is admin
      else if ((lastView === 'admin' || lastNonTestView === 'admin') && isAdmin) {
        startActivation('admin', 'landing');
        setCurrentView('admin');
        saveView('admin');
        hasAutoNavigated.current = true;
      }
      
      isInitialMount.current = false;
    }
  }, [isAuthenticated, profileLoading, isFetched, userProfile, isAdmin, startActivation]);

  // Auto-navigate to Dashboard after successful login (if profile exists and not already navigated)
  useEffect(() => {
    if (isAuthenticated && !profileLoading && isFetched && userProfile && !hasAutoNavigated.current && !isInitialMount.current) {
      // Only auto-navigate if we're on landing page
      if (currentView === 'landing') {
        startActivation('dashboard', currentView);
        setCurrentView('dashboard');
        saveView('dashboard');
        hasAutoNavigated.current = true;
      }
    }
    
    // Reset auto-navigation flag and clear activation when user logs out
    if (!isAuthenticated) {
      hasAutoNavigated.current = false;
      isInitialMount.current = false;
      cancelActivation(currentView);
    }
  }, [isAuthenticated, profileLoading, isFetched, userProfile, currentView, startActivation, cancelActivation]);

  // Cancel activation when navigating away from the target view
  useEffect(() => {
    if (currentView !== 'dashboard' && currentView !== 'admin') {
      cancelActivation(currentView);
    }
  }, [currentView, cancelActivation]);

  // Persist view changes
  useEffect(() => {
    saveView(currentView);
  }, [currentView]);

  const handleNavigate = (view: AppView) => {
    // Dashboard or Admin navigation - start activation
    if (view === 'dashboard' || view === 'admin') {
      startActivation(view, currentView);
    } else {
      // For About and Landing, cancel any pending activation immediately
      cancelActivation(currentView);
    }

    setCurrentView(view);
    saveView(view);
  };

  const handleNavigateToLanding = () => {
    cancelActivation(currentView);
    setCurrentView('landing');
    saveView('landing');
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
    <AppErrorBoundary onNavigateHome={handleNavigateToLanding}>
      <ViewActivationOverlay currentView={currentView} />
      {currentView === 'landing' && (
        <LandingPage onNavigate={handleNavigate} />
      )}
      {currentView === 'about' && (
        <AboutPage onNavigate={handleNavigate} />
      )}
      {currentView === 'dashboard' && (
        <Dashboard onNavigate={handleNavigate} onStartTest={() => {}} />
      )}
      {currentView === 'admin' && (
        <AdminPanel onNavigate={handleNavigate} />
      )}
      <Toaster />
    </AppErrorBoundary>
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
