import React, { useEffect } from 'react';
import { useViewActivation } from '../contexts/ViewActivationContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppView } from '../App';
import { Trophy } from 'lucide-react';

interface ResultPageProps {
  onNavigate: (view: AppView) => void;
}

/**
 * Placeholder page component for displaying test results.
 * This page will be implemented with full result viewing and analysis capabilities.
 */
export default function ResultPage({ onNavigate }: ResultPageProps) {
  const { finishActivation } = useViewActivation();

  useEffect(() => {
    finishActivation();
  }, [finishActivation]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onNavigate={onNavigate} currentView="dashboard" />
      
      <main className="flex-1 container py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                Your test results will appear here.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Full implementation coming soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
