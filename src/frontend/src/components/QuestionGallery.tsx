import { useState, useEffect } from 'react';
import { useGetQuestionsForGallery } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Image as ImageIcon, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import MathContent from './MathContent';
import type { GalleryQuestionPreview, TestType } from '../backend';
import { TestType as TestTypeEnum } from '../backend';

interface QuestionGalleryProps {
  onSelectionChange: (selectedIds: bigint[]) => void;
  initialSelection?: bigint[];
}

export default function QuestionGallery({ onSelectionChange, initialSelection = [] }: QuestionGalleryProps) {
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(
    new Set(initialSelection.map(id => id.toString()))
  );
  const [filters, setFilters] = useState({
    subject: null as string | null,
    chapter: null as string | null,
    difficulty: null as string | null,
    classLevel: null as TestType | null,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const pageSize = 20;

  const { data: galleryData, isLoading, isError, error, isFetching } = useGetQuestionsForGallery(
    filters.subject,
    filters.chapter,
    filters.difficulty,
    filters.classLevel,
    BigInt(currentPage),
    BigInt(pageSize)
  );

  const questions = galleryData?.questions || [];
  const totalCount = galleryData?.totalCount || BigInt(0);
  const pageCount = galleryData?.pageCount || BigInt(0);

  // Sync initial selection when it changes from parent
  useEffect(() => {
    setSelectedQuestions(new Set(initialSelection.map(id => id.toString())));
  }, [initialSelection]);

  // Filter questions by search term locally
  const filteredQuestions = questions.filter(q => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      q.questionText.toLowerCase().includes(searchLower) ||
      q.chapter.toLowerCase().includes(searchLower) ||
      q.subject.toLowerCase().includes(searchLower)
    );
  });

  const handleToggleQuestion = (questionId: bigint) => {
    const idStr = questionId.toString();
    const newSelection = new Set(selectedQuestions);
    
    if (newSelection.has(idStr)) {
      newSelection.delete(idStr);
    } else {
      newSelection.add(idStr);
    }
    
    setSelectedQuestions(newSelection);
    onSelectionChange(Array.from(newSelection).map(id => BigInt(id)));
  };

  const handleCardClick = (questionId: bigint, event: React.MouseEvent) => {
    // Prevent if clicking on checkbox or other interactive elements
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="checkbox"]')) {
      return;
    }
    handleToggleQuestion(questionId);
  };

  const handleSelectAll = () => {
    const newSelection = new Set(selectedQuestions);
    filteredQuestions.forEach(q => newSelection.add(q.id.toString()));
    setSelectedQuestions(newSelection);
    onSelectionChange(Array.from(newSelection).map(id => BigInt(id)));
  };

  const handleClearSelection = () => {
    setSelectedQuestions(new Set());
    onSelectionChange([]);
  };

  const handleFilterChange = (key: keyof typeof filters, value: string | TestType | null) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(0);
  };

  const handleNextPage = () => {
    if (currentPage < Number(pageCount) - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleImageError = (questionId: string) => {
    setImageErrors(prev => new Set(prev).add(questionId));
  };

  // Reset image errors when page changes
  useEffect(() => {
    setImageErrors(new Set());
  }, [currentPage, filters]);

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg text-text-primary">Filter Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm text-text-primary">Subject</Label>
              <Select
                value={filters.subject || 'all'}
                onValueChange={(value) => handleFilterChange('subject', value === 'all' ? null : value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs sm:text-sm text-text-primary">Class Level</Label>
              <Select
                value={filters.classLevel || 'all'}
                onValueChange={(value) => handleFilterChange('classLevel', value === 'all' ? null : value as TestType)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value={TestTypeEnum.class11}>Class 11th</SelectItem>
                  <SelectItem value={TestTypeEnum.class12}>Class 12th</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs sm:text-sm text-text-primary">Chapter</Label>
              <Input
                placeholder="Filter by chapter..."
                value={filters.chapter || ''}
                onChange={(e) => handleFilterChange('chapter', e.target.value || null)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs sm:text-sm text-text-primary">Difficulty</Label>
              <Select
                value={filters.difficulty || 'all'}
                onValueChange={(value) => handleFilterChange('difficulty', value === 'all' ? null : value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs sm:text-sm text-text-primary">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 pl-9"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs">
                {selectedQuestions.size} Selected
              </Badge>
              <Badge variant="outline" className="text-xs">
                {Number(totalCount)} Total
              </Badge>
              {isFetching && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading...
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={filteredQuestions.length === 0 || isFetching}
                className="h-9 text-xs"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
                disabled={selectedQuestions.size === 0}
                className="h-9 text-xs"
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Gallery */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg text-text-primary">
              Question Gallery
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              {isFetching ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading...
                </span>
              ) : (
                <span>Page {currentPage + 1} of {Number(pageCount) || 1}</span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Loading Overlay */}
          {isLoading && (
            <div className="flex items-center justify-center h-[600px] rounded-lg border border-border bg-muted/30">
              <div className="text-center space-y-3">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                <p className="text-sm font-medium text-text-primary">Loading questions...</p>
                <p className="text-xs text-text-secondary">Please wait while we fetch the data</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {!isLoading && isError && (
            <div className="flex items-center justify-center h-[600px] rounded-lg border border-border bg-muted/30">
              <div className="text-center space-y-3 max-w-md px-4">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                <p className="text-text-primary font-semibold">Failed to load questions</p>
                <p className="text-xs text-text-muted">
                  {error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="mt-4"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Content */}
          {!isLoading && !isError && (
            <>
              <ScrollArea className="h-[600px] rounded-lg border border-border bg-muted/30 p-4 relative">
                {/* Fetching Overlay */}
                {isFetching && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                    <div className="text-center space-y-2">
                      <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                      <p className="text-xs text-text-secondary">Updating...</p>
                    </div>
                  </div>
                )}

                {filteredQuestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <XCircle className="w-12 h-12 text-text-muted mb-4" />
                    <p className="text-text-secondary">No questions found</p>
                    <p className="text-xs text-text-muted mt-2">Try adjusting your filters or search term</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredQuestions.map((question) => {
                      const isSelected = selectedQuestions.has(question.id.toString());
                      const hasImageError = imageErrors.has(question.id.toString());
                      
                      return (
                        <Card
                          key={question.id.toString()}
                          className={`transition-all cursor-pointer ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-md'
                              : 'border-border bg-card hover:border-primary/50 hover:shadow-sm'
                          }`}
                          onClick={(e) => handleCardClick(question.id, e)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {/* Checkbox */}
                              <div 
                                className="flex-shrink-0 pt-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleToggleQuestion(question.id)}
                                  className="w-5 h-5"
                                />
                              </div>

                              {/* Question Preview Image with Error Handling */}
                              {question.hasImage && question.previewImage && !hasImageError && (
                                <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg border-2 border-primary/30 bg-muted/40 overflow-hidden">
                                  <img
                                    src={question.previewImage.getDirectURL()}
                                    alt="Question preview"
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={() => handleImageError(question.id.toString())}
                                  />
                                </div>
                              )}

                              {/* Image placeholder if error occurred */}
                              {question.hasImage && hasImageError && (
                                <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg border-2 border-border bg-muted/40 flex items-center justify-center">
                                  <ImageIcon className="w-8 h-8 text-text-muted" />
                                </div>
                              )}

                              {/* Question Content */}
                              <div className="flex-1 min-w-0 space-y-2">
                                {/* Badges */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs">
                                    ID: {question.id.toString()}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {question.subject}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {question.chapter}
                                  </Badge>
                                  <Badge
                                    variant={
                                      question.difficulty === 'easy'
                                        ? 'secondary'
                                        : question.difficulty === 'medium'
                                        ? 'default'
                                        : 'destructive'
                                    }
                                    className="text-xs"
                                  >
                                    {question.difficulty}
                                  </Badge>
                                  {question.hasImage && (
                                    <Badge variant="default" className="text-xs gap-1">
                                      <ImageIcon className="w-3 h-3" />
                                      Image
                                    </Badge>
                                  )}
                                </div>

                                {/* Question Text Preview */}
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                  <MathContent 
                                    content={question.snippet + (question.questionText.length > 75 ? '...' : '')} 
                                  />
                                </div>

                                {/* Options Preview */}
                                {question.options && question.options.length > 0 && (
                                  <div className="text-xs text-text-secondary">
                                    {question.options.length} option{question.options.length !== 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>

                              {/* Selection Indicator */}
                              {isSelected && (
                                <div className="flex-shrink-0">
                                  <CheckCircle2 className="w-6 h-6 text-primary" />
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Pagination Controls */}
              {Number(pageCount) > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 0 || isFetching}
                    className="h-9"
                  >
                    Previous
                  </Button>
                  <div className="text-xs text-text-secondary">
                    Showing {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, Number(totalCount))} of {Number(totalCount)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage >= Number(pageCount) - 1 || isFetching}
                    className="h-9"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
