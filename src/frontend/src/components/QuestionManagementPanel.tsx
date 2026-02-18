import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useGetQuestionsBySubject, useGetCallerRole } from '../hooks/useQueries';
import QuestionGallery from './QuestionGallery';
import QuestionEditorDialog from './QuestionEditorDialog';
import { Loader2, AlertCircle, BookOpen, Plus, Edit } from 'lucide-react';
import type { Question } from '../types/local';

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics'];

export default function QuestionManagementPanel() {
  const [selectedSubject, setSelectedSubject] = useState<string>('Physics');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<bigint[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [questionToEdit, setQuestionToEdit] = useState<Question | undefined>(undefined);

  const { data: questions = [], isLoading, isError, error, refetch } = useGetQuestionsBySubject(selectedSubject);
  const { data: userRole } = useGetCallerRole();

  const isAdmin = userRole === 'admin';

  const handleSubjectChange = (newSubject: string) => {
    setSelectedSubject(newSubject);
    setSelectedQuestionIds([]);
  };

  const handleCreateClick = () => {
    setEditorMode('create');
    setQuestionToEdit(undefined);
    setEditorOpen(true);
  };

  const handleEditClick = () => {
    if (selectedQuestionIds.length !== 1) {
      return;
    }
    const question = questions.find((q) => q.id === selectedQuestionIds[0]);
    if (question) {
      setEditorMode('edit');
      setQuestionToEdit(question);
      setEditorOpen(true);
    }
  };

  const handleEditorClose = (open: boolean) => {
    setEditorOpen(open);
    if (!open) {
      setQuestionToEdit(undefined);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Question Gallery
          </CardTitle>
          <CardDescription>Browse, search, and manage questions by subject</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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

            {isAdmin && (
              <div className="flex items-center gap-2 ml-auto">
                <Button onClick={handleCreateClick} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Question
                </Button>
                <Button
                  onClick={handleEditClick}
                  size="sm"
                  variant="outline"
                  disabled={selectedQuestionIds.length !== 1}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            )}
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

      {isAdmin && (
        <QuestionEditorDialog
          open={editorOpen}
          onOpenChange={handleEditorClose}
          mode={editorMode}
          question={questionToEdit}
          defaultSubject={selectedSubject}
        />
      )}
    </>
  );
}
