import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface QuestionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId?: bigint;
}

/**
 * Placeholder component for question details dialog.
 * This component will be implemented with full question viewing capabilities.
 */
export default function QuestionDetailsDialog({
  open,
  onOpenChange,
  questionId,
}: QuestionDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Question Details</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground">
            Question details for ID: {questionId?.toString() || 'N/A'}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Full implementation coming soon.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
