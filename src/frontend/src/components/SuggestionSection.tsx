import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSubmitSuggestion } from '../hooks/useQueries';
import { Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface SuggestionSectionProps {
  userName: string;
}

export default function SuggestionSection({ userName }: SuggestionSectionProps) {
  const [feedback, setFeedback] = useState('');
  const submitSuggestion = useSubmitSuggestion();

  const maxLength = 250;
  const remainingChars = maxLength - feedback.length;

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast.error('Please enter your feedback');
      return;
    }

    if (feedback.length > maxLength) {
      toast.error(`Feedback must be ${maxLength} characters or less`);
      return;
    }

    try {
      await submitSuggestion.mutateAsync({
        author: userName,
        feedback: feedback.trim(),
      });
      
      toast.success('Thank you for your feedback!');
      setFeedback('');
    } catch (error: any) {
      // Error is already logged and toasted by the mutation's onError
      // Just ensure UI remains responsive
      console.error('Suggestion submission failed:', error);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Suggestions & Reviews
        </CardTitle>
        <CardDescription className="text-primary-foreground/80 text-xs sm:text-sm">
          Share your feedback to help us improve
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Share your suggestions or feedback…"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[100px] sm:min-h-[120px] resize-none bg-background border-border text-text-primary placeholder:text-text-muted"
            maxLength={maxLength}
          />
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className={`${remainingChars < 50 ? 'text-warning' : 'text-text-muted'}`}>
              {remainingChars} characters remaining
            </span>
            <span className="text-text-muted">
              Max {maxLength} characters
            </span>
          </div>
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={submitSuggestion.isPending || !feedback.trim()}
          className="w-full sm:w-auto gap-2"
        >
          {submitSuggestion.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <MessageSquare className="w-4 h-4" />
              Submit Feedback
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
