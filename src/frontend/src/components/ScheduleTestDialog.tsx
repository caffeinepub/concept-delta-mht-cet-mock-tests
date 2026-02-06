import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface ScheduleTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testId: bigint;
  testName: string;
  currentStartTime?: bigint;
  currentEndTime?: bigint;
  onSchedule: (testId: bigint, startTime: bigint, endTime: bigint) => Promise<void>;
}

export default function ScheduleTestDialog({
  open,
  onOpenChange,
  testId,
  testName,
  currentStartTime,
  currentEndTime,
  onSchedule,
}: ScheduleTestDialogProps) {
  const formatDateTimeLocal = (timestamp?: bigint) => {
    if (!timestamp) return '';
    const date = new Date(Number(timestamp) / 1_000_000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [startDateTime, setStartDateTime] = useState(formatDateTimeLocal(currentStartTime));
  const [endDateTime, setEndDateTime] = useState(formatDateTimeLocal(currentEndTime));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSchedule = async () => {
    if (!startDateTime || !endDateTime) {
      toast.error('Please select both start and end date/time');
      return;
    }

    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    if (endDate <= startDate) {
      toast.error('End time must be after start time');
      return;
    }

    const startTimeNanos = BigInt(startDate.getTime()) * BigInt(1_000_000);
    const endTimeNanos = BigInt(endDate.getTime()) * BigInt(1_000_000);

    setIsSubmitting(true);
    try {
      await onSchedule(testId, startTimeNanos, endTimeNanos);
      toast.success(`Test "${testName}" scheduled successfully`);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule test');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Test</DialogTitle>
          <DialogDescription>
            Set the start and end date/time for "{testName}". The test will automatically become live at the start time and end at the specified end time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="startDateTime" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Start Date & Time
            </Label>
            <Input
              id="startDateTime"
              type="datetime-local"
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDateTime" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              End Date & Time
            </Label>
            <Input
              id="endDateTime"
              type="datetime-local"
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="p-3 rounded-lg bg-info/10 border border-info/30">
            <p className="text-xs text-text-secondary">
              <strong>Note:</strong> Students will only see this test during the scheduled time window. The test will automatically publish at the start time and stop at the end time.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={isSubmitting} className="gap-2">
            <Calendar className="w-4 h-4" />
            {isSubmitting ? 'Scheduling...' : 'Schedule Test'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
