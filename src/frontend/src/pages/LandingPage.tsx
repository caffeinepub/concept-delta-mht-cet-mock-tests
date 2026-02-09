import { useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useViewActivation } from '../contexts/ViewActivationContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ShareButtons from '../components/ShareButtons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppView } from '../App';
import { BookOpen, Clock, Target, TrendingUp, GraduationCap, FileText } from 'lucide-react';
import { SiTelegram, SiYoutube } from 'react-icons/si';

interface LandingPageProps {
  onNavigate: (view: AppView) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { finishActivation } = useViewActivation();

  const isAuthenticated = !!identity;

  // Signal view ready on mount
  useEffect(() => {
    finishActivation();
  }, [finishActivation]);

  const handleStartTest = async () => {
    if (!isAuthenticated) {
      await login();
    } else if (userProfile) {
      onNavigate('dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onNavigate={onNavigate} currentView="landing" />
      
      <main className="flex-1">
        {/* Hero Section with Integrated Banner */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground">
          <div className="absolute inset-0 bg-[url('/assets/generated/hero-banner.dim_800x400.png')] bg-cover bg-center opacity-10" />
          <div className="container relative py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto text-center space-y-5 sm:space-y-6 md:space-y-7">
              {/* Integrated Branding Banner */}
              <div className="mb-4 sm:mb-5 md:mb-7 flex justify-center">
                <img 
                  src="/assets/photo_2026-01-08_11-34-29.jpg" 
                  alt="Concept Delta - MHT CET Mock Tests" 
                  className="concept-delta-banner"
                />
              </div>
              
              <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight px-2 sm:px-4">
                Practice MHT-CET with Real Exam-Level Mock Tests
              </h1>
              <div className="space-y-2 px-2 sm:px-4">
                <p className="text-base xs:text-lg sm:text-xl md:text-2xl font-semibold text-primary-foreground/95 leading-relaxed">
                  Founded by COEP Technological University student
                </p>
                <p className="text-xs xs:text-sm sm:text-base text-primary-foreground/80 leading-relaxed">
                  One of Maharashtra's top engineering institutions
                </p>
              </div>
              <p className="text-sm xs:text-base sm:text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto px-2 sm:px-4 leading-relaxed">
                Master Physics, Chemistry, and Mathematics with our comprehensive mock tests designed specifically for Maharashtra CET aspirants.
              </p>

              {/* YouTube Subscription Section */}
              <div className="pt-4 sm:pt-5 md:pt-6 px-3 sm:px-4 md:px-6">
                <Card className="bg-[#FF0000]/10 border-[#FF0000]/30 backdrop-blur-sm">
                  <CardContent className="py-5 sm:py-6 px-4 sm:px-6 space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-[#FF0000] rounded-full flex items-center justify-center shadow-lg">
                        <SiYoutube className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-base sm:text-lg md:text-xl font-bold text-white leading-tight">
                          Subscribe to Unlock Tests
                        </h3>
                        <p className="text-xs sm:text-sm text-primary-foreground/80 leading-relaxed">
                          Subscribe to our YouTube channel to access all mock tests
                        </p>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      asChild
                      className="w-full bg-[#FF0000] hover:bg-[#CC0000] text-white font-bold text-sm sm:text-base h-12 sm:h-14 gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <a
                        href="https://youtube.com/@conceptdelta2026?si=IeGIsp6CvX05mNdh"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center"
                      >
                        <SiYoutube className="w-5 h-5" />
                        <span>Subscribe to Concept Delta</span>
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              {/* Primary CTA Button - Fully Optimized for Mobile */}
              <div className="pt-4 sm:pt-5 md:pt-6 px-3 sm:px-4 md:px-6">
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    onClick={handleStartTest}
                    disabled={isLoggingIn}
                    className="cta-primary-button"
                  >
                    <span className="cta-button-text">
                      {isLoggingIn ? 'Loading...' : 'Click here to start CET with COEPian Guidance'}
                    </span>
                  </Button>
                </div>
                {/* Helper text for mobile clarity */}
                <p className="mt-3 text-xs xs:text-sm text-primary-foreground/70 px-2 leading-relaxed">
                  {isAuthenticated ? 'Access your personalized dashboard' : 'Sign in to begin your preparation journey'}
                </p>
              </div>

              {/* Secondary CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-3 sm:pt-4 px-2 sm:px-4">
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="text-sm xs:text-base sm:text-lg px-5 xs:px-6 sm:px-8 h-12 xs:h-13 sm:h-14 w-full sm:w-auto bg-primary-foreground/10 hover:bg-primary-foreground/20 border-primary-foreground/30 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] min-h-[44px]"
                >
                  <a
                    href="https://t.me/conceptdelta"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <SiTelegram className="w-4 h-4 xs:w-5 xs:h-5 flex-shrink-0" />
                    <span className="leading-tight">Join Concept Delta Telegram</span>
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="text-sm xs:text-base sm:text-lg px-5 xs:px-6 sm:px-8 h-12 xs:h-13 sm:h-14 w-full sm:w-auto bg-primary-foreground/10 hover:bg-primary-foreground/20 border-primary-foreground/30 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] min-h-[44px]"
                >
                  <a
                    href="https://youtube.com/@conceptdelta2026?si=IeGIsp6CvX05mNdh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <SiYoutube className="w-4 h-4 xs:w-5 xs:h-5 flex-shrink-0 text-[#FF0000]" />
                    <span className="leading-tight">Watch on YouTube</span>
                  </a>
                </Button>
              </div>
              
              {/* Telegram Highlight */}
              <a
                href="https://t.me/conceptdelta"
                target="_blank"
                rel="noopener noreferrer"
                className="telegram-highlight-box group"
              >
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 text-[#001F3F]" />
                <span className="text-sm xs:text-base sm:text-lg font-extrabold tracking-tight text-[#001F3F] group-hover:underline decoration-2 underline-offset-4 transition-all duration-200 leading-tight text-center">
                  Join Telegram for Test Explanation PDF
                </span>
              </a>

              <div className="pt-3 sm:pt-4 md:pt-6 px-2 sm:px-4">
                <Badge variant="secondary" className="text-xs xs:text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-2.5 bg-primary-foreground/20 hover:bg-primary-foreground/30 border-primary-foreground/30 inline-flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="hidden xs:inline leading-tight">COEPian Mentor — Guidance by COEP Technological University background</span>
                  <span className="xs:hidden leading-tight">COEPian Mentor</span>
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Share Section */}
        <section className="py-8 sm:py-10 md:py-12 bg-muted/30">
          <div className="container px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
              <ShareButtons />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-10 sm:py-12 md:py-16 lg:py-20 bg-background">
          <div className="container px-4 sm:px-6">
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2 sm:px-4 text-foreground leading-tight">
                Why Choose Concept Delta?
              </h2>
              <p className="text-muted-foreground text-sm xs:text-base sm:text-lg max-w-2xl mx-auto px-2 sm:px-4 leading-relaxed">
                Comprehensive preparation tools designed for MHT-CET success with Maharashtra top engineering college experience
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
              <Card className="border-2 hover:border-primary/50 transition-colors bg-card">
                <CardContent className="pt-5 sm:pt-6 pb-5 sm:pb-6 px-4 text-center space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg text-foreground leading-tight">Real Exam Pattern</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Tests designed to match the actual MHT-CET exam format and difficulty level
                  </p>
                </CardContent>
              </Card>
              <Card className="border-2 hover:border-primary/50 transition-colors bg-card">
                <CardContent className="pt-5 sm:pt-6 pb-5 sm:pb-6 px-4 text-center space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg text-foreground leading-tight">Timed Practice</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Simulate real exam conditions with countdown timers and auto-submit
                  </p>
                </CardContent>
              </Card>
              <Card className="border-2 hover:border-primary/50 transition-colors bg-card">
                <CardContent className="pt-5 sm:pt-6 pb-5 sm:pb-6 px-4 text-center space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg text-foreground leading-tight">Detailed Analysis</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Get comprehensive performance insights and identify areas for improvement
                  </p>
                </CardContent>
              </Card>
              <Card className="border-2 hover:border-primary/50 transition-colors bg-card">
                <CardContent className="pt-5 sm:pt-6 pb-5 sm:pb-6 px-4 text-center space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg text-foreground leading-tight">Track Progress</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Monitor your improvement over time with detailed performance tracking
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
