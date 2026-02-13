import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';

interface PerTestResultPDFExportProps {
  testId?: bigint;
  className?: string;
}

/**
 * Placeholder component for per-test result PDF export functionality.
 * This component will be implemented with full PDF generation capabilities.
 */
export default function PerTestResultPDFExport({ testId, className }: PerTestResultPDFExportProps) {
  const handleExport = () => {
    console.log('Per-test result PDF export - to be implemented', testId);
  };

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      className={className}
      disabled
    >
      <FileDown className="w-4 h-4 mr-2" />
      Export Test Results
    </Button>
  );
}
