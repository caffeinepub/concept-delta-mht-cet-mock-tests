import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SiYoutube } from 'react-icons/si';
import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { useSetYouTubeVerified } from '../hooks/useQueries';
import { toast } from 'sonner';

interface YouTubeSubscriptionGateProps {
  onVerified: () => void;
}

export default function YouTubeSubscriptionGate({ onVerified }: YouTubeSubscriptionGateProps) {
  const [hasSubscribed, setHasSubscribed] = useState(false);
  const setYouTubeVerified = useSetYouTubeVerified();

  const handleConfirmSubscription = async () => {
    try {
      await setYouTubeVerified.mutateAsync();
      toast.success('YouTube subscription verified! You can now access all tests.');
      onVerified();
    } catch (error: any) {
      console.error('Error verifying subscription:', error);
      toast.error(error.message || 'Failed to verify subscription. Please try again.');
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-8">
      <Card className="max-w-2xl w-full border-2 border-primary/20 shadow-lg">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-[#FF0000] rounded-full flex items-center justify-center shadow-lg">
              <SiYoutube className="w-12 h-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary">
            Subscribe to Unlock Tests
          </CardTitle>
          <CardDescription className="text-base sm:text-lg text-text-secondary">
            Subscribe to Concept Delta YouTube Channel to access all MHT-CET mock tests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* YouTube Channel Link */}
          <div className="space-y-4">
            <Alert className="border-[#FF0000]/20 bg-[#FF0000]/5">
              <SiYoutube className="w-5 h-5 text-[#FF0000]" />
              <AlertDescription className="text-sm sm:text-base text-text-secondary ml-2">
                Click the button below to visit our YouTube channel and subscribe
              </AlertDescription>
            </Alert>

            <Button
              size="lg"
              asChild
              className="w-full bg-[#FF0000] hover:bg-[#CC0000] text-white font-bold text-base sm:text-lg h-14 sm:h-16 gap-3 shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => setHasSubscribed(true)}
            >
              <a
                href="https://youtube.com/@conceptdelta2026?si=IeGIsp6CvX05mNdh"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center"
              >
                <SiYoutube className="w-6 h-6" />
                <span>Subscribe to Concept Delta</span>
                <ExternalLink className="w-5 h-5" />
              </a>
            </Button>
          </div>

          {/* Verification Steps */}
          <div className="space-y-3 pt-4">
            <h3 className="font-semibold text-lg text-text-primary">How to unlock tests:</h3>
            <ol className="space-y-3 text-sm sm:text-base text-text-secondary">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </span>
                <span>Click the "Subscribe to Concept Delta" button above</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                <span>Subscribe to our YouTube channel</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
                <span>Return to this page and click "I've Subscribed" below</span>
              </li>
            </ol>
          </div>

          {/* Confirmation Button */}
          <div className="pt-4 space-y-3">
            {hasSubscribed && (
              <Alert className="border-success/20 bg-success/5">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <AlertDescription className="text-sm sm:text-base text-text-secondary ml-2">
                  Great! Now confirm your subscription to unlock all tests
                </AlertDescription>
              </Alert>
            )}
            
            <Button
              size="lg"
              onClick={handleConfirmSubscription}
              disabled={setYouTubeVerified.isPending}
              className="w-full bg-success hover:bg-success/90 text-success-foreground font-bold text-base sm:text-lg h-14 sm:h-16 gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {setYouTubeVerified.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>I've Subscribed - Unlock Tests</span>
                </>
              )}
            </Button>
          </div>

          {/* Additional Info */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs sm:text-sm text-text-muted text-center">
              By subscribing, you'll get access to test explanations, study tips, and exclusive content for MHT-CET preparation
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
