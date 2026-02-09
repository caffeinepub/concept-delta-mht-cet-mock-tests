import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useBootstrappedCallerRole } from '../hooks/useBootstrappedCallerRole';
import { useViewActivation } from '../contexts/ViewActivationContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { AppView } from '../App';
import { Menu, User, LogOut, Info, LayoutDashboard } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface HeaderProps {
  onNavigate: (view: AppView) => void;
  currentView: AppView;
}

export default function Header({ onNavigate, currentView }: HeaderProps) {
  const { identity, clear } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { isAdmin } = useBootstrappedCallerRole();
  const { isActivatingView } = useViewActivation();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isAuthenticated = !!identity;
  const isDashboardActivating = isActivatingView('dashboard');

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    onNavigate('landing');
    setSheetOpen(false);
  };

  const handleNavigation = (view: AppView) => {
    // Close sheet first, then navigate after a brief delay to allow portal cleanup
    setSheetOpen(false);
    setTimeout(() => {
      onNavigate(view);
    }, 100);
  };

  const getDashboardLabel = () => {
    if (isDashboardActivating) return 'Loading...';
    return 'Dashboard';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => handleNavigation('landing')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-primary-foreground">Δ</span>
          </div>
          <span className="text-lg sm:text-xl font-bold text-foreground hidden xs:inline">
            Concept Delta
          </span>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => onNavigate('about')}
            className={currentView === 'about' ? 'bg-accent' : ''}
          >
            <Info className="w-4 h-4 mr-2" />
            About
          </Button>

          {isAuthenticated && userProfile && (
            <>
              <Button
                variant="ghost"
                onClick={() => onNavigate('dashboard')}
                disabled={isDashboardActivating}
                className={currentView === 'dashboard' ? 'bg-accent' : ''}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                {getDashboardLabel()}
              </Button>
            </>
          )}

          {isAuthenticated && userProfile && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {userProfile.fullName}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          )}
        </nav>

        {/* Mobile Menu */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="mobile-menu-sheet-content w-[280px] sm:w-[320px]">
            <div className="flex flex-col gap-4 mt-8">
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation('about')}
                  className={`justify-start ${currentView === 'about' ? 'bg-accent' : ''}`}
                >
                  <Info className="w-4 h-4 mr-2" />
                  About
                </Button>
              </SheetClose>

              {isAuthenticated && userProfile && (
                <>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      onClick={() => handleNavigation('dashboard')}
                      disabled={isDashboardActivating}
                      className={`justify-start ${currentView === 'dashboard' ? 'bg-accent' : ''}`}
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      {getDashboardLabel()}
                    </Button>
                  </SheetClose>

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md mb-3">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {userProfile.fullName}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="w-full justify-start"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
