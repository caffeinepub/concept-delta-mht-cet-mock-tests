import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetQuestionsBySubject } from '../hooks/useQueries';
import QuestionGallery from './QuestionGallery';
import { Loader2, AlertCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics'];

export default function QuestionManagementPanel() {
  const [selectedSubject, setSelectedSubject] = useState<string>('Physics');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<bigint[]>([]);
  const { data: questions = [], isLoading, isError, error, refetch } = useGetQuestionsBySubject(selectedSubject);

  const handleSubjectChange = (newSubject: string) => {
    setSelectedSubject(newSubject);
    setSelectedQuestionIds([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Question Gallery
        </CardTitle>
        <CardDescription>Browse, search, and manage questions by subject</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Subject:</label>
          <Select value={selectedSubject} onValueChange={handleSubjectChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {SUBJECTS.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-sm text-muted-foreground text-center">
              Failed to load questions: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        ) : (
          <QuestionGallery
            questions={questions}
            selectedQuestionIds={selectedQuestionIds}
            onSelectionChange={setSelectedQuestionIds}
          />
        )}
      </CardContent>
    </Card>
  );
}
