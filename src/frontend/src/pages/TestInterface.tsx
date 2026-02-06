import { useState, useEffect, useCallback, useRef } from 'react';
import { useGetQuestionsByTestConfig, useSubmitTestAttempt, useGetCallerUserProfile, useStartTestSession, useUpdateSessionActivity, useUpdateCallerMobileNumber } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AppView, TestState } from '../App';
import { Clock, Flag, ChevronLeft, ChevronRight, Send, Menu, Moon, Sun, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SiTelegram } from 'react-icons/si';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useTheme } from 'next-themes';
import MathContent from '../components/MathContent';
import type { SanitizedQuestion, TestConfig, SectionType } from '../backend';

// Sentinel value for unanswered questions (using max safe integer)
const UNANSWERED_SENTINEL = BigInt(999999);

interface TestInterfaceProps {
  testState: TestState;
  onTestSubmit: (testId: bigint) => void;
  onNavigate: (view: AppView) => void;
}

export default function TestInterface({ testState, onTestSubmit, onNavigate }: TestInterfaceProps) {
  const { data: testData, isLoading: testDataLoading, error: testDataError, refetch: refetchTestData } = useGetQuestionsByTestConfig(testState.testId);
  const { data: userProfile } = useGetCallerUserProfile();
  const { theme, setTheme } = useTheme();
  const startSession = useStartTestSession();
  const updateActivity = useUpdateSessionActivity();
  const updateMobileNumber = useUpdateCallerMobileNumber();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(bigint | null)[]>([]);
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showMobileDialog, setShowMobileDialog] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [showTelegramDialog, setShowTelegramDialog] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [questionImageUrl, setQuestionImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const submitAttempt = useSubmitTestAttempt();
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const testConfig = testData?.testConfig;
  const questions = testData?.questions;
  const currentQuestion = questions?.[currentQuestionIndex];

  // Throttled session activity update
  const updateSessionActivityThrottled = useCallback(() => {
    const now = Date.now();
    // Only update if 10 seconds have passed since last update
    if (now - lastActivityRef.current > 10000) {
      lastActivityRef.current = now;
      if (testState.testId && sessionInitialized) {
        updateActivity.mutate(testState.testId, {
          onError: (error) => {
            // Silently fail - don't interrupt test flow
            console.error('Failed to update session activity:', error);
          }
        });
      }
    }
  }, [testState.testId, sessionInitialized, updateActivity]);

  // Initialize test session
  useEffect(() => {
    const initSession = async () => {
      if (!sessionInitialized && testState.testId && !sessionError) {
        try {
          await startSession.mutateAsync(testState.testId);
          setSessionInitialized(true);
          setSessionError(null);
        } catch (error: any) {
          console.error('Failed to start test session:', error);
          const errorMessage = error.message || 'Failed to initialize test session';
          setSessionError(errorMessage);
          
          // Show specific error messages
          if (errorMessage.includes('not currently live')) {
            toast.error('This test is not currently available. Please check the test schedule.');
          } else if (errorMessage.includes('stopped')) {
            toast.error('This test has been stopped and is no longer available.');
          } else if (errorMessage.includes('not published')) {
            toast.error('This test is not published yet.');
          } else if (errorMessage.includes('blocked')) {
            toast.error('Your account has been blocked. Please contact support.');
          } else {
            toast.error('Failed to start test session. Please try again.');
          }
        }
      }
    };

    initSession();
  }, [testState.testId, sessionInitialized, sessionError]);

  // Initialize test data
  useEffect(() => {
    if (testConfig && questions && sessionInitialized) {
      const duration = Number(testConfig.durationMinutes) * 60;
      setTimeRemaining(duration);
      setAnswers(new Array(questions.length).fill(null));
      
      // Check if user has mobile number
      if (!userProfile?.mobileNumber) {
        setShowMobileDialog(true);
      }
    }
  }, [testConfig, questions, userProfile, sessionInitialized]);

  // Load question image
  useEffect(() => {
    const loadImage = async () => {
      if (currentQuestion?.image) {
        setImageLoading(true);
        try {
          const url = currentQuestion.image.getDirectURL();
          setQuestionImageUrl(url);
        } catch (error) {
          console.error('Failed to load question image:', error);
          setQuestionImageUrl(null);
        } finally {
          setImageLoading(false);
        }
      } else {
        setQuestionImageUrl(null);
      }
    };

    loadImage();
  }, [currentQuestion]);

  // Timer
  useEffect(() => {
    if (!sessionInitialized || timeRemaining <= 0) {
      if (timeRemaining === 0 && sessionInitialized) {
        handleSubmit();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, sessionInitialized]);

  // Periodic activity update
  useEffect(() => {
    if (sessionInitialized && testState.testId) {
      // Update activity every 30 seconds
      activityTimerRef.current = setInterval(() => {
        updateSessionActivityThrottled();
      }, 30000);

      return () => {
        if (activityTimerRef.current) {
          clearInterval(activityTimerRef.current);
        }
      };
    }
  }, [sessionInitialized, testState.testId, updateSessionActivityThrottled]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColorClass = () => {
    const totalTime = Number(testConfig?.durationMinutes || 0) * 60;
    const percentRemaining = (timeRemaining / totalTime) * 100;
    
    if (percentRemaining > 50) return 'timer-normal';
    if (percentRemaining > 20) return 'timer-warning';
    return 'timer-critical';
  };

  const getSectionLabel = () => {
    if (!testConfig?.sectionType) return null;
    
    switch (testConfig.sectionType) {
      case 'physicsChemistry':
        return 'Section 1 – Physics & Chemistry (90 min)';
      case 'mathematics':
        return 'Section 2 – Mathematics (90 min)';
      default:
        return null;
    }
  };

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = BigInt(value);
    setAnswers(newAnswers);
    
    // Update session activity on answer selection
    updateSessionActivityThrottled();
  };

  const handleMarkForReview = () => {
    const newMarked = new Set(markedForReview);
    if (newMarked.has(currentQuestionIndex)) {
      newMarked.delete(currentQuestionIndex);
    } else {
      newMarked.add(currentQuestionIndex);
    }
    setMarkedForReview(newMarked);
    
    // Update session activity on mark for review
    updateSessionActivityThrottled();
  };

  const handleNext = () => {
    if (currentQuestionIndex < (questions?.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      // Update session activity on navigation
      updateSessionActivityThrottled();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      // Update session activity on navigation
      updateSessionActivityThrottled();
    }
  };

  const handleSubmit = async () => {
    if (!testConfig || !userProfile || !questions) return;

    try {
      // Map null answers to UNANSWERED_SENTINEL
      const submissionAnswers = answers.map((a) => a === null ? UNANSWERED_SENTINEL : a);
      
      await submitAttempt.mutateAsync({
        testId: testState.testId,
        answers: submissionAnswers,
      });

      setShowTelegramDialog(true);
      
      setTimeout(() => {
        onTestSubmit(testState.testId);
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit test');
    }
  };

  const handleMobileSubmit = async () => {
    if (!mobileNumber || mobileNumber.trim().length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      await updateMobileNumber.mutateAsync(mobileNumber.trim());
      setShowMobileDialog(false);
      toast.success('Mobile number saved successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save mobile number');
    }
  };

  const handleQuestionSelect = (index: number) => {
    setCurrentQuestionIndex(index);
    setShowPalette(false);
    // Update session activity on palette jump
    updateSessionActivityThrottled();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleRetry = () => {
    setSessionError(null);
    setSessionInitialized(false);
    refetchTestData();
  };

  // Session error state
  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">Cannot Start Test</h2>
              <p className="text-sm text-text-secondary">{sessionError}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleRetry} variant="default">
                Retry
              </Button>
              <Button onClick={() => onNavigate('dashboard')} variant="outline">
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (testDataLoading || !sessionInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-text-muted text-sm sm:text-base">
            {!sessionInitialized ? 'Initializing test session...' : 'Loading test questions...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state with retry
  if (testDataError || !testConfig || !questions || questions.length === 0 || !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">Failed to Load Test</h2>
              <p className="text-sm text-text-secondary">
                {testDataError ? 'An error occurred while loading the test questions.' : 'No questions found for this test.'}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleRetry} variant="default">
                Retry
              </Button>
              <Button onClick={() => onNavigate('dashboard')} variant="outline">
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const answeredCount = answers.filter((a) => a !== null).length;
  const reviewCount = markedForReview.size;
  const sectionLabel = getSectionLabel();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Fixed Header with Branding Banner */}
      <div className="sticky top-0 z-50 bg-background border-b shadow-sm">
        <div className="container py-2 sm:py-3 px-4 sm:px-6">
          <div className="flex items-center justify-center mb-2">
            <img 
              src="/assets/photo_2026-01-08_11-34-29.jpg" 
              alt="Concept Delta" 
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </div>
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-sm sm:text-base md:text-lg truncate text-text-primary">{testConfig.name}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs sm:text-sm text-text-secondary">{testConfig.subject}</p>
                {sectionLabel && (
                  <Badge variant="outline" className="text-xs">
                    {sectionLabel}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <Button
                onClick={toggleTheme}
                variant="outline"
                size="sm"
                className="h-8 sm:h-10 px-2 sm:px-3"
                title="Toggle Exam Safe Dark Mode"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg ${getTimerColorClass()}`}>
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-mono font-semibold text-sm sm:text-base md:text-lg">
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <Button
                onClick={() => setShowSubmitDialog(true)}
                variant="default"
                size="sm"
                className="gap-1 sm:gap-2 h-8 sm:h-10 px-3 sm:px-4"
              >
                <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Submit</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4 sm:py-6 px-4 sm:px-6">
        <div className="grid lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_320px] gap-4 sm:gap-6">
          {/* Question Area */}
          <div className="space-y-4 sm:space-y-6">
            <Card className="bg-card border-border">
              <CardContent className="p-4 sm:p-6">
                <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs sm:text-sm">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </Badge>
                  <Badge 
                    variant={currentQuestion.difficulty === 'easy' ? 'secondary' : currentQuestion.difficulty === 'medium' ? 'default' : 'destructive'} 
                    className="text-xs sm:text-sm"
                  >
                    {currentQuestion.difficulty}
                  </Badge>
                </div>

                <div className="prose prose-sm sm:prose-base max-w-none mb-6 dark:prose-invert">
                  <MathContent 
                    content={currentQuestion.questionText} 
                    className="text-base sm:text-lg font-medium leading-relaxed"
                  />
                </div>

                {/* Question Image Display */}
                {questionImageUrl && (
                  <div className="mb-6 rounded-lg border border-border bg-muted/30 p-3 sm:p-4">
                    {imageLoading ? (
                      <div className="flex items-center justify-center h-48 sm:h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                      </div>
                    ) : (
                      <img
                        src={questionImageUrl}
                        alt="Question diagram"
                        className="w-full h-auto max-h-[300px] sm:max-h-[400px] object-contain rounded"
                        loading="lazy"
                      />
                    )}
                  </div>
                )}

                <RadioGroup
                  value={answers[currentQuestionIndex]?.toString() || ''}
                  onValueChange={handleAnswerChange}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-3 sm:p-4 rounded-lg border border-border hover:bg-accent transition-colors cursor-pointer"
                    >
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} className="mt-0.5 flex-shrink-0" />
                      <Label
                        htmlFor={`option-${index}`}
                        className="flex-1 cursor-pointer font-normal text-sm sm:text-base leading-relaxed"
                      >
                        <div className="space-y-2">
                          <MathContent 
                            content={option.text} 
                            inline
                          />
                          {option.image && (
                            <div className="rounded border border-border bg-muted/30 p-2">
                              <img
                                src={option.image.getDirectURL()}
                                alt={`Option ${index + 1} image`}
                                className="w-full h-auto max-h-32 object-contain rounded"
                                loading="lazy"
                              />
                            </div>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Navigation - Fixed on mobile */}
            <div className="sticky bottom-0 left-0 right-0 bg-background border-t lg:border-0 lg:static p-3 sm:p-0 -mx-4 sm:mx-0">
              <div className="flex items-center justify-between gap-2">
                <Button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  variant="outline"
                  size="sm"
                  className="gap-1 sm:gap-2 flex-1 sm:flex-initial h-10 sm:h-auto"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden xs:inline">Previous</span>
                </Button>

                <Button
                  onClick={handleMarkForReview}
                  variant={markedForReview.has(currentQuestionIndex) ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1 sm:gap-2 flex-1 sm:flex-initial h-10 sm:h-auto"
                >
                  <Flag className="w-4 h-4" />
                  <span className="hidden sm:inline">{markedForReview.has(currentQuestionIndex) ? 'Marked' : 'Mark'}</span>
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={currentQuestionIndex === questions.length - 1}
                  size="sm"
                  className="gap-1 sm:gap-2 flex-1 sm:flex-initial h-10 sm:h-auto"
                >
                  <span className="hidden xs:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>

                {/* Mobile Palette Toggle */}
                <Sheet open={showPalette} onOpenChange={setShowPalette}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden h-10 px-3">
                      <Menu className="w-4 h-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[280px] sm:w-[320px] overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Question Palette</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <QuestionPalette
                        testConfig={testConfig}
                        questions={questions}
                        answers={answers}
                        markedForReview={markedForReview}
                        currentQuestionIndex={currentQuestionIndex}
                        answeredCount={answeredCount}
                        reviewCount={reviewCount}
                        onQuestionSelect={handleQuestionSelect}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>

          {/* Desktop Question Palette */}
          <div className="hidden lg:block lg:sticky lg:top-24 h-fit">
            <Card className="bg-card border-border">
              <CardContent className="p-4 sm:p-6">
                <QuestionPalette
                  testConfig={testConfig}
                  questions={questions}
                  answers={answers}
                  markedForReview={markedForReview}
                  currentQuestionIndex={currentQuestionIndex}
                  answeredCount={answeredCount}
                  reviewCount={reviewCount}
                  onQuestionSelect={setCurrentQuestionIndex}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Submit Test?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">
              You have answered {answeredCount} out of {questions.length} questions.
              {reviewCount > 0 && ` ${reviewCount} questions are marked for review.`}
              <br /><br />
              Are you sure you want to submit the test? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={submitAttempt.isPending} className="w-full sm:w-auto">
              {submitAttempt.isPending ? 'Submitting...' : 'Submit Test'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mobile Number Dialog */}
      <Dialog open={showMobileDialog} onOpenChange={setShowMobileDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Enter Your Mobile Number</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              We need your mobile number to send you test updates and results.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="tel"
              placeholder="10-digit mobile number"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
              maxLength={10}
              className="h-12"
            />
            <Button 
              onClick={handleMobileSubmit} 
              disabled={updateMobileNumber.isPending}
              className="w-full h-12"
            >
              {updateMobileNumber.isPending ? 'Saving...' : 'Continue'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Telegram Join Dialog */}
      <Dialog open={showTelegramDialog} onOpenChange={setShowTelegramDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Test Submitted Successfully! 🎉</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Join our Telegram channel for test explanation PDFs, daily practice questions, tips, and updates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button asChild className="w-full gap-2 h-12" size="lg">
              <a href="https://t.me/conceptdelta" target="_blank" rel="noopener noreferrer">
                <SiTelegram className="w-5 h-5" />
                Join Concept Delta Telegram
              </a>
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowTelegramDialog(false)}
              className="w-full h-12"
            >
              Skip for Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Question Palette Component
interface QuestionPaletteProps {
  testConfig: TestConfig;
  questions: SanitizedQuestion[];
  answers: (bigint | null)[];
  markedForReview: Set<number>;
  currentQuestionIndex: number;
  answeredCount: number;
  reviewCount: number;
  onQuestionSelect: (index: number) => void;
}

function QuestionPalette({
  testConfig,
  questions,
  answers,
  markedForReview,
  currentQuestionIndex,
  answeredCount,
  reviewCount,
  onQuestionSelect,
}: QuestionPaletteProps) {
  return (
    <>
      <h3 className="font-semibold mb-4 text-sm sm:text-base text-text-primary">Question Palette</h3>
      
      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded status-completed flex items-center justify-center font-medium text-xs sm:text-sm">
            {answeredCount}
          </div>
          <span className="text-text-secondary">Answered</span>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded status-marked-review flex items-center justify-center font-medium text-xs sm:text-sm">
            {reviewCount}
          </div>
          <span className="text-text-secondary">Marked for Review</span>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded status-not-started flex items-center justify-center font-medium text-xs sm:text-sm">
            {questions.length - answeredCount}
          </div>
          <span className="text-text-secondary">Not Answered</span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {questions.map((_, index) => {
          const isAnswered = answers[index] !== null;
          const isMarked = markedForReview.has(index);
          const isCurrent = index === currentQuestionIndex;

          let statusClass = 'status-not-started';
          if (isMarked) {
            statusClass = 'status-marked-review';
          } else if (isAnswered) {
            statusClass = 'status-completed';
          }

          return (
            <button
              key={index}
              onClick={() => onQuestionSelect(index)}
              className={`
                w-full aspect-square rounded flex items-center justify-center font-medium text-xs sm:text-sm
                transition-all touch-manipulation ${statusClass}
                ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}
                ${!isAnswered && !isMarked ? 'hover:bg-accent active:bg-accent' : ''}
              `}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </>
  );
}
