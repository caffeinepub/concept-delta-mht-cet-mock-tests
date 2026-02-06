import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useBootstrappedCallerRole } from '../hooks/useBootstrappedCallerRole';
import { useViewActivation } from '../contexts/ViewActivationContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AppView } from '../App';
import { Shield, Info, Menu, Home, LayoutDashboard, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { clearPersistedView } from '../utils/viewPersistence';
import { clearRoleForPrincipal } from '../utils/roleBootstrap';

interface HeaderProps {
  onNavigate: (view: AppView) => void;
  currentView?: AppView;
}

export default function Header({ onNavigate, currentView }: HeaderProps) {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { isAdmin, roleLoading } = useBootstrappedCallerRole();
  const { isActivatingView, activationState } = useViewActivation();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated = !!identity;
  const principalString = identity?.getPrincipal().toString() || '';

  const isDashboardActivating = isActivatingView('dashboard');
  const isAdminActivating = isActivatingView('admin');

  // Force close mobile menu when view activation starts
  useEffect(() => {
    if (activationState.isActivating && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [activationState.isActivating, mobileMenuOpen]);

  const handleAuth = async () => {
    if (isAuthenticated) {
      // Clear role bootstrap for this principal
      if (principalString) {
        clearRoleForPrincipal(principalString);
      }
      await clear();
      queryClient.clear();
      clearPersistedView();
      onNavigate('landing');
      toast.success('Logged out successfully');
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
    setMobileMenuOpen(false);
  };

  const handleNavigate = (view: AppView) => {
    // Close menu first, then navigate after a microtask to allow portal cleanup
    setMobileMenuOpen(false);
    requestAnimationFrame(() => {
      onNavigate(view);
    });
  };

  // Show navigation controls if authenticated
  const showAuthenticatedNav = isAuthenticated;

  // Only show Admin Panel button when admin is confirmed (not during loading)
  const showAdminButton = isAdmin && !roleLoading;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 sm:h-16 md:h-18 items-center justify-between px-4 sm:px-6">
        <button
          onClick={() => handleNavigate('landing')}
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity touch-target"
          aria-label="Go to home page"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary-foreground">Δ</span>
          </div>
          <span className="font-bold text-base sm:text-lg md:text-xl hidden xs:inline text-text-primary">Concept Delta</span>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-3">
          {currentView !== 'about' && (
            <Button
              variant="ghost"
              onClick={() => handleNavigate('about')}
              size="sm"
              className="gap-2 h-10 lg:h-11 min-w-[100px]"
            >
              <Info className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="hidden lg:inline">About</span>
            </Button>
          )}
          {showAuthenticatedNav && (
            <>
              {currentView !== 'dashboard' && (
                <Button
                  variant="ghost"
                  onClick={() => handleNavigate('dashboard')}
                  size="sm"
                  className="gap-2 h-10 lg:h-11 min-w-[120px]"
                  disabled={profileLoading || isDashboardActivating}
                >
                  {isDashboardActivating ? (
                    <>
                      <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <LayoutDashboard className="w-4 h-4 lg:w-5 lg:h-5" />
                      <span>{profileLoading ? 'Loading...' : 'Dashboard'}</span>
                    </>
                  )}
                </Button>
              )}
              {showAdminButton && currentView !== 'admin' && (
                <Button
                  variant="ghost"
                  onClick={() => handleNavigate('admin')}
                  size="sm"
                  className="gap-2 h-10 lg:h-11 min-w-[140px]"
                  disabled={isAdminActivating}
                >
                  {isAdminActivating ? (
                    <>
                      <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 lg:w-5 lg:h-5" />
                      <span>Admin Panel</span>
                    </>
                  )}
                </Button>
              )}
              {userProfile && (
                <div className="flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full bg-secondary text-secondary-foreground text-sm lg:text-base">
                  <span className="font-medium truncate max-w-[120px] lg:max-w-[150px]">{userProfile.fullName}</span>
                  {isAdmin && (
                    <Badge variant="default" className="text-xs px-2 py-0.5 bg-primary/90 hover:bg-primary">
                      Admin
                    </Badge>
                  )}
                </div>
              )}
            </>
          )}
          <Button
            onClick={handleAuth}
            disabled={isLoggingIn}
            variant={isAuthenticated ? 'outline' : 'default'}
            size="sm"
            className="h-10 lg:h-11 px-4 lg:px-6 min-w-[90px]"
          >
            {isLoggingIn ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login'}
          </Button>
        </nav>

        {/* Mobile & Tablet Navigation */}
        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated && userProfile && (
            <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs sm:text-sm">
              <span className="font-medium truncate max-w-[70px] sm:max-w-[100px]">{userProfile.fullName}</span>
              {isAdmin && (
                <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-primary/90">
                  Admin
                </Badge>
              )}
            </div>
          )}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2 sm:px-3 h-10 sm:h-11 touch-target">
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-[280px] sm:w-[340px] mobile-menu-sheet-content bg-background text-foreground border-border"
            >
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-lg sm:text-xl font-bold text-primary-foreground">Δ</span>
                  </div>
                  Concept Delta
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => handleNavigate('landing')}
                  className="justify-start gap-2 h-12 sm:h-14 text-base touch-target"
                >
                  <Home className="w-5 h-5" />
                  Home
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleNavigate('about')}
                  className="justify-start gap-2 h-12 sm:h-14 text-base touch-target"
                >
                  <Info className="w-5 h-5" />
                  About
                </Button>
                {showAuthenticatedNav && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => handleNavigate('dashboard')}
                      className="justify-start gap-2 h-12 sm:h-14 text-base touch-target"
                      disabled={profileLoading || isDashboardActivating}
                    >
                      {isDashboardActivating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Loading Dashboard...
                        </>
                      ) : (
                        <>
                          <LayoutDashboard className="w-5 h-5" />
                          {profileLoading ? 'Loading...' : 'Dashboard'}
                        </>
                      )}
                    </Button>
                    {showAdminButton && (
                      <Button
                        variant="ghost"
                        onClick={() => handleNavigate('admin')}
                        className="justify-start gap-2 h-12 sm:h-14 text-base touch-target"
                        disabled={isAdminActivating}
                      >
                        {isAdminActivating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Loading Admin...
                          </>
                        ) : (
                          <>
                            <Shield className="w-5 h-5" />
                            Admin Panel
                          </>
                        )}
                        {!isAdminActivating && (
                          <Badge variant="default" className="ml-auto text-xs px-2 py-0.5 bg-primary/90">
                            Admin Access
                          </Badge>
                        )}
                      </Button>
                    )}
                  </>
                )}
                <div className="border-t pt-3 mt-3">
                  <Button
                    onClick={handleAuth}
                    disabled={isLoggingIn}
                    variant={isAuthenticated ? 'outline' : 'default'}
                    className="w-full h-12 sm:h-14 text-base touch-target"
                  >
                    {isLoggingIn ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login'}
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
