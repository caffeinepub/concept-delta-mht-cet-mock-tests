import { useGetCallerUserProfile, useGetTestConfig } from '../hooks/useQueries';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppView } from '../App';
import { Trophy, Clock, Target, TrendingUp, Home } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { TestType } from '../backend';

interface ResultPageProps {
  testId: bigint | null;
  onNavigate: (view: AppView) => void;
}

export default function ResultPage({ testId, onNavigate }: ResultPageProps) {
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: testConfig, isLoading: testLoading } = useGetTestConfig(testId);

  const lastAttempt = userProfile?.testAttempts?.find((a) => a.testId === testId);

  if (profileLoading || testLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onNavigate={onNavigate} currentView="result" />
        <main className="flex-1 container py-6 sm:py-8 px-4 sm:px-6">
          <Skeleton className="h-64 sm:h-96 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!lastAttempt || !testConfig) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onNavigate={onNavigate} currentView="result" />
        <main className="flex-1 container py-6 sm:py-8 px-4 sm:px-6">
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <p className="text-text-muted text-sm sm:text-base">No test results found</p>
              <Button onClick={() => onNavigate('dashboard')} className="mt-4 h-10 sm:h-auto">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const scorePercentage = lastAttempt.score;
  const timeTakenMinutes = Math.floor(Number(lastAttempt.timeTaken) / 60);
  const timeTakenSeconds = Number(lastAttempt.timeTaken) % 60;
  
  // Estimate percentile based on score (simplified)
  const estimatedPercentile = Math.min(99, Math.round(scorePercentage * 0.95));

  const getTestTypeLabel = (testType: TestType): string => {
    switch (testType) {
      case 'class11':
        return 'Class 11';
      case 'class12':
        return 'Class 12';
      case 'completeSyllabus':
        return 'Complete Syllabus';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onNavigate={onNavigate} currentView="result" />
      
      <main className="flex-1 container py-6 sm:py-8 px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-success/10 rounded-full mb-3 sm:mb-4">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-success" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 px-4 text-text-primary">Test Completed!</h1>
          <p className="text-text-secondary text-base sm:text-lg px-4">{testConfig.name}</p>
        </div>

        {/* Score Card */}
        <Card className="mb-6 sm:mb-8 border-2 border-success/20 bg-card">
          <CardContent className="py-10 sm:py-12">
            <div className="text-center">
              <div className="text-5xl sm:text-6xl md:text-7xl font-bold text-success mb-2">
                {Math.round(scorePercentage)}%
              </div>
              <p className="text-lg sm:text-xl text-text-secondary">Your Score</p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-info/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-info" />
                </div>
                <div className="min-w-0">
                  <CardDescription className="text-xs sm:text-sm text-text-secondary">Time Taken</CardDescription>
                  <CardTitle className="text-xl sm:text-2xl text-text-primary">
                    {timeTakenMinutes}:{timeTakenSeconds.toString().padStart(2, '0')}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-info/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-info" />
                </div>
                <div className="min-w-0">
                  <CardDescription className="text-xs sm:text-sm text-text-secondary">Questions Attempted</CardDescription>
                  <CardTitle className="text-xl sm:text-2xl text-text-primary">
                    {lastAttempt.answers.filter((a) => a !== BigInt(0)).length} / {testConfig.totalQuestions.toString()}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1 bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <div className="min-w-0">
                  <CardDescription className="text-xs sm:text-sm text-text-secondary">Estimated Percentile</CardDescription>
                  <CardTitle className="text-xl sm:text-2xl text-text-primary">{estimatedPercentile}%</CardTitle>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Performance Analysis */}
        <Card className="mb-6 sm:mb-8 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl text-text-primary">Performance Analysis</CardTitle>
            <CardDescription className="text-xs sm:text-sm text-text-secondary">Your performance breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium text-text-primary">Overall Performance</span>
                  <span className="text-xs sm:text-sm text-text-secondary">{Math.round(scorePercentage)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 sm:h-3">
                  <div
                    className="bg-success rounded-full h-2.5 sm:h-3 transition-all"
                    style={{ width: `${scorePercentage}%` }}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 pt-4">
                <div className="p-3 sm:p-4 rounded-lg bg-muted/50">
                  <p className="text-xs sm:text-sm text-text-secondary mb-1">Subject</p>
                  <p className="font-semibold text-sm sm:text-base text-text-primary">{testConfig.subject}</p>
                </div>
                <div className="p-3 sm:p-4 rounded-lg bg-muted/50">
                  <p className="text-xs sm:text-sm text-text-secondary mb-1">Test Type</p>
                  <Badge variant="default" className="text-xs sm:text-sm">
                    {getTestTypeLabel(testConfig.testType)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button 
            onClick={() => onNavigate('dashboard')} 
            variant="outline" 
            className="gap-2 w-full sm:w-auto h-12 sm:h-auto"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            className="gap-2 w-full sm:w-auto h-12 sm:h-auto"
          >
            Take Another Test
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
