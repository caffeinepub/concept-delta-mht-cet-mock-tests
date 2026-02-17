import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, FileText, Play, Calendar } from 'lucide-react';
import type { TestConfig, TestStatus } from '../types/local';

interface TestConfigListProps {
  testConfigs: Array<[TestConfig, TestStatus]>;
  onStartTest: (testId: bigint) => void;
}

export default function TestConfigList({ testConfigs, onStartTest }: TestConfigListProps) {
  const getStatusBadge = (status: TestStatus) => {
    const statusConfig = {
      scheduled: { label: 'Scheduled', className: 'bg-scheduled/20 text-scheduled-foreground border-scheduled' },
      live: { label: 'Live', className: 'bg-live/20 text-live-foreground border-live' },
      ended: { label: 'Ended', className: 'bg-ended/20 text-ended-foreground border-ended' },
      finished: { label: 'Finished', className: 'bg-completed/20 text-completed-foreground border-completed' },
    };
    const config = statusConfig[status];
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getTestTypeLabel = (testType: string) => {
    const labels: Record<string, string> = {
      class11: 'Class 11',
      class12: 'Class 12',
      completeSyllabus: 'Complete Syllabus',
    };
    return labels[testType] || testType;
  };

  const formatDateTime = (timestamp: bigint | null) => {
    if (!timestamp) return 'Not scheduled';
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canStartTest = (status: TestStatus) => {
    return status === 'live' || status === 'ended';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {testConfigs.map(([config, status]) => (
        <Card key={config.id.toString()} className="bg-card border-border hover:border-primary/50 transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base sm:text-lg text-foreground line-clamp-2">
                {config.name}
              </CardTitle>
              {getStatusBadge(status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{config.subject}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span>{getTestTypeLabel(config.testType)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>{Number(config.durationMinutes)} minutes</span>
              </div>
              {config.startTime && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs">{formatDateTime(config.startTime)}</span>
                </div>
              )}
            </div>
            <div className="pt-2">
              <Button
                onClick={() => onStartTest(config.id)}
                disabled={!canStartTest(status)}
                className="w-full"
                size="sm"
              >
                <Play className="w-4 h-4 mr-2" />
                {status === 'live' ? 'Start Test' : status === 'ended' ? 'View Results' : 'Not Available'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
