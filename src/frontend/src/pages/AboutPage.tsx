import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppView } from '../App';
import { GraduationCap, Target, Heart, Shield } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (view: AppView) => void;
}

export default function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header onNavigate={onNavigate} currentView="about" />
      
      <main className="flex-1 py-8 sm:py-12 md:py-16">
        <div className="container max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-full mb-4 sm:mb-6">
              <span className="text-4xl sm:text-5xl font-bold text-primary-foreground">Δ</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 px-4">About Concept Delta</h1>
            <p className="text-lg sm:text-xl text-muted-foreground px-4">
              Your trusted partner in MHT-CET preparation
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                  Our Story
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 text-sm sm:text-base text-muted-foreground">
                <p>
                  Concept Delta is an initiative by a <strong className="text-foreground">COEP Technological University student</strong>, one of Maharashtra's most prestigious engineering institutions. Having experienced the challenges of competitive exam preparation firsthand, our founder understands what it takes to succeed in MHT-CET.
                </p>
                <p>
                  COEP Technological University has a legacy of producing some of Maharashtra's finest engineers and innovators. This platform brings that same commitment to excellence to help aspiring students crack the MHT-CET examination.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 text-sm sm:text-base text-muted-foreground">
                <p>
                  Our mission is to provide high-quality, accessible mock tests that mirror the actual MHT-CET exam pattern. We believe that consistent practice with real exam-level questions is the key to success.
                </p>
                <p>
                  By combining the academic rigor of a top engineering institution with practical exam strategies, we aim to help every MHT-CET aspirant achieve their dream college admission.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                  Authenticity & Educational Purpose
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 text-sm sm:text-base text-muted-foreground">
                <p>
                  Every question, every test, and every feature on this platform is crafted with genuine care for student success. Our content is developed by someone who has walked the same path and understands the pressure and aspirations of MHT-CET candidates.
                </p>
                <p>
                  We are committed to maintaining the highest standards of educational integrity. Our mock tests are designed to challenge you, prepare you, and build your confidence for the actual examination.
                </p>
              </CardContent>
            </Card>

            <Card className="border-warning/50 bg-warning/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-warning flex-shrink-0" />
                  Important Disclaimer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 text-sm sm:text-base text-muted-foreground">
                <p className="font-medium text-foreground">
                  Concept Delta is an independent educational platform and is not affiliated with or endorsed by COEP Technological University.
                </p>
                <p>
                  While our founder is a student at COEP Technological University, this platform operates independently. The mention of COEP is solely to provide context about the educational background and experience that informs our approach to MHT-CET preparation.
                </p>
                <p>
                  We respect the reputation and legacy of COEP Technological University and make no claims of official association or endorsement.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 sm:mt-12 text-center">
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-4">
              Ready to begin your MHT-CET preparation journey?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Button
                onClick={() => onNavigate('dashboard')}
                size="lg"
                className="w-full sm:w-auto h-12 sm:h-auto"
              >
                Start Practicing
              </Button>
              <Button
                onClick={() => onNavigate('landing')}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 sm:h-auto"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
