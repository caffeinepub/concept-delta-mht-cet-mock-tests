import { useState, useEffect } from 'react';
import { useCreateQuestion, useUpdateQuestion } from '../hooks/useQueries';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, X, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Question, TestType } from '../types/local';
import { ExternalBlob } from '../backend';
import { fileToExternalBlob, getBlobDisplayURL, validateImageFile } from '../utils/externalBlob';

interface QuestionEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  question?: Question;
  defaultSubject?: string;
}

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const CLASS_LEVELS: { value: TestType; label: string }[] = [
  { value: 'class11', label: 'Class 11' },
  { value: 'class12', label: 'Class 12' },
  { value: 'completeSyllabus', label: 'Complete Syllabus' },
];

export default function QuestionEditorDialog({
  open,
  onOpenChange,
  mode,
  question,
  defaultSubject,
}: QuestionEditorDialogProps) {
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();

  const [subject, setSubject] = useState(defaultSubject || 'Physics');
  const [chapter, setChapter] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<Array<{ text: string; image?: ExternalBlob }>>([
    { text: '' },
    { text: '' },
    { text: '' },
    { text: '' },
  ]);
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);
  const [explanation, setExplanation] = useState('');
  const [classLevel, setClassLevel] = useState<TestType>('class12');
  const [questionImage, setQuestionImage] = useState<ExternalBlob | undefined>(undefined);
  const [questionImagePreview, setQuestionImagePreview] = useState<string | undefined>(undefined);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Initialize form when question changes
  useEffect(() => {
    if (mode === 'edit' && question) {
      setSubject(question.subject);
      setChapter(question.chapter);
      setDifficulty(question.difficulty);
      setQuestionText(question.questionText);
      setOptions(question.options.length > 0 ? question.options : [{ text: '' }, { text: '' }, { text: '' }, { text: '' }]);
      setCorrectAnswer(Number(question.correctAnswer));
      setExplanation(question.explanation || '');
      setClassLevel(question.classLevel as TestType);
      setQuestionImage(question.image);
      setQuestionImagePreview(question.image ? getBlobDisplayURL(question.image) : undefined);
    } else if (mode === 'create') {
      resetForm();
    }
  }, [mode, question, open]);

  const resetForm = () => {
    setSubject(defaultSubject || 'Physics');
    setChapter('');
    setDifficulty('medium');
    setQuestionText('');
    setOptions([{ text: '' }, { text: '' }, { text: '' }, { text: '' }]);
    setCorrectAnswer(0);
    setExplanation('');
    setClassLevel('class12');
    setQuestionImage(undefined);
    setQuestionImagePreview(undefined);
    setUploadProgress({});
  };

  const handleQuestionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      const blob = await fileToExternalBlob(file, (percentage) => {
        setUploadProgress((prev) => ({ ...prev, question: percentage }));
      });
      setQuestionImage(blob);
      setQuestionImagePreview(getBlobDisplayURL(blob));
      setUploadProgress((prev) => ({ ...prev, question: 100 }));
      toast.success('Question image uploaded');
    } catch (error: any) {
      toast.error('Failed to upload question image');
      console.error(error);
    }
  };

  const handleOptionImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      const blob = await fileToExternalBlob(file, (percentage) => {
        setUploadProgress((prev) => ({ ...prev, [`option-${index}`]: percentage }));
      });
      const newOptions = [...options];
      newOptions[index] = { ...newOptions[index], image: blob };
      setOptions(newOptions);
      setUploadProgress((prev) => ({ ...prev, [`option-${index}`]: 100 }));
      toast.success(`Option ${index + 1} image uploaded`);
    } catch (error: any) {
      toast.error(`Failed to upload option ${index + 1} image`);
      console.error(error);
    }
  };

  const handleOptionTextChange = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], text };
    setOptions(newOptions);
  };

  const removeQuestionImage = () => {
    setQuestionImage(undefined);
    setQuestionImagePreview(undefined);
  };

  const removeOptionImage = (index: number) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], image: undefined };
    setOptions(newOptions);
  };

  const handleSubmit = async () => {
    // Validation
    if (!subject || !chapter || !questionText.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const validOptions = options.filter((opt) => opt.text.trim() !== '');
    if (validOptions.length < 2) {
      toast.error('Please provide at least 2 options');
      return;
    }

    if (correctAnswer < 0 || correctAnswer >= validOptions.length) {
      toast.error('Please select a valid correct answer');
      return;
    }

    try {
      const payload = {
        subject,
        chapter: chapter.trim(),
        difficulty,
        questionText: questionText.trim(),
        options: validOptions,
        correctAnswer: BigInt(correctAnswer),
        explanation: explanation.trim() || undefined,
        image: questionImage,
        classLevel,
      };

      if (mode === 'create') {
        await createQuestion.mutateAsync(payload);
      } else if (mode === 'edit' && question) {
        await updateQuestion.mutateAsync({
          questionId: question.id,
          ...payload,
        });
      }

      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      // Error toast is handled by mutation
      console.error('Failed to save question:', error);
    }
  };

  const isSubmitting = createQuestion.isPending || updateQuestion.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Question' : 'Edit Question'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new question to the gallery with optional images'
              : 'Update question details and images'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 py-2">
            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">
                Subject <span className="text-destructive">*</span>
              </Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger id="subject">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Chapter */}
            <div className="space-y-2">
              <Label htmlFor="chapter">
                Chapter <span className="text-destructive">*</span>
              </Label>
              <Input
                id="chapter"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder="e.g., Mechanics, Thermodynamics"
              />
            </div>

            {/* Difficulty & Class Level */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="classLevel">Class Level</Label>
                <Select value={classLevel} onValueChange={(val) => setClassLevel(val as TestType)}>
                  <SelectTrigger id="classLevel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_LEVELS.map((cl) => (
                      <SelectItem key={cl.value} value={cl.value}>
                        {cl.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-2">
              <Label htmlFor="questionText">
                Question Text <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="questionText"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Enter the question text..."
                rows={3}
              />
            </div>

            {/* Question Image */}
            <div className="space-y-2">
              <Label>Question Image (Optional)</Label>
              {questionImagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={questionImagePreview}
                    alt="Question"
                    className="max-w-full h-auto max-h-48 rounded border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeQuestionImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleQuestionImageUpload}
                    className="hidden"
                    id="question-image-upload"
                  />
                  <Label
                    htmlFor="question-image-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Image
                  </Label>
                  {uploadProgress.question !== undefined && uploadProgress.question < 100 && (
                    <span className="text-sm text-muted-foreground">{uploadProgress.question}%</span>
                  )}
                </div>
              )}
            </div>

            {/* Options */}
            <div className="space-y-3">
              <Label>
                Options <span className="text-destructive">*</span> (at least 2)
              </Label>
              {options.map((option, index) => (
                <div key={index} className="space-y-2 p-3 border rounded-md">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Option {index + 1}</Label>
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={correctAnswer === index}
                      onChange={() => setCorrectAnswer(index)}
                      className="ml-auto"
                    />
                    <Label className="text-sm text-muted-foreground">Correct</Label>
                  </div>
                  <Input
                    value={option.text}
                    onChange={(e) => handleOptionTextChange(index, e.target.value)}
                    placeholder={`Enter option ${index + 1} text...`}
                  />
                  {option.image ? (
                    <div className="relative inline-block">
                      <img
                        src={getBlobDisplayURL(option.image)}
                        alt={`Option ${index + 1}`}
                        className="max-w-full h-auto max-h-32 rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1"
                        onClick={() => removeOptionImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => handleOptionImageUpload(index, e)}
                        className="hidden"
                        id={`option-${index}-image-upload`}
                      />
                      <Label
                        htmlFor={`option-${index}-image-upload`}
                        className="cursor-pointer inline-flex items-center gap-2 px-3 py-1 text-sm border rounded-md hover:bg-accent"
                      >
                        <ImageIcon className="h-3 w-3" />
                        Add Image
                      </Label>
                      {uploadProgress[`option-${index}`] !== undefined &&
                        uploadProgress[`option-${index}`] < 100 && (
                          <span className="text-xs text-muted-foreground">
                            {uploadProgress[`option-${index}`]}%
                          </span>
                        )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Explanation */}
            <div className="space-y-2">
              <Label htmlFor="explanation">Explanation (Optional)</Label>
              <Textarea
                id="explanation"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Provide an explanation for the correct answer..."
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : mode === 'create' ? (
              'Create Question'
            ) : (
              'Update Question'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
