import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useBootstrappedCallerRole } from '../hooks/useBootstrappedCallerRole';
import { useViewActivation } from '../contexts/ViewActivationContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, User, LogOut, Home, Info, LayoutDashboard, Shield } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppView } from '../App';

interface HeaderProps {
  onNavigate: (view: AppView) => void;
  currentView: AppView;
}

export default function Header({ onNavigate, currentView }: HeaderProps) {
  const { identity, clear, loginStatus, login } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { isAdmin } = useBootstrappedCallerRole();
  const { cancelActivation } = useViewActivation();
  const queryClient = useQueryClient();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogout = async () => {
    cancelActivation('header-logout');
    await clear();
    queryClient.clear();
    onNavigate('landing');
  };

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message === 'User is already authenticated') {
        await clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  const handleNavigation = (view: AppView) => {
    setIsSheetOpen(false);
    setTimeout(() => onNavigate(view), 50);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <img 
            src="/assets/generated/concept-delta-logo.dim_200x200.png" 
            alt="Concept Delta Logo" 
            className="h-8 w-8 sm:h-10 sm:w-10"
          />
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold text-foreground leading-tight">
              Concept Delta
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
              MHT-CET Mock Tests
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          <Button
            variant={currentView === 'landing' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onNavigate('landing')}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
          <Button
            variant={currentView === 'about' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onNavigate('about')}
            className="gap-2"
          >
            <Info className="h-4 w-4" />
            About
          </Button>
          {isAuthenticated && (
            <Button
              variant={currentView === 'dashboard' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onNavigate('dashboard')}
              className="gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {userProfile?.fullName || 'User'}
                </span>
                {isAdmin && <Shield className="h-4 w-4 text-primary" />}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="hidden md:flex gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="hidden md:flex"
            >
              {isLoggingIn ? 'Logging in...' : 'Login'}
            </Button>
          )}

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <div className="flex flex-col gap-4 mt-8">
                {isAuthenticated && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary">
                    <User className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {userProfile?.fullName || 'User'}
                      </p>
                      {isAdmin && (
                        <p className="text-xs text-primary/80 flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Admin
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <nav className="flex flex-col gap-2">
                  <Button
                    variant={currentView === 'landing' ? 'default' : 'ghost'}
                    className="justify-start gap-3"
                    onClick={() => handleNavigation('landing')}
                  >
                    <Home className="h-5 w-5" />
                    Home
                  </Button>
                  <Button
                    variant={currentView === 'about' ? 'default' : 'ghost'}
                    className="justify-start gap-3"
                    onClick={() => handleNavigation('about')}
                  >
                    <Info className="h-5 w-5" />
                    About
                  </Button>
                  {isAuthenticated && (
                    <Button
                      variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                      className="justify-start gap-3"
                      onClick={() => handleNavigation('dashboard')}
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Dashboard
                    </Button>
                  )}
                </nav>

                <div className="mt-auto pt-4 border-t">
                  {isAuthenticated ? (
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-5 w-5" />
                      Logout
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={handleLogin}
                      disabled={isLoggingIn}
                    >
                      {isLoggingIn ? 'Logging in...' : 'Login'}
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
