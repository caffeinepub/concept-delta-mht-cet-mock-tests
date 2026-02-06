import { useState, useRef, useEffect } from 'react';
import { useGetQuestionCount, useGetTestConfigCount, useGetUserCount, useAddQuestion, useCreateTestConfig, useGetQuestionsBySubject, useGetSystemMetrics, useGetActiveSessions, useCleanupStaleSessions, useGetOrderedTestConfigs, useDeleteTestConfig, useReorderTestConfigs, usePublishTestConfig, useStopTestConfig, useGetQuestionsWithAnswersByTestConfig, useGetAllUsersWithTestAttempts } from '../hooks/useQueries';
import { useViewActivation } from '../contexts/ViewActivationContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import QuestionGallery from '../components/QuestionGallery';
import UserManagement from '../components/UserManagement';
import QuestionDetailsDialog from '../components/QuestionDetailsDialog';
import ResultListPDFExport from '../components/ResultListPDFExport';
import PerTestResultPDFExport from '../components/PerTestResultPDFExport';
import AverageResultPDFExport from '../components/AverageResultPDFExport';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppView } from '../App';
import { BookOpen, FileText, Users, Plus, Image as ImageIcon, X, Eye, Activity, Server, Clock, TrendingUp, Trash2, GripVertical, ChevronUp, ChevronDown, Settings, Library, UserCog, Play, StopCircle, FileQuestion, Loader2, Download, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalBlob, TestType, SectionType } from '../backend';
import type { Question } from '../backend';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import MathContent from '../components/MathContent';
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

interface AdminPanelProps {
  onNavigate: (view: AppView) => void;
}

interface OptionWithImage {
  text: string;
  imageFile: File | null;
  imagePreview: string | null;
}

type QuestionOption = { text: string; image?: ExternalBlob };

