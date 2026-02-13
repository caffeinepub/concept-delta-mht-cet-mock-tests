import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';

interface PerTestScoreOnlyPDFExportProps {
  testId?: bigint;
  className?: string;
}

/**
 * Placeholder component for per-test score-only PDF export functionality.
 * This component will be implemented with full PDF generation capabilities.
 */
export default function PerTestScoreOnlyPDFExport({ testId, className }: PerTestScoreOnlyPDFExportProps) {
  const handleExport = () => {
    console.log('Per-test score-only PDF export - to be implemented', testId);
  };

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      className={className}
      disabled
    >
      <FileDown className="w-4 h-4 mr-2" />
      Export Scores Only
    </Button>
  );
}
