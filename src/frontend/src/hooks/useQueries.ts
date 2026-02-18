import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { UserProfile, Question, TestConfig, TestAttempt, TestStatus, SectionType, Comment, LeaderboardEntry, OverallLeaderboardEntry } from '../types/local';
import type { UserProfile as BackendUserProfile, Comment as BackendComment, Suggestion, TestConfig as BackendTestConfig, TestStatus as BackendTestStatus, Question as BackendQuestion, TestType as BackendTestType } from '../backend';
import { ExternalBlob, TestType as BackendTestTypeEnum } from '../backend';
import { toast } from 'sonner';

// Helper to convert local TestType string to backend TestType enum
function convertTestTypeToBackend(testType: string): BackendTestType {
  switch (testType) {
    case 'class11':
      return BackendTestTypeEnum.class11;
    case 'class12':
      return BackendTestTypeEnum.class12;
    case 'completeSyllabus':
      return BackendTestTypeEnum.completeSyllabus;
    default:
      return BackendTestTypeEnum.class12;
  }
}

// Helper to convert backend TestType enum to local string
function convertTestTypeToLocal(testType: BackendTestType): string {
  return testType as string;
}

// Helper function to convert backend UserProfile to local UserProfile
function convertBackendProfileToLocal(backendProfile: BackendUserProfile): UserProfile {
  return {
    id: backendProfile.id.toString(),
    fullName: backendProfile.fullName,
    email: backendProfile.email,
    mobileNumber: backendProfile.mobileNumber,
    testAttempts: backendProfile.testAttempts.map(attempt => ({
      userId: attempt.userId.toString(),
      testId: attempt.testId,
      answers: attempt.answers,
      score: attempt.score,
      timeTaken: attempt.timeTaken,
      submittedAt: attempt.submittedAt,
    })),
    createdAt: backendProfile.createdAt,
    lastLogin: backendProfile.lastLogin,
    isYouTubeVerified: backendProfile.isYouTubeVerified,
    youtubeVerificationTimestamp: backendProfile.youtubeVerificationTimestamp ?? null,
    isBlocked: backendProfile.isBlocked,
    blockTimestamp: backendProfile.blockTimestamp ?? null,
  };
}

// Helper function to convert local UserProfile to backend UserProfile
function convertLocalProfileToBackend(localProfile: Omit<UserProfile, 'id' | 'testAttempts' | 'createdAt' | 'lastLogin'>, callerPrincipal: any): BackendUserProfile {
  return {
    id: callerPrincipal,
    fullName: localProfile.fullName,
    email: localProfile.email,
    mobileNumber: localProfile.mobileNumber,
    testAttempts: [],
    createdAt: BigInt(Date.now()) * 1_000_000n,
    lastLogin: BigInt(Date.now()) * 1_000_000n,
    isYouTubeVerified: localProfile.isYouTubeVerified,
    youtubeVerificationTimestamp: localProfile.youtubeVerificationTimestamp !== null ? localProfile.youtubeVerificationTimestamp : undefined,
    isBlocked: localProfile.isBlocked,
    blockTimestamp: localProfile.blockTimestamp !== null ? localProfile.blockTimestamp : undefined,
  };
}

// Helper function to convert backend Comment to local Comment
function convertBackendCommentToLocal(backendComment: BackendComment): Comment {
  return {
    id: backendComment.id,
    questionId: backendComment.questionId,
    userId: backendComment.userId.toString(),
    text: backendComment.text,
    timestamp: backendComment.timestamp,
  };
}

// Helper function to convert backend TestConfig to local TestConfig
function convertBackendTestConfigToLocal(backendConfig: BackendTestConfig): TestConfig {
  return {
    id: backendConfig.id,
    name: backendConfig.name,
    subject: backendConfig.subject,
    chapters: backendConfig.chapters,
    testType: convertTestTypeToLocal(backendConfig.testType),
    durationMinutes: backendConfig.durationMinutes,
    totalQuestions: backendConfig.totalQuestions,
    markingScheme: {
      correctMarks: Number(backendConfig.markingScheme.correctMarks),
      incorrectPenalty: Number(backendConfig.markingScheme.incorrectPenalty),
      penaltyOption: backendConfig.markingScheme.penaltyOption ?? null,
    },
    questions: backendConfig.questions,
    createdBy: backendConfig.createdBy.toString(),
    createdAt: backendConfig.createdAt,
    updatedAt: backendConfig.updatedAt ?? null,
    isPublished: backendConfig.isPublished,
    isStopped: backendConfig.isStopped,
    startTime: backendConfig.startTime ?? null,
    endTime: backendConfig.endTime ?? null,
    sectionType: (backendConfig.sectionType as SectionType | undefined) ?? null,
  };
}

