import { lazy, Suspense, useEffect } from 'react';
import { useGetCallerUserProfile, useGetCallerRole, useGetTestConfigsWithStatus } from '../hooks/useQueries';
import { useViewActivation } from '../contexts/ViewActivationContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ShareButtons from '../components/ShareButtons';
import YouTubeSubscriptionGate from '../components/YouTubeSubscriptionGate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppView } from '../App';
import { BookOpen, Clock, CheckCircle2, Circle, PlayCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { TestType, TestStatus } from '../backend';

// Lazy load heavy components
const LeaderboardSection = lazy(() => import('../components/LeaderboardSection'));
const SuggestionSection = lazy(() => import('../components/SuggestionSection'));

interface DashboardProps {
  onNavigate: (view: AppView) => void;
  onStartTest: (testId: bigint) => void;
}

export default function Dashboard({ onNavigate, onStartTest }: DashboardProps) {
  const { data: userProfile, isLoading: profileLoading, refetch: refetchProfile, isFetching: profileFetching, isFetched: profileFetched } = useGetCallerUserProfile();
  const { data: userRole } = useGetCallerRole();
  const { data: testConfigsWithStatus, isLoading: testsLoading, isFetching: testsFetching, isError: testsError, error: testsErrorObj, refetch: refetchTests, isFetched: testsFetched } = useGetTestConfigsWithStatus();
  const { finishActivation } = useViewActivation();

  const isAdmin = userRole === 'admin';
  const isYouTubeVerified = userProfile?.isYouTubeVerified || false;

  // Signal view ready when queries settle (success OR error)
  useEffect(() => {
    const profileSettled = profileFetched || (!profileLoading && !profileFetching);
    const testsSettled = testsFetched || testsError || (!testsLoading && !testsFetching);
    
    if (profileSettled && testsSettled) {
      // Dashboard queries are settled - clear activation state
      finishActivation();
    }
  }, [profileLoading, profileFetching, profileFetched, testsLoading, testsFetching, testsFetched, testsError, finishActivation]);

  const handleVerified = () => {
    refetchProfile();
  };

  const getTestStatus = (testId: bigint): 'not-started' | 'completed' => {
    if (!userProfile?.testAttempts) return 'not-started';
    const attempted = userProfile.testAttempts.some(
      (attempt) => attempt.testId === testId
    );
    return attempted ? 'completed' : 'not-started';
  };

  // Filter tests by type and status
  const getTestsByTypeAndStatus = (testType: TestType, status: TestStatus) => {
    if (!testConfigsWithStatus) return [];
    return testConfigsWithStatus
      .filter(([test, testStatus]) => test.testType === testType && testStatus === status)
      .map(([test]) => test);
  };

  // Get tests by subject and class
  const getTestsBySubjectAndClass = (subject: string, classLevel: '11' | '12', status: TestStatus) => {
    if (!testConfigsWithStatus) return [];
    const testType: TestType = classLevel === '11' ? TestType.class11 : TestType.class12;
    return testConfigsWithStatus
      .filter(([test, testStatus]) => 
        test.subject === subject && 
        test.testType === testType && 
        testStatus === status
      )
      .map(([test]) => test);
  };

  const subjects = ['Physics', 'Chemistry', 'Mathematics'];
  const classLevels: Array<'11' | '12'> = ['11', '12'];

  // Show optimizing indicator
  const isOptimizing = (profileFetching && !profileLoading) || (testsFetching && !testsLoading);

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

  // Show error state if tests failed to load
  if (testsError && !testConfigsWithStatus) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onNavigate={onNavigate} currentView="dashboard" />
        <main className="flex-1 container py-6 sm:py-8 px-4 sm:px-6">
          <Card className="bg-card border-border">
            <CardContent className="p-8 sm:p-12 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mb-4" />
              <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-text-primary">
                Unable to Load Tests
              </h2>
              <p className="text-sm sm:text-base text-text-secondary mb-6 max-w-md">
                {testsErrorObj instanceof Error ? testsErrorObj.message : 'We encountered an error while loading the test configurations. Please try again.'}
              </p>
              <Button onClick={() => refetchTests()} className="gap-2">
                <Loader2 className="w-4 h-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Show YouTube subscription gate for non-admin users who haven't verified
  if (!isAdmin && !isYouTubeVerified) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onNavigate={onNavigate} currentView="dashboard" />
        <main className="flex-1 container py-6 sm:py-8 px-4 sm:px-6">
          {/* Branding Banner */}
          <div className="mb-6 sm:mb-8 flex justify-center">
            <img 
              src="/assets/photo_2026-01-08_11-34-29.jpg" 
              alt="Concept Delta - MHT CET Mock Tests Portal" 
              className="concept-delta-banner"
            />
          </div>

          <YouTubeSubscriptionGate onVerified={handleVerified} />
        </main>
        <Footer />
      </div>
    );
  }

  // Get live and finished tests for complete syllabus
  const liveCompleteSyllabusTests = getTestsByTypeAndStatus(TestType.completeSyllabus, TestStatus.live);
  const finishedCompleteSyllabusTests = getTestsByTypeAndStatus(TestType.completeSyllabus, TestStatus.finished);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onNavigate={onNavigate} currentView="dashboard" />
      
      <main className="flex-1 container py-6 sm:py-8 px-4 sm:px-6">
        {/* Optimizing Indicator */}
        {isOptimizing && (
          <div className="mb-4 flex items-center justify-center">
            <Badge variant="secondary" className="gap-2 py-2 px-4">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-xs">Optimizing data...</span>
            </Badge>
          </div>
        )}

        {/* Branding Banner */}
        <div className="mb-6 sm:mb-8 flex justify-center">
          <img 
            src="/assets/photo_2026-01-08_11-34-29.jpg" 
            alt="Concept Delta - MHT CET Mock Tests Portal" 
            className="concept-delta-banner"
          />
        </div>

        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-text-primary">
            Welcome back, {userProfile?.fullName}!
          </h1>
          <p className="text-sm sm:text-base text-text-secondary">
            Continue your MHT-CET preparation journey
          </p>
        </div>

        {/* Share Buttons */}
        <div className="mb-6 sm:mb-8">
          <ShareButtons />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs sm:text-sm text-text-secondary">Tests Completed</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl text-text-primary">
                {userProfile?.testAttempts?.length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs sm:text-sm text-text-secondary">Available Tests</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl text-text-primary">
                {testConfigsWithStatus?.filter(([_, status]) => status === TestStatus.live).length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="sm:col-span-2 lg:col-span-1 bg-card border-border">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs sm:text-sm text-text-secondary">Average Score</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl text-text-primary">
                {userProfile?.testAttempts && userProfile.testAttempts.length > 0
                  ? Math.round(
                      userProfile.testAttempts.reduce((sum, a) => sum + a.score, 0) /
                        userProfile.testAttempts.length
                    )
                  : 0}
                %
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Leaderboard Section - Lazy Loaded */}
        <div className="mb-6 sm:mb-8">
          <Suspense fallback={
            <Card className="bg-card border-border">
              <CardContent className="p-6 flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          }>
            <LeaderboardSection showOverall={true} />
          </Suspense>
        </div>

        {/* Complete Syllabus Mock Tests Section */}
        <Card className="bg-card border-border mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl text-text-primary">Complete Syllabus Mock Tests</CardTitle>
            <CardDescription className="text-xs sm:text-sm text-text-secondary">
              Full-length mock tests covering entire MHT-CET syllabus
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {liveCompleteSyllabusTests.length === 0 && finishedCompleteSyllabusTests.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-text-muted">
                <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm sm:text-base">No complete syllabus mock tests available yet</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4">
                {/* Live Complete Syllabus Tests */}
                {liveCompleteSyllabusTests.map((test) => {
                  const status = getTestStatus(test.id);
                  
                  return (
                    <Card key={test.id.toString()} className="hover:border-primary/50 transition-colors bg-card border-border">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col gap-3 sm:gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-start gap-2 flex-wrap">
                              <h3 className="font-semibold text-base sm:text-lg flex-1 min-w-0 text-text-primary">{test.name}</h3>
                              <div className="flex gap-2 flex-wrap">
                                <Badge variant="default" className="text-xs">
                                  Complete Syllabus
                                </Badge>
                                {status === 'completed' && (
                                  <Badge className="bg-status-completed text-status-completed-foreground border-status-completed text-xs">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Completed
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-text-secondary">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                {test.durationMinutes.toString()} mins
                              </span>
                              <span className="flex items-center gap-1">
                                <Circle className="w-3 h-3 sm:w-4 sm:h-4" />
                                {test.totalQuestions.toString()} questions
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={() => onStartTest(test.id)}
                            className="gap-2 w-full sm:w-auto h-10 sm:h-auto"
                            size="sm"
                          >
                            <PlayCircle className="w-4 h-4" />
                            {status === 'completed' ? 'Retake Test' : 'Start Test'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Finished Complete Syllabus Tests */}
                {finishedCompleteSyllabusTests.map((test) => {
                  const status = getTestStatus(test.id);
                  
                  return (
                    <Card key={test.id.toString()} className="bg-card border-border opacity-75">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col gap-3 sm:gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-start gap-2 flex-wrap">
                              <h3 className="font-semibold text-base sm:text-lg flex-1 min-w-0 text-text-primary">{test.name}</h3>
                              <div className="flex gap-2 flex-wrap">
                                <Badge variant="default" className="text-xs">
                                  Complete Syllabus
                                </Badge>
                                <Badge className="bg-[#DC2626] text-white text-xs">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Finished Test
                                </Badge>
                                {status === 'completed' && (
                                  <Badge className="bg-status-completed text-status-completed-foreground border-status-completed text-xs">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Completed
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-text-secondary">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                {test.durationMinutes.toString()} mins
                              </span>
                              <span className="flex items-center gap-1">
                                <Circle className="w-3 h-3 sm:w-4 sm:h-4" />
                                {test.totalQuestions.toString()} questions
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-text-muted">
                            <XCircle className="w-4 h-4 text-[#DC2626]" />
                            <span>This test has ended and is no longer available</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Class-wise Tests by Subject */}
        {classLevels.map((classLevel) => (
          <Card key={classLevel} className="bg-card border-border mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-text-primary">Class {classLevel} - Subject-wise Tests</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-text-secondary">
                Chapter-wise and topic-based tests for Class {classLevel}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <Tabs defaultValue="Physics" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-auto bg-muted">
                  {subjects.map((subject) => (
                    <TabsTrigger 
                      key={subject} 
                      value={subject}
                      className="text-xs sm:text-sm py-2"
                    >
                      {subject}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {subjects.map((subject) => {
                  const liveTests = getTestsBySubjectAndClass(subject, classLevel, TestStatus.live);
                  const finishedTests = getTestsBySubjectAndClass(subject, classLevel, TestStatus.finished);
                  const hasTests = liveTests.length > 0 || finishedTests.length > 0;

                  return (
                    <TabsContent key={subject} value={subject} className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
                      {!hasTests ? (
                        <div className="text-center py-8 sm:py-12 text-text-muted">
                          <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                          <p className="text-sm sm:text-base">No tests available for Class {classLevel} {subject} yet</p>
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:gap-4">
                          {/* Live Tests */}
                          {liveTests.map((test) => {
                            const status = getTestStatus(test.id);
                            
                            return (
                              <Card key={test.id.toString()} className="hover:border-primary/50 transition-colors bg-card border-border">
                                <CardContent className="p-4 sm:p-6">
                                  <div className="flex flex-col gap-3 sm:gap-4">
                                    <div className="space-y-2 flex-1">
                                      <div className="flex items-start gap-2 flex-wrap">
                                        <h3 className="font-semibold text-base sm:text-lg flex-1 min-w-0 text-text-primary">{test.name}</h3>
                                        <div className="flex gap-2 flex-wrap">
                                          <Badge variant="secondary" className="text-xs">
                                            Class {classLevel}
                                          </Badge>
                                          {status === 'completed' && (
                                            <Badge className="bg-status-completed text-status-completed-foreground border-status-completed text-xs">
                                              <CheckCircle2 className="w-3 h-3 mr-1" />
                                              Completed
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-text-secondary">
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                          {test.durationMinutes.toString()} mins
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Circle className="w-3 h-3 sm:w-4 sm:h-4" />
                                          {test.totalQuestions.toString()} questions
                                        </span>
                                      </div>
                                    </div>
                                    <Button
                                      onClick={() => onStartTest(test.id)}
                                      className="gap-2 w-full sm:w-auto h-10 sm:h-auto"
                                      size="sm"
                                    >
                                      <PlayCircle className="w-4 h-4" />
                                      {status === 'completed' ? 'Retake Test' : 'Start Test'}
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}

                          {/* Finished Tests */}
                          {finishedTests.map((test) => {
                            const status = getTestStatus(test.id);
                            
                            return (
                              <Card key={test.id.toString()} className="bg-card border-border opacity-75">
                                <CardContent className="p-4 sm:p-6">
                                  <div className="flex flex-col gap-3 sm:gap-4">
                                    <div className="space-y-2 flex-1">
                                      <div className="flex items-start gap-2 flex-wrap">
                                        <h3 className="font-semibold text-base sm:text-lg flex-1 min-w-0 text-text-primary">{test.name}</h3>
                                        <div className="flex gap-2 flex-wrap">
                                          <Badge variant="secondary" className="text-xs">
                                            Class {classLevel}
                                          </Badge>
                                          <Badge className="bg-[#DC2626] text-white text-xs">
                                            <XCircle className="w-3 h-3 mr-1" />
                                            Finished Test
                                          </Badge>
                                          {status === 'completed' && (
                                            <Badge className="bg-status-completed text-status-completed-foreground border-status-completed text-xs">
                                              <CheckCircle2 className="w-3 h-3 mr-1" />
                                              Completed
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-text-secondary">
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                          {test.durationMinutes.toString()} mins
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Circle className="w-3 h-3 sm:w-4 sm:h-4" />
                                          {test.totalQuestions.toString()} questions
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-text-muted">
                                      <XCircle className="w-4 h-4 text-[#DC2626]" />
                                      <span>This test has ended and is no longer available</span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>
        ))}

        {/* Suggestion Section - Lazy Loaded */}
        {userProfile && (
          <div className="mb-6 sm:mb-8">
            <Suspense fallback={
              <Card className="bg-card border-border">
                <CardContent className="p-6 flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </CardContent>
              </Card>
            }>
              <SuggestionSection userName={userProfile.fullName} />
            </Suspense>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
