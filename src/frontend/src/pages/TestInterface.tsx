import React, { useEffect } from 'react';
import { useViewActivation } from '../contexts/ViewActivationContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppView } from '../App';
import { FileText } from 'lucide-react';

interface TestInterfaceProps {
  onNavigate: (view: AppView) => void;
}

/**
 * Placeholder page component for the test-taking interface.
 * This page will be implemented with full test functionality including questions, timer, and submission.
 */
export default function TestInterface({ onNavigate }: TestInterfaceProps) {
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
              <FileText className="w-6 h-6 text-primary" />
              Test Interface
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                The test interface will load here.
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