// Helper function to convert backend Question to local Question
function convertBackendQuestionToLocal(backendQuestion: BackendQuestion): Question {
  return {
    id: backendQuestion.id,
    subject: backendQuestion.subject,
    chapter: backendQuestion.chapter,
    difficulty: backendQuestion.difficulty,
    questionText: backendQuestion.questionText,
    options: backendQuestion.options.map(opt => ({
      text: opt.text,
      image: opt.image ?? undefined,
    })),
    correctAnswer: backendQuestion.correctAnswer,
    explanation: backendQuestion.explanation ?? undefined,
    image: backendQuestion.image ?? undefined,
    createdBy: backendQuestion.createdBy.toString(),
    createdAt: backendQuestion.createdAt,
    updatedAt: backendQuestion.updatedAt ?? undefined,
    classLevel: convertTestTypeToLocal(backendQuestion.classLevel),
  };
}

export function useGetCallerUserProfile() {
  const { actor, isFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const result = await actor.getCallerUserProfile();
        if (!result) return null;
        return convertBackendProfileToLocal(result);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: isFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: Omit<UserProfile, 'id' | 'testAttempts' | 'createdAt' | 'lastLogin'>) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Identity not available');
      
      // Get the authenticated principal from Internet Identity
      const callerPrincipal = identity.getPrincipal();
      const backendProfile = convertLocalProfileToBackend(profile, callerPrincipal);
      
      const savedProfile = await actor.saveCallerUserProfile(backendProfile);
      return convertBackendProfileToLocal(savedProfile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save profile');
    },
  });
}

export function useGetCallerRole() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['callerRole'],
    queryFn: async () => {
      if (!actor) return 'guest';
      try {
        return await actor.getCallerUserRole();
      } catch (error) {
        console.error('Error fetching user role:', error);
        return 'guest';
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useGetTestConfigsWithStatus() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<Array<[TestConfig, TestStatus]>>({
    queryKey: ['testConfigsWithStatus'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const result = await actor.getAllTestConfigsWithStatus();
        return result.map(([config, status]) => [
          convertBackendTestConfigToLocal(config),
          status as TestStatus
        ]);
      } catch (error) {
        console.error('Error fetching test configs:', error);
        throw error;
      }
    },
    enabled: !!actor && !actorFetching,
    staleTime: 30000,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetching: actorFetching || query.isFetching,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetOrderedTestConfigs() {
  const { actor, isFetching } = useActor();

  return useQuery<TestConfig[]>({
    queryKey: ['orderedTestConfigs'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const result = await actor.getAllTestConfigsWithStatus();
        return result.map(([config]) => convertBackendTestConfigToLocal(config));
      } catch (error) {
        console.error('Error fetching ordered test configs:', error);
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useCreateTestConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: any) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Method not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testConfigsWithStatus'] });
      queryClient.invalidateQueries({ queryKey: ['orderedTestConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['testConfigCount'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create test config');
    },
  });
}

export function useDeleteTestConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (testId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Method not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testConfigsWithStatus'] });
      queryClient.invalidateQueries({ queryKey: ['orderedTestConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['testConfigCount'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete test config');
    },
  });
}

export function useReorderTestConfigs() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newOrder: bigint[]) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Method not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orderedTestConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['testConfigsWithStatus'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reorder test configs');
    },
  });
}

export function usePublishTestConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (testId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Method not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testConfigsWithStatus'] });
      queryClient.invalidateQueries({ queryKey: ['orderedTestConfigs'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to publish test config');
    },
  });
}

export function useStopTestConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (testId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Method not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testConfigsWithStatus'] });
      queryClient.invalidateQueries({ queryKey: ['orderedTestConfigs'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to stop test config');
    },
  });
}

