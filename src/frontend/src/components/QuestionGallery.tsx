import { useState, useMemo } from 'react';
import { useGetCallerRole, useDeleteQuestion } from '../hooks/useQueries';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Filter, Loader2, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Question } from '../types/local';

interface QuestionGalleryProps {
  questions: Question[];
  selectedQuestionIds: bigint[];
  onSelectionChange: (ids: bigint[]) => void;
  isLoading?: boolean;
}

export default function QuestionGallery({
  questions,
  selectedQuestionIds,
  onSelectionChange,
  isLoading = false,
}: QuestionGalleryProps) {
  const { data: userRole } = useGetCallerRole();
  const deleteQuestion = useDeleteQuestion();
  const [searchQuery, setSearchQuery] = useState('');
  const [chapterFilter, setChapterFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<{ id: bigint; text: string } | null>(null);

  const isAdmin = userRole === 'admin';

  const chapters = useMemo(() => {
    const uniqueChapters = Array.from(new Set(questions.map((q) => q.chapter)));
    return uniqueChapters.sort();
  }, [questions]);

  const difficulties = useMemo(() => {
    const uniqueDifficulties = Array.from(new Set(questions.map((q) => q.difficulty)));
    return uniqueDifficulties.sort();
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch =
        searchQuery === '' ||
        q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.chapter.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesChapter = chapterFilter === 'all' || q.chapter === chapterFilter;
      const matchesDifficulty = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
      return matchesSearch && matchesChapter && matchesDifficulty;
    });
  }, [questions, searchQuery, chapterFilter, difficultyFilter]);

  const handleQuestionClick = (questionId: bigint, event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest('button[data-delete-button]')) {
      return;
    }

    const isSelected = selectedQuestionIds.some((id) => id === questionId);
    if (isSelected) {
      onSelectionChange(selectedQuestionIds.filter((id) => id !== questionId));
    } else {
      onSelectionChange([...selectedQuestionIds, questionId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedQuestionIds.length === filteredQuestions.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredQuestions.map((q) => q.id));
    }
  };

  const handleDeleteClick = (questionId: bigint, questionText: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setQuestionToDelete({ id: questionId, text: questionText });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!questionToDelete) return;

    try {
      await deleteQuestion.mutateAsync(questionToDelete.id);
      toast.success('Question deleted successfully');
      
      if (selectedQuestionIds.some((id) => id === questionToDelete.id)) {
        onSelectionChange(selectedQuestionIds.filter((id) => id !== questionToDelete.id));
      }
      
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete question');
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-sm text-muted-foreground">Loading questions...</p>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">No questions available for this subject</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={chapterFilter} onValueChange={setChapterFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Chapters</SelectItem>
                    {chapters.map((chapter) => (
                      <SelectItem key={chapter} value={chapter}>
                        {chapter}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {difficulties.map((difficulty) => (
                      <SelectItem key={difficulty} value={difficulty}>
                        {difficulty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedQuestionIds.length === filteredQuestions.length ? 'Deselect All' : 'Select All'}
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedQuestionIds.length} of {filteredQuestions.length} selected
              </span>
            </div>
          </div>

          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {filteredQuestions.map((question) => {
                const isSelected = selectedQuestionIds.some((id) => id === question.id);
                return (
                  <Card
                    key={question.id.toString()}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'border-2 border-primary bg-primary/5'
                        : 'border border-border hover:border-primary/50 bg-card'
                    }`}
                    onClick={(e) => handleQuestionClick(question.id, e)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => {}}
                          className="mt-1 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm text-foreground">{question.questionText}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant="outline" className="text-xs">
                                {question.chapter}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className={`text-xs ${
                                  question.difficulty === 'easy'
                                    ? 'bg-success/20 text-success-foreground'
                                    : question.difficulty === 'medium'
                                    ? 'bg-warning/20 text-warning-foreground'
                                    : 'bg-destructive/20 text-destructive-foreground'
                                }`}
                              >
                                {question.difficulty}
                              </Badge>
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  data-delete-button
                                  onClick={(e) => handleDeleteClick(question.id, question.questionText, e)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {question.image && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <span>📷 Has image</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone and will remove the question from all test configurations.
              <div className="mt-3 p-3 bg-muted rounded-md">
                <p className="text-sm">{questionToDelete?.text || ''}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteQuestion.isPending}
            >
              {deleteQuestion.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