export default function AdminPanel({ onNavigate }: AdminPanelProps) {
  const { data: questionCount } = useGetQuestionCount();
  const { data: testCount } = useGetTestConfigCount();
  const { data: userCount } = useGetUserCount();
  const { data: systemMetrics } = useGetSystemMetrics();
  const { data: activeSessions } = useGetActiveSessions();
  const { data: orderedTests } = useGetOrderedTestConfigs();
  const { data: allUsersWithAttempts } = useGetAllUsersWithTestAttempts();
  const { finishActivation } = useViewActivation();
  const addQuestion = useAddQuestion();
  const createTest = useCreateTestConfig();
  const cleanupSessions = useCleanupStaleSessions();
  const deleteTest = useDeleteTestConfig();
  const reorderTests = useReorderTestConfigs();
  const publishTest = usePublishTestConfig();
  const stopTest = useStopTestConfig();

  const questionImageInputRef = useRef<HTMLInputElement>(null);
  const optionImageInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Signal view ready on mount
  useEffect(() => {
    finishActivation();
  }, [finishActivation]);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<{ id: bigint; name: string } | null>(null);

  // Publish/Stop confirmation state
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [testToPublish, setTestToPublish] = useState<{ id: bigint; name: string } | null>(null);
  const [testToStop, setTestToStop] = useState<{ id: bigint; name: string } | null>(null);

  // Question Details Dialog state
  const [questionDetailsOpen, setQuestionDetailsOpen] = useState(false);
  const [selectedTestForDetails, setSelectedTestForDetails] = useState<{ id: bigint; name: string } | null>(null);
  const { data: testQuestionsData } = useGetQuestionsWithAnswersByTestConfig(selectedTestForDetails?.id || null);

  // Test filter state
  const [testFilter, setTestFilter] = useState<'all' | 'class11' | 'class12' | 'completeSyllabus'>('all');

  // Question form state
  const [questionForm, setQuestionForm] = useState({
    subject: 'Physics',
    chapter: '',
    difficulty: 'medium',
    questionText: '',
    correctAnswer: '0',
    explanation: '',
    classLevel: TestType.class11,
  });

  // Question image state
  const [questionImageFile, setQuestionImageFile] = useState<File | null>(null);
  const [questionImagePreview, setQuestionImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Options with images state
  const [options, setOptions] = useState<OptionWithImage[]>([
    { text: '', imageFile: null, imagePreview: null },
    { text: '', imageFile: null, imagePreview: null },
    { text: '', imageFile: null, imagePreview: null },
    { text: '', imageFile: null, imagePreview: null },
  ]);

  // Test form state
  const [testForm, setTestForm] = useState({
    name: '',
    subject: 'Physics',
    testType: TestType.class11,
    chapters: '',
    durationMinutes: '60',
    totalQuestions: '50',
    correctMarks: '1',
    incorrectPenalty: '0',
    sectionType: null as SectionType | null,
  });

  // Selected questions from gallery
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<bigint[]>([]);

  // Question gallery state
  const [gallerySubject, setGallerySubject] = useState<string>('Physics');
  const { data: galleryQuestions } = useGetQuestionsBySubject(gallerySubject);

  // Session cleanup state
  const [cleanupMinutes, setCleanupMinutes] = useState<string>('30');

  const handleQuestionImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setQuestionImageFile(file);

    // Create preview immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      setQuestionImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    toast.success('Question image selected successfully!');
  };

  const handleRemoveQuestionImage = () => {
    setQuestionImageFile(null);
    setQuestionImagePreview(null);
    setUploadProgress(0);
    if (questionImageInputRef.current) {
      questionImageInputRef.current.value = '';
    }
    toast.info('Question image removed');
  };

  const handleOptionImageSelect = (optionIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Create preview immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      const newOptions = [...options];
      newOptions[optionIndex] = {
        ...newOptions[optionIndex],
        imageFile: file,
        imagePreview: event.target?.result as string,
      };
      setOptions(newOptions);
    };
    reader.readAsDataURL(file);
    
    toast.success(`Option ${optionIndex + 1} image selected successfully!`);
  };

  const handleRemoveOptionImage = (optionIndex: number) => {
    const newOptions = [...options];
    newOptions[optionIndex] = {
      ...newOptions[optionIndex],
      imageFile: null,
      imagePreview: null,
    };
    setOptions(newOptions);
    
    if (optionImageInputRefs.current[optionIndex]) {
      optionImageInputRefs.current[optionIndex]!.value = '';
    }
    
    toast.info(`Option ${optionIndex + 1} image removed`);
  };

  const handleOptionTextChange = (optionIndex: number, text: string) => {
    const newOptions = [...options];
    newOptions[optionIndex] = {
      ...newOptions[optionIndex],
      text,
    };
    setOptions(newOptions);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    // Relaxed validation: Allow image-only questions
    const hasQuestionText = questionForm.questionText.trim().length > 0;
    const hasQuestionImage = questionImageFile !== null;
    const hasOptions = options.some(opt => opt.text.trim().length > 0 || opt.imageFile !== null);

    if (!hasQuestionText && !hasQuestionImage) {
      toast.error('Please provide either question text or question image');
      return;
    }

    if (!hasOptions) {
      toast.error('Please provide at least one option (text or image)');
      return;
    }

    try {
      let questionImageBlob: ExternalBlob | null = null;

      // Convert question image file to ExternalBlob if present
      if (questionImageFile) {
        const arrayBuffer = await questionImageFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        questionImageBlob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });
      }

      // Convert options to Option type with images
      const optionsWithImages: QuestionOption[] = [];
      
      for (const opt of options) {
        // Skip completely empty options
        if (!opt.text.trim() && !opt.imageFile) continue;
        
        let optionImageBlob: ExternalBlob | undefined = undefined;
        if (opt.imageFile) {
          const arrayBuffer = await opt.imageFile.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          optionImageBlob = ExternalBlob.fromBytes(uint8Array);
        }

        optionsWithImages.push({
          text: opt.text || '',
          image: optionImageBlob,
        });
      }

      // Ensure we have at least 2 options
      if (optionsWithImages.length < 2) {
        toast.error('Please provide at least two options');
        return;
      }

      await addQuestion.mutateAsync({
        subject: questionForm.subject,
        chapter: questionForm.chapter,
        difficulty: questionForm.difficulty,
        questionText: questionForm.questionText || '',
        options: optionsWithImages,
        correctAnswer: BigInt(questionForm.correctAnswer),
        explanation: questionForm.explanation || null,
        image: questionImageBlob,
        classLevel: questionForm.classLevel,
      });

      const hasImages = questionImageBlob || options.some(opt => opt.imageFile);
      toast.success(hasImages ? 'Question added successfully with images!' : 'Question added successfully!');
      
      // Reset form
      setQuestionForm({
        subject: 'Physics',
        chapter: '',
        difficulty: 'medium',
        questionText: '',
        correctAnswer: '0',
        explanation: '',
        classLevel: TestType.class11,
      });
      setOptions([
        { text: '', imageFile: null, imagePreview: null },
        { text: '', imageFile: null, imagePreview: null },
        { text: '', imageFile: null, imagePreview: null },
        { text: '', imageFile: null, imagePreview: null },
      ]);
      handleRemoveQuestionImage();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add question');
    }
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!testForm.name || !testForm.chapters) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (selectedQuestionIds.length === 0) {
      toast.error('Please select at least one question from the gallery');
      return;
    }

    try {
      await createTest.mutateAsync({
        name: testForm.name,
        subject: testForm.subject,
        chapters: testForm.chapters.split(',').map((c) => c.trim()),
        testType: testForm.testType,
        durationMinutes: BigInt(testForm.durationMinutes),
        totalQuestions: BigInt(testForm.totalQuestions),
        markingScheme: {
          correctMarks: parseFloat(testForm.correctMarks),
          incorrectPenalty: parseFloat(testForm.incorrectPenalty),
        },
        questions: selectedQuestionIds,
        sectionType: testForm.sectionType,
      });

      toast.success('Test created successfully with selected questions!');
      
      // Reset form
      setTestForm({
        name: '',
        subject: 'Physics',
        testType: TestType.class11,
        chapters: '',
        durationMinutes: '60',
        totalQuestions: '50',
        correctMarks: '1',
        incorrectPenalty: '0',
        sectionType: null,
      });
      setSelectedQuestionIds([]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create test');
    }
  };

  const handleCleanupSessions = async () => {
    try {
      const minutes = BigInt(cleanupMinutes);
      const cleanedCount = await cleanupSessions.mutateAsync(minutes);
      toast.success(`Cleaned up ${cleanedCount.toString()} stale sessions`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to cleanup sessions');
    }
  };

  const handleDeleteTest = (testId: bigint, testName: string) => {
    setTestToDelete({ id: testId, name: testName });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTest = async () => {
    if (!testToDelete) return;

    try {
      await deleteTest.mutateAsync(testToDelete.id);
      toast.success(`Test "${testToDelete.name}" deleted successfully`);
      setDeleteDialogOpen(false);
      setTestToDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete test');
    }
  };

  const handlePublishTest = (testId: bigint, testName: string) => {
    setTestToPublish({ id: testId, name: testName });
    setPublishDialogOpen(true);
  };

  const confirmPublishTest = async () => {
    if (!testToPublish) return;

    try {
      await publishTest.mutateAsync(testToPublish.id);
      toast.success(`Test "${testToPublish.name}" published successfully and is now visible to students`);
      setPublishDialogOpen(false);
      setTestToPublish(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to publish test');
    }
  };

  const handleStopTest = (testId: bigint, testName: string) => {
    setTestToStop({ id: testId, name: testName });
    setStopDialogOpen(true);
  };

  const confirmStopTest = async () => {
    if (!testToStop) return;

    try {
      await stopTest.mutateAsync(testToStop.id);
      toast.success(`Test "${testToStop.name}" stopped successfully and marked as finished`);
      setStopDialogOpen(false);
      setTestToStop(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to stop test');
    }
  };

  const handleViewQuestionDetails = (testId: bigint, testName: string) => {
    setSelectedTestForDetails({ id: testId, name: testName });
    setQuestionDetailsOpen(true);
  };

  const handleMoveTestUp = async (index: number) => {
    if (!orderedTests || index === 0) return;

    const newOrder = [...orderedTests];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    
    try {
      await reorderTests.mutateAsync(newOrder.map(t => t.id));
      toast.success('Test order updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reorder tests');
    }
  };

  const handleMoveTestDown = async (index: number) => {
    if (!orderedTests || index === orderedTests.length - 1) return;

    const newOrder = [...orderedTests];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    
    try {
      await reorderTests.mutateAsync(newOrder.map(t => t.id));
      toast.success('Test order updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reorder tests');
    }
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleString();
  };

  const calculateSessionDuration = (startTime: bigint) => {
    const now = Date.now() * 1_000_000;
    const duration = Number(BigInt(now) - startTime) / 1_000_000_000;
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}m ${seconds}s`;
  };

  const getTestTypeLabel = (testType: TestType): string => {
    switch (testType) {
      case TestType.class11:
        return 'Class 11th';
      case TestType.class12:
        return 'Class 12th';
      case TestType.completeSyllabus:
        return 'Complete Syllabus';
      default:
        return 'Unknown';
    }
  };

  // Update test form when test type changes to set appropriate marking scheme
  const handleTestTypeChange = (testType: TestType) => {
    setTestForm(prev => {
      // For Complete Syllabus, set default marking and duration
      if (testType === TestType.completeSyllabus) {
        return {
          ...prev,
          testType,
          correctMarks: '1', // Will be overridden per subject
          incorrectPenalty: '0', // No negative marking for CET
          durationMinutes: '90',
          totalQuestions: '50',
        };
      }
      // For class-specific tests, use default marking
      return {
        ...prev,
        testType,
        correctMarks: '1',
        incorrectPenalty: '0',
      };
    });
  };

  // Update marking scheme when subject changes for CET exam
  const handleSubjectChange = (subject: string) => {
    setTestForm(prev => {
      // For Complete Syllabus tests, set subject-specific marking
      if (prev.testType === TestType.completeSyllabus) {
        if (subject === 'Mathematics') {
          return {
            ...prev,
            subject,
            correctMarks: '2', // 2 marks for Maths
            incorrectPenalty: '0',
          };
        } else {
          return {
            ...prev,
            subject,
            correctMarks: '1', // 1 mark for Physics/Chemistry
            incorrectPenalty: '0',
          };
        }
      }
      return { ...prev, subject };
    });
  };

  // Filter tests based on selected filter
  const filteredTests = orderedTests?.filter(test => {
    if (testFilter === 'all') return true;
    if (testFilter === 'class11') return test.testType === TestType.class11;
    if (testFilter === 'class12') return test.testType === TestType.class12;
    if (testFilter === 'completeSyllabus') return test.testType === TestType.completeSyllabus;
    return true;
  }) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header onNavigate={onNavigate} currentView="admin" />
      
      <main className="flex-1 container py-6 sm:py-8 px-4 sm:px-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-text-primary">Admin Panel</h1>
          <p className="text-sm sm:text-base text-text-secondary">Manage questions, tests, users, and monitor system performance</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <CardDescription className="text-xs sm:text-sm text-text-secondary">Total Questions</CardDescription>
              </div>
              <CardTitle className="text-2xl sm:text-3xl text-text-primary">{questionCount?.toString() || '0'}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <CardDescription className="text-xs sm:text-sm text-text-secondary">Total Tests</CardDescription>
              </div>
              <CardTitle className="text-2xl sm:text-3xl text-text-primary">{testCount?.toString() || '0'}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <CardDescription className="text-xs sm:text-sm text-text-secondary">Total Users</CardDescription>
              </div>
              <CardTitle className="text-2xl sm:text-3xl text-text-primary">{userCount?.toString() || '0'}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                <CardDescription className="text-xs sm:text-sm text-text-secondary">Active Sessions</CardDescription>
              </div>
              <CardTitle className="text-2xl sm:text-3xl text-success">{systemMetrics?.activeSessionCount.toString() || '0'}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Forms */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl text-text-primary">Content Management & System Monitoring</CardTitle>
            <CardDescription className="text-xs sm:text-sm text-text-secondary">Add questions with LaTeX support, create tests, manage users, and monitor system performance</CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <Tabs defaultValue="questions">
              <TabsList className="grid w-full grid-cols-6 h-auto bg-muted">
                <TabsTrigger value="questions" className="text-xs sm:text-sm py-2">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Question
                </TabsTrigger>
                <TabsTrigger value="tests" className="text-xs sm:text-sm py-2">Create Test</TabsTrigger>
                <TabsTrigger value="manage" className="text-xs sm:text-sm py-2">
                  <Settings className="w-4 h-4 mr-1" />
                  Manage
                </TabsTrigger>
                <TabsTrigger value="gallery" className="text-xs sm:text-sm py-2">
                  <Eye className="w-4 h-4 mr-1" />
                  Gallery
                </TabsTrigger>
                <TabsTrigger value="users" className="text-xs sm:text-sm py-2">
                  <UserCog className="w-4 h-4 mr-1" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="monitoring" className="text-xs sm:text-sm py-2">
                  <Server className="w-4 h-4 mr-1" />
                  Monitor
                </TabsTrigger>
              </TabsList>

              {/* Add Question Tab */}
              <TabsContent value="questions" className="space-y-4 mt-4 sm:mt-6">
                <form onSubmit={handleAddQuestion} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-xs sm:text-sm text-text-primary">Subject *</Label>
                      <Select
                        value={questionForm.subject}
                        onValueChange={(value) => setQuestionForm({ ...questionForm, subject: value })}
                      >
                        <SelectTrigger className="h-10 sm:h-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Physics">Physics</SelectItem>
                          <SelectItem value="Chemistry">Chemistry</SelectItem>
                          <SelectItem value="Mathematics">Mathematics</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="chapter" className="text-xs sm:text-sm text-text-primary">Chapter *</Label>
                      <Input
                        id="chapter"
                        value={questionForm.chapter}
                        onChange={(e) => setQuestionForm({ ...questionForm, chapter: e.target.value })}
                        placeholder="e.g., Mechanics"
                        required
                        className="h-10 sm:h-auto"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="difficulty" className="text-xs sm:text-sm text-text-primary">Difficulty *</Label>
                      <Select
                        value={questionForm.difficulty}
                        onValueChange={(value) => setQuestionForm({ ...questionForm, difficulty: value })}
                      >
                        <SelectTrigger className="h-10 sm:h-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="classLevel" className="text-xs sm:text-sm text-text-primary">Class Level *</Label>
                      <Select
                        value={questionForm.classLevel}
                        onValueChange={(value) => setQuestionForm({ ...questionForm, classLevel: value as TestType })}
                      >
                        <SelectTrigger className="h-10 sm:h-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TestType.class11}>Class 11th</SelectItem>
                          <SelectItem value={TestType.class12}>Class 12th</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="questionText" className="text-xs sm:text-sm text-text-primary">
                      Question Text (LaTeX supported: use $...$ for inline, $$...$$ for display)
                    </Label>
                    <Textarea
                      id="questionText"
                      value={questionForm.questionText}
                      onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                      placeholder="e.g., What is the value of $E = mc^2$ when... (Optional if image is provided)"
                      rows={4}
                      className="font-mono text-sm"
                    />
                    {questionForm.questionText && (
                      <div className="p-3 rounded-md border bg-muted/50">
                        <p className="text-xs text-text-secondary mb-2">Preview:</p>
                        <MathContent content={questionForm.questionText} />
                      </div>
                    )}
                  </div>

                  {/* Question Image Upload */}
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm text-text-primary">Question Image (Optional, but required if no text)</Label>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Input
                          ref={questionImageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleQuestionImageSelect}
                          className="h-10 sm:h-auto"
                        />
                        {questionImageFile && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveQuestionImage}
                            className="shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {questionImagePreview && (
                        <div className="relative w-full max-w-md">
                          <img
                            src={questionImagePreview}
                            alt="Question preview"
                            className="w-full h-auto max-h-[300px] object-contain rounded-md border"
                          />
                        </div>
                      )}
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <Progress value={uploadProgress} className="w-full" />
                      )}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    <Label className="text-xs sm:text-sm text-text-primary">Options (LaTeX supported, at least 2 required) *</Label>
                    {options.map((option, index) => (
                      <div key={index} className="space-y-2 p-3 rounded-md border bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs font-semibold min-w-[80px]">Option {index + 1}</Label>
                          {index < 2 && <Badge variant="outline" className="text-xs">Required</Badge>}
                        </div>
                        <Textarea
                          value={option.text}
                          onChange={(e) => handleOptionTextChange(index, e.target.value)}
                          placeholder={`e.g., $x = ${index + 1}$ (Optional if image is provided)`}
                          rows={2}
                          className="font-mono text-sm"
                        />
                        {option.text && (
                          <div className="p-2 rounded-md border bg-background/50">
                            <p className="text-xs text-text-secondary mb-1">Preview:</p>
                            <MathContent content={option.text} />
                          </div>
                        )}
                        
                        {/* Option Image Upload */}
                        <div className="space-y-2">
                          <Label className="text-xs text-text-secondary">Option Image (Optional)</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              ref={(el) => {
                                optionImageInputRefs.current[index] = el;
                              }}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleOptionImageSelect(index, e)}
                              className="h-9 text-xs"
                            />
                            {option.imageFile && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveOptionImage(index)}
                                className="shrink-0"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                          {option.imagePreview && (
                            <div className="relative w-full max-w-xs">
                              <img
                                src={option.imagePreview}
                                alt={`Option ${index + 1} preview`}
                                className="w-full h-auto max-h-[150px] object-contain rounded-md border"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="correctAnswer" className="text-xs sm:text-sm text-text-primary">Correct Answer *</Label>
                    <Select
                      value={questionForm.correctAnswer}
                      onValueChange={(value) => setQuestionForm({ ...questionForm, correctAnswer: value })}
                    >
                      <SelectTrigger className="h-10 sm:h-auto">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Option 1</SelectItem>
                        <SelectItem value="1">Option 2</SelectItem>
                        <SelectItem value="2">Option 3</SelectItem>
                        <SelectItem value="3">Option 4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="explanation" className="text-xs sm:text-sm text-text-primary">
                      Explanation (Optional, LaTeX supported)
                    </Label>
                    <Textarea
                      id="explanation"
                      value={questionForm.explanation}
                      onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                      placeholder="Explain the correct answer..."
                      rows={3}
                      className="font-mono text-sm"
                    />
                    {questionForm.explanation && (
                      <div className="p-3 rounded-md border bg-muted/50">
                        <p className="text-xs text-text-secondary mb-2">Preview:</p>
                        <MathContent content={questionForm.explanation} />
                      </div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={addQuestion.isPending} 
                    className="gap-2 w-full sm:w-auto h-12 sm:h-auto"
                  >
                    {addQuestion.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding Question...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Question
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Create Test Tab */}
              <TabsContent value="tests" className="space-y-4 mt-4 sm:mt-6">
                <form onSubmit={handleCreateTest} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="testName" className="text-xs sm:text-sm text-text-primary">Test Name *</Label>
                    <Input
                      id="testName"
                      value={testForm.name}
                      onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                      placeholder="e.g., Physics Class 11 Chapter 1 Test"
                      required
                      className="h-10 sm:h-auto"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="testSubject" className="text-xs sm:text-sm text-text-primary">Subject *</Label>
                      <Select
                        value={testForm.subject}
                        onValueChange={handleSubjectChange}
                      >
                        <SelectTrigger className="h-10 sm:h-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Physics">Physics</SelectItem>
                          <SelectItem value="Chemistry">Chemistry</SelectItem>
                          <SelectItem value="Mathematics">Mathematics</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="testType" className="text-xs sm:text-sm text-text-primary">Test Type *</Label>
                      <Select
                        value={testForm.testType}
                        onValueChange={(value) => handleTestTypeChange(value as TestType)}
                      >
                        <SelectTrigger className="h-10 sm:h-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TestType.class11}>Class 11th</SelectItem>
                          <SelectItem value={TestType.class12}>Class 12th</SelectItem>
                          <SelectItem value={TestType.completeSyllabus}>Complete Syllabus Mock Test</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {testForm.testType === TestType.completeSyllabus && (
                    <div className="p-4 rounded-lg bg-info/10 border border-info/30">
                      <p className="text-sm text-text-primary font-medium mb-2">MHT-CET Exam Configuration</p>
                      <ul className="text-xs text-text-secondary space-y-1">
                        <li>• Physics & Chemistry: 1 mark each, no negative marking</li>
                        <li>• Mathematics: 2 marks each, no negative marking</li>
                        <li>• Create separate tests for each section with 90 minutes duration</li>
                        <li>• Section 1: Physics + Chemistry (50 questions each)</li>
                        <li>• Section 2: Mathematics (50 questions)</li>
                      </ul>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="chapters" className="text-xs sm:text-sm text-text-primary">Chapters (comma-separated) *</Label>
                    <Input
                      id="chapters"
                      value={testForm.chapters}
                      onChange={(e) => setTestForm({ ...testForm, chapters: e.target.value })}
                      placeholder="e.g., Mechanics, Thermodynamics"
                      required
                      className="h-10 sm:h-auto"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-xs sm:text-sm text-text-primary">Duration (minutes) *</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={testForm.durationMinutes}
                        onChange={(e) => setTestForm({ ...testForm, durationMinutes: e.target.value })}
                        required
                        className="h-10 sm:h-auto"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalQuestions" className="text-xs sm:text-sm text-text-primary">Total Questions *</Label>
                      <Input
                        id="totalQuestions"
                        type="number"
                        value={testForm.totalQuestions}
                        onChange={(e) => setTestForm({ ...testForm, totalQuestions: e.target.value })}
                        required
                        className="h-10 sm:h-auto"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="correctMarks" className="text-xs sm:text-sm text-text-primary">
                        Marks for Correct Answer *
                        {testForm.testType === TestType.completeSyllabus && (
                          <span className="text-xs text-info ml-2">
                            ({testForm.subject === 'Mathematics' ? '2 marks for Maths' : '1 mark for Phy/Chem'})
                          </span>
                        )}
                      </Label>
                      <Input
                        id="correctMarks"
                        type="number"
                        step="0.1"
                        value={testForm.correctMarks}
                        onChange={(e) => setTestForm({ ...testForm, correctMarks: e.target.value })}
                        required
                        className="h-10 sm:h-auto"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="incorrectPenalty" className="text-xs sm:text-sm text-text-primary">
                        Penalty for Incorrect *
                        {testForm.testType === TestType.completeSyllabus && (
                          <span className="text-xs text-success ml-2">(No negative marking for CET)</span>
                        )}
                      </Label>
                      <Input
                        id="incorrectPenalty"
                        type="number"
                        step="0.1"
                        value={testForm.incorrectPenalty}
                        onChange={(e) => setTestForm({ ...testForm, incorrectPenalty: e.target.value })}
                        required
                        className="h-10 sm:h-auto"
                      />
                    </div>
                  </div>

                  {/* Question Gallery Selection */}
                  <div className="space-y-3 p-4 sm:p-5 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary flex items-center justify-center">
                        <Library className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <Label className="text-sm sm:text-base font-bold text-text-primary block">
                          Select Questions from Gallery *
                        </Label>
                        <p className="text-xs text-text-secondary">
                          {selectedQuestionIds.length > 0 
                            ? `${selectedQuestionIds.length} question${selectedQuestionIds.length > 1 ? 's' : ''} selected`
                            : 'Browse and select questions for this test'}
                        </p>
                      </div>
                    </div>

                    <QuestionGallery
                      onSelectionChange={setSelectedQuestionIds}
                      initialSelection={selectedQuestionIds}
                    />
                  </div>

                  <Button type="submit" disabled={createTest.isPending || selectedQuestionIds.length === 0} className="gap-2 w-full sm:w-auto h-12 sm:h-auto">
                    <Plus className="w-4 h-4" />
                    {createTest.isPending ? 'Creating...' : 'Create Test'}
                  </Button>
                </form>
              </TabsContent>

              {/* Manage Tests Tab */}
              <TabsContent value="manage" className="space-y-4 mt-4 sm:mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <h3 className="text-base sm:text-lg font-semibold text-text-primary">Test Management</h3>
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-text-secondary" />
                      <Select value={testFilter} onValueChange={(value: any) => setTestFilter(value)}>
                        <SelectTrigger className="w-[180px] h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Tests</SelectItem>
                          <SelectItem value="class11">Class 11th</SelectItem>
                          <SelectItem value="class12">Class 12th</SelectItem>
                          <SelectItem value="completeSyllabus">Complete Syllabus</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge variant="outline" className="text-xs">
                        {filteredTests.length} Tests
                      </Badge>
                    </div>
                  </div>

                  {!filteredTests || filteredTests.length === 0 ? (
                    <div className="text-center py-12 text-text-secondary">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>{testFilter === 'all' ? 'No tests created yet' : `No ${testFilter === 'class11' ? 'Class 11th' : testFilter === 'class12' ? 'Class 12th' : 'Complete Syllabus'} tests found`}</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[600px] pr-4">
                      <div className="space-y-3">
                        {filteredTests.map((test, index) => (
                          <Card key={test.id.toString()} className="bg-card border-border">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="flex flex-col gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMoveTestUp(orderedTests?.findIndex(t => t.id === test.id) || 0)}
                                    disabled={orderedTests?.findIndex(t => t.id === test.id) === 0}
                                    className="h-6 w-6 p-0"
                                  >
                                    <ChevronUp className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMoveTestDown(orderedTests?.findIndex(t => t.id === test.id) || 0)}
                                    disabled={orderedTests?.findIndex(t => t.id === test.id) === (orderedTests?.length || 0) - 1}
                                    className="h-6 w-6 p-0"
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </Button>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-sm sm:text-base text-text-primary truncate">
                                        {test.name}
                                      </h4>
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs">
                                          {test.subject}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {getTestTypeLabel(test.testType)}
                                        </Badge>
                                        {test.isPublished ? (
                                          <Badge className="text-xs bg-success">Published</Badge>
                                        ) : (
                                          <Badge variant="secondary" className="text-xs">Draft</Badge>
                                        )}
                                        {test.isStopped && (
                                          <Badge variant="destructive" className="text-xs">Stopped</Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-text-secondary mb-3">
                                    <div>
                                      <span className="font-medium">Questions:</span> {test.questions.length}
                                    </div>
                                    <div>
                                      <span className="font-medium">Duration:</span> {test.durationMinutes.toString()}m
                                    </div>
                                    <div>
                                      <span className="font-medium">Marks:</span> +{test.markingScheme.correctMarks} / -{test.markingScheme.incorrectPenalty}
                                    </div>
                                    <div>
                                      <span className="font-medium">Chapters:</span> {test.chapters.length}
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handlePublishTest(test.id, test.name)}
                                      className="gap-1"
                                    >
                                      <Play className="w-3 h-3" />
                                      {test.isPublished && test.isStopped ? 'Republish' : 'Publish'}
                                    </Button>
                                    {test.isPublished && !test.isStopped && (
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleStopTest(test.id, test.name)}
                                        className="gap-1"
                                      >
                                        <StopCircle className="w-3 h-3" />
                                        Stop
                                      </Button>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewQuestionDetails(test.id, test.name)}
                                      className="gap-1"
                                    >
                                      <FileQuestion className="w-3 h-3" />
                                      View Questions
                                    </Button>
                                    {allUsersWithAttempts && allUsersWithAttempts.length > 0 && (
                                      <PerTestResultPDFExport
                                        test={test}
                                        usersWithAttempts={allUsersWithAttempts}
                                      />
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteTest(test.id, test.name)}
                                      className="gap-1 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </TabsContent>

              {/* Question Gallery Tab */}
              <TabsContent value="gallery" className="space-y-4 mt-4 sm:mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold text-text-primary">Question Gallery</h3>
                    <Badge variant="outline" className="text-xs">
                      {questionCount?.toString() || '0'} Questions
                    </Badge>
                  </div>

                  <QuestionGallery
                    onSelectionChange={() => {}}
                    initialSelection={[]}
                  />
                </div>
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-4 mt-4 sm:mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold text-text-primary">User Management</h3>
                    <Badge variant="outline" className="text-xs">
                      {userCount?.toString() || '0'} Users
                    </Badge>
                  </div>

                  <UserManagement />

                  {allUsersWithAttempts && allUsersWithAttempts.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-3">
                      <ResultListPDFExport usersWithAttempts={allUsersWithAttempts} />
                      <AverageResultPDFExport usersWithAttempts={allUsersWithAttempts} />
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Monitoring Tab */}
              <TabsContent value="monitoring" className="space-y-4 mt-4 sm:mt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-4">System Metrics</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="bg-card border-border">
                        <CardHeader className="pb-3">
                          <CardDescription className="text-xs text-text-secondary">Active Sessions</CardDescription>
                          <CardTitle className="text-2xl text-success">
                            {systemMetrics?.activeSessionCount.toString() || '0'}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      <Card className="bg-card border-border">
                        <CardHeader className="pb-3">
                          <CardDescription className="text-xs text-text-secondary">Total Users</CardDescription>
                          <CardTitle className="text-2xl text-text-primary">
                            {systemMetrics?.totalUsers.toString() || '0'}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      <Card className="bg-card border-border">
                        <CardHeader className="pb-3">
                          <CardDescription className="text-xs text-text-secondary">Total Questions</CardDescription>
                          <CardTitle className="text-2xl text-text-primary">
                            {systemMetrics?.totalQuestions.toString() || '0'}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      <Card className="bg-card border-border">
                        <CardHeader className="pb-3">
                          <CardDescription className="text-xs text-text-secondary">Total Tests</CardDescription>
                          <CardTitle className="text-2xl text-text-primary">
                            {systemMetrics?.totalTests.toString() || '0'}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-4">Active Sessions</h3>
                    {!activeSessions || activeSessions.length === 0 ? (
                      <Card className="bg-card border-border">
                        <CardContent className="py-12 text-center text-text-secondary">
                          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No active sessions</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                          {activeSessions.map((session) => (
                            <Card key={session.userId.toString()} className="bg-card border-border">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium text-text-primary">
                                      User: {session.userId.toString().slice(0, 8)}...
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                      Test ID: {session.testId.toString()}
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                      Duration: {calculateSessionDuration(session.startTime)}
                                    </p>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    <Activity className="w-3 h-3 mr-1" />
                                    Active
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-4">Session Cleanup</h3>
                    <Card className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex-1">
                            <Label htmlFor="cleanupMinutes" className="text-xs text-text-secondary mb-2 block">
                              Cleanup sessions idle for (minutes):
                            </Label>
                            <Input
                              id="cleanupMinutes"
                              type="number"
                              value={cleanupMinutes}
                              onChange={(e) => setCleanupMinutes(e.target.value)}
                              placeholder="30"
                              className="h-10"
                            />
                          </div>
                          <Button
                            onClick={handleCleanupSessions}
                            disabled={cleanupSessions.isPending}
                            className="gap-2 sm:mt-6"
                          >
                            {cleanupSessions.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Cleaning...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4" />
                                Cleanup Sessions
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{testToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTest} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Confirmation Dialog */}
      <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Test</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to publish "{testToPublish?.name}"? It will become visible to all students.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPublishTest}>
              Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stop Confirmation Dialog */}
      <AlertDialog open={stopDialogOpen} onOpenChange={setStopDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop Test</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to stop "{testToStop?.name}"? It will be marked as finished and students won't be able to take it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStopTest} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Stop Test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Question Details Dialog */}
      <QuestionDetailsDialog
        open={questionDetailsOpen}
        onOpenChange={setQuestionDetailsOpen}
        testName={selectedTestForDetails?.name || ''}
        questions={testQuestionsData?.questions || []}
      />

      <Footer />
    </div>
  );
}