export function useGetQuestionsBySubject(subject: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Question[]>({
    queryKey: ['questionsBySubject', subject],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        const backendQuestions = await actor.listQuestionsBySubject(subject);
        return backendQuestions.map(convertBackendQuestionToLocal);
      } catch (error) {
        console.error('Error fetching questions by subject:', error);
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !!subject,
    retry: false,
  });
}

export function useCreateQuestion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      subject: string;
      chapter: string;
      difficulty: string;
      questionText: string;
      options: Array<{ text: string; image?: ExternalBlob }>;
      correctAnswer: bigint;
      explanation?: string;
      image?: ExternalBlob;
      classLevel: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      
      // Map options to backend format inline without type annotation
      const backendOptions = params.options.map(opt => ({
        text: opt.text,
        image: opt.image ?? null,
      }));

      const questionId = await actor.createQuestion(
        params.subject,
        params.chapter,
        params.difficulty,
        params.questionText,
        backendOptions,
        params.correctAnswer,
        params.explanation ?? null,
        params.image ?? null,
        convertTestTypeToBackend(params.classLevel)
      );
      
      return questionId;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['questionsBySubject', variables.subject] });
      queryClient.invalidateQueries({ queryKey: ['questionCount'] });
      toast.success('Question created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create question');
    },
  });
}

export function useUpdateQuestion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      questionId: bigint;
      subject: string;
      chapter: string;
      difficulty: string;
      questionText: string;
      options: Array<{ text: string; image?: ExternalBlob }>;
      correctAnswer: bigint;
      explanation?: string;
      image?: ExternalBlob;
      classLevel: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      
      // Map options to backend format inline without type annotation
      const backendOptions = params.options.map(opt => ({
        text: opt.text,
        image: opt.image ?? null,
      }));

      await actor.updateQuestion(
        params.questionId,
        params.subject,
        params.chapter,
        params.difficulty,
        params.questionText,
        backendOptions,
        params.correctAnswer,
        params.explanation ?? null,
        params.image ?? null,
        convertTestTypeToBackend(params.classLevel)
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['questionsBySubject', variables.subject] });
      toast.success('Question updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update question');
    },
  });
}

export function useAddQuestion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: any) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Method not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionsBySubject'] });
      queryClient.invalidateQueries({ queryKey: ['questionCount'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add question');
    },
  });
}

export function useDeleteQuestion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questionId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteQuestion(questionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionsBySubject'] });
      queryClient.invalidateQueries({ queryKey: ['questionCount'] });
      toast.success('Question deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete question');
    },
  });
}

export function useSubmitSuggestion() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: { author: string; feedback: string }) => {
      if (!actor) throw new Error('Actor not available');
      const suggestionId = await actor.submitSuggestion(params.author, params.feedback);
      return suggestionId;
    },
    onSuccess: () => {
      toast.success('Suggestion submitted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit suggestion');
    },
  });
}

export function useGetCommentsByQuestion(questionId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ['comments', questionId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const backendComments = await actor.listCommentsForQuestion(questionId);
        return backendComments.map(convertBackendCommentToLocal);
      } catch (error) {
        console.error('Error fetching comments:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function usePostComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { questionId: bigint; text: string }) => {
      if (!actor) throw new Error('Actor not available');
      const commentId = await actor.postComment(params.questionId, params.text);
      return commentId;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.questionId.toString()] });
      toast.success('Comment posted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to post comment');
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { commentId: bigint; questionId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteComment(params.commentId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.questionId.toString()] });
      toast.success('Comment deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete comment');
    },
  });
}

export function useGetLeaderboard(testId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', testId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return [];
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useGetOverallLeaderboard() {
  const { actor, isFetching } = useActor();

  return useQuery<OverallLeaderboardEntry[]>({
    queryKey: ['overallLeaderboard'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return [];
      } catch (error) {
        console.error('Error fetching overall leaderboard:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useGetAllSuggestions() {
  const { actor, isFetching } = useActor();

  return useQuery<Suggestion[]>({
    queryKey: ['allSuggestions'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        const result = await actor.listSuggestions();
        return result.suggestions;
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useDeleteSuggestion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestionId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteSuggestion(suggestionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allSuggestions'] });
      toast.success('Suggestion deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete suggestion');
    },
  });
}

export function useSetYouTubeVerified() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      await actor.setYouTubeVerified();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('YouTube subscription verified successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to verify YouTube subscription');
    },
  });
}
