import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Download, CheckCircle2, Loader2 } from 'lucide-react';
import MathContent from './MathContent';
import type { Question } from '../backend';
import { toast } from 'sonner';
import { generateQuestionsPDF } from '../utils/questionPdfExport';

interface QuestionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: Question[];
  testName: string;
}

export default function QuestionDetailsDialog({
  open,
  onOpenChange,
  questions,
  testName,
}: QuestionDetailsDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      await generateQuestionsPDF(questions, testName);
      toast.success('PDF downloaded successfully!');
    } catch (error: any) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!currentQuestion) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base sm:text-lg md:text-xl text-text-primary">
                Question Details & Explanations
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-text-secondary mt-1">
                {testName} - Question {currentIndex + 1} of {questions.length}
              </DialogDescription>
            </div>
            <Button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              variant="outline"
              size="sm"
              className="gap-2 flex-shrink-0 h-9 sm:h-10"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download PDF</span>
                  <span className="sm:hidden">PDF</span>
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Question Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                Q{currentIndex + 1}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {currentQuestion.subject}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {currentQuestion.chapter}
              </Badge>
              <Badge
                variant={
                  currentQuestion.difficulty === 'easy'
                    ? 'secondary'
                    : currentQuestion.difficulty === 'medium'
                    ? 'default'
                    : 'destructive'
                }
                className="text-xs"
              >
                {currentQuestion.difficulty}
              </Badge>
            </div>

            {/* Question Text */}
            <Card className="bg-card border-border">
              <CardContent className="p-3 sm:p-4 md:p-6">
                {currentQuestion.questionText && currentQuestion.questionText.trim() && (
                  <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert mb-4">
                    <MathContent content={currentQuestion.questionText} />
                  </div>
                )}

                {/* Question Image */}
                {currentQuestion.image && (
                  <div className="mt-4 rounded-lg border-2 border-primary/30 bg-muted/40 p-2 sm:p-3 md:p-4">
                    <img
                      src={currentQuestion.image.getDirectURL()}
                      alt="Question diagram"
                      className="w-full h-auto max-h-[200px] sm:max-h-[300px] md:max-h-[400px] object-contain rounded"
                      loading="lazy"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Options with Answer Key */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-primary">Options & Answer Key</h3>
              {currentQuestion.options.map((option, optIndex) => {
                const isCorrect = Number(currentQuestion.correctAnswer) === optIndex;
                return (
                  <Card
                    key={optIndex}
                    className={`${
                      isCorrect
                        ? 'border-success bg-success/10'
                        : 'border-border bg-background'
                    }`}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <span className="font-medium text-text-primary flex-shrink-0 text-sm sm:text-base">
                          {optIndex + 1}.
                        </span>
                        <div className="flex-1 space-y-2 min-w-0">
                          {option.text && option.text.trim() && (
                            <div className="text-sm sm:text-base">
                              <MathContent content={option.text} inline />
                            </div>
                          )}
                          {option.image && (
                            <div className="rounded border border-primary/20 bg-muted/30 p-2">
                              <img
                                src={option.image.getDirectURL()}
                                alt={`Option ${optIndex + 1} image`}
                                className="w-full h-auto max-h-24 sm:max-h-32 object-contain rounded"
                                loading="lazy"
                              />
                            </div>
                          )}
                        </div>
                        {isCorrect && (
                          <Badge className="bg-success text-white gap-1 flex-shrink-0 text-xs">
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="hidden sm:inline">Correct Answer</span>
                            <span className="sm:hidden">✓</span>
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Explanation */}
            {currentQuestion.explanation && currentQuestion.explanation.trim() && (
              <Card className="bg-info/10 border-info/30">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <h3 className="text-sm font-semibold text-text-primary mb-3">
                    Detailed Explanation
                  </h3>
                  <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
                    <MathContent content={currentQuestion.explanation} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        {/* Navigation Footer */}
        <div className="p-3 sm:p-4 border-t border-border flex items-center justify-between gap-3 sm:gap-4">
          <Button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            variant="outline"
            size="sm"
            className="gap-2 h-9 sm:h-10"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <span className="text-xs sm:text-sm text-text-secondary">
            {currentIndex + 1} / {questions.length}
          </span>
          <Button
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
            variant="outline"
            size="sm"
            className="gap-2 h-9 sm:h-10"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
