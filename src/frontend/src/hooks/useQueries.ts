import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, TestConfig, Question, TestAttempt, SystemMetrics, ActiveSession, GalleryQuestionPreview, UserRole, TestStatus, SanitizedQuestion, TestType, SectionType, Comment, LeaderboardEntry, OverallLeaderboardEntry } from '../backend';
import { ExternalBlob } from '../backend';
import { Principal } from '@dfinity/principal';
import { useEffect, useRef } from 'react';

// Type aliases for cleaner code
type PublicUserProfile = UserProfile;
type PublicTestConfig = TestConfig;
type PublicQuestion = Question;
type PublicSanitizedQuestion = SanitizedQuestion;
type PublicTestAttempt = TestAttempt;
type PublicSystemMetrics = SystemMetrics;
type PublicActiveSession = ActiveSession;
type PublicGalleryQuestionPreview = GalleryQuestionPreview;
type PublicTestStatus = TestStatus;
type PublicTestType = TestType;
type PublicSectionType = SectionType;
type PublicComment = Comment;
type PublicLeaderboardEntry = LeaderboardEntry;
type PublicOverallLeaderboardEntry = OverallLeaderboardEntry;
type QuestionOption = { text: string; image?: ExternalBlob };

export interface Suggestion {
  id: bigint;
  author: string;
  feedback: string;
  timestamp: bigint;
}

export interface SuggestionsResponse {
  suggestions: Suggestion[];
  count: bigint;
}

// Optimized stale times for different data types
const STALE_TIME = {
  STATIC: 10 * 60 * 1000, // 10 minutes for rarely changing data
  DYNAMIC: 30 * 1000, // 30 seconds for frequently changing data
  REALTIME: 15 * 1000, // 15 seconds for real-time data
  LEADERBOARD: 30 * 1000, // 30 seconds for leaderboard (reduced from 20s)
};

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<PublicUserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getCallerUserProfile();
      } catch (error: any) {
        if (error.message?.includes('Not registered')) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
    staleTime: STALE_TIME.DYNAMIC,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: PublicUserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['callerRole'] });
    },
  });
}

export function useUpdateCallerMobileNumber() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mobileNumber: string) => {
      if (!actor) throw new Error('Actor not available');
      
      // Validate mobile number
      if (!mobileNumber || mobileNumber.trim().length < 10) {
        throw new Error('Please enter a valid 10-digit mobile number');
      }
      
      const cleanNumber = mobileNumber.trim();
      if (!/^\d{10}$/.test(cleanNumber)) {
        throw new Error('Mobile number must contain exactly 10 digits');
      }
      
      return actor.updateCallerMobileNumber(cleanNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetCallerRole() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['callerRole'],
    queryFn: async () => {
      if (!actor) return 'guest' as UserRole;
      try {
        return await actor.getCallerRole();
      } catch (error) {
        console.error('Error fetching caller role:', error);
        return 'guest' as UserRole;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: 1,
    staleTime: STALE_TIME.STATIC,
  });
}

export function useSetYouTubeVerified() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.setYouTubeVerified();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['activePublishedTestConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['stoppedTestConfigs'] });
    },
  });
}

export function useBlockUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.blockUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsersWithTestAttempts'] });
      queryClient.invalidateQueries({ queryKey: ['userCount'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboardByTest'] });
      queryClient.invalidateQueries({ queryKey: ['overallLeaderboard'] });
    },
  });
}

export function useUnblockUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.unblockUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsersWithTestAttempts'] });
      queryClient.invalidateQueries({ queryKey: ['userCount'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboardByTest'] });
      queryClient.invalidateQueries({ queryKey: ['overallLeaderboard'] });
    },
  });
}

export function useGetAllTestConfigs() {
  const { actor, isFetching } = useActor();

  return useQuery<PublicTestConfig[]>({
    queryKey: ['testConfigs'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllTestConfigs();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME.DYNAMIC,
  });
}

export function useGetOrderedTestConfigs() {
  const { actor, isFetching } = useActor();

  return useQuery<PublicTestConfig[]>({
    queryKey: ['orderedTestConfigs'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getTestConfigsInOrder();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME.DYNAMIC,
  });
}

export function useGetActivePublishedTestConfigs() {
  const { actor, isFetching } = useActor();

  return useQuery<PublicTestConfig[]>({
    queryKey: ['activePublishedTestConfigs'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getActivePublishedTestConfigs();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized') || error.message?.includes('YouTube subscription verification required')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME.DYNAMIC,
    refetchInterval: STALE_TIME.DYNAMIC, // Refetch every 30 seconds
  });
}

export function useGetStoppedTestConfigs() {
  const { actor, isFetching } = useActor();

  return useQuery<PublicTestConfig[]>({
    queryKey: ['stoppedTestConfigs'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getStoppedTestConfigs();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME.DYNAMIC,
    refetchInterval: STALE_TIME.DYNAMIC, // Refetch every 30 seconds
  });
}

export function useGetTestConfigsWithStatus() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[PublicTestConfig, PublicTestStatus]>>({
    queryKey: ['testConfigsWithStatus'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getTestConfigsWithStatus();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME.DYNAMIC,
    refetchInterval: STALE_TIME.DYNAMIC, // Refetch every 30 seconds
  });
}

export function useGetTestConfig(testId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<PublicTestConfig | null>({
    queryKey: ['testConfig', testId?.toString()],
    queryFn: async () => {
      if (!actor || !testId) return null;
      return await actor.getTestConfig(testId);
    },
    enabled: !!actor && !isFetching && testId !== null,
    staleTime: STALE_TIME.STATIC,
  });
}

export function useGetQuestion(questionId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<PublicQuestion | null>({
    queryKey: ['question', questionId?.toString()],
    queryFn: async () => {
      if (!actor || !questionId) return null;
      return await actor.getQuestion(questionId);
    },
    enabled: !!actor && !isFetching && questionId !== null,
    staleTime: STALE_TIME.STATIC,
  });
}

// For students during test - returns sanitized questions without answers
export function useGetQuestionsByTestConfig(testConfigId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<{ questions: PublicSanitizedQuestion[]; testConfig: PublicTestConfig } | null>({
    queryKey: ['questionsByTestConfig', testConfigId?.toString()],
    queryFn: async () => {
      if (!actor || !testConfigId) return null;
      return await actor.getQuestionByTestConfig(testConfigId);
    },
    enabled: !!actor && !isFetching && testConfigId !== null,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    staleTime: STALE_TIME.STATIC,
  });
}

// For admins - returns full questions with answers
export function useGetQuestionsWithAnswersByTestConfig(testConfigId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<{ questions: PublicQuestion[]; testConfig: PublicTestConfig } | null>({
    queryKey: ['questionsWithAnswersByTestConfig', testConfigId?.toString()],
    queryFn: async () => {
      if (!actor || !testConfigId) return null;
      return await actor.getQuestionWithAnswersByTestConfig(testConfigId);
    },
    enabled: !!actor && !isFetching && testConfigId !== null,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    staleTime: STALE_TIME.STATIC,
  });
}

export function useGetQuestionsBySubject(subject: string) {
  const { actor, isFetching } = useActor();

  return useQuery<PublicQuestion[]>({
    queryKey: ['questions', 'subject', subject],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getQuestionsBySubject(subject);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME.STATIC,
  });
}

export function useGetQuestionsForGallery(
  subject: string | null,
  chapter: string | null,
  difficulty: string | null,
  classLevel: PublicTestType | null,
  page: bigint,
  pageSize: bigint
) {
  const { actor, isFetching } = useActor();

  return useQuery<{
    questions: PublicGalleryQuestionPreview[];
    totalCount: bigint;
    pageCount: bigint;
  }>({
    queryKey: ['questionsGallery', subject, chapter, difficulty, classLevel, page.toString(), pageSize.toString()],
    queryFn: async () => {
      if (!actor) return { questions: [], totalCount: BigInt(0), pageCount: BigInt(0) };
      try {
        return await actor.getQuestionsForGallery(subject, chapter, difficulty, classLevel, page, pageSize);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return { questions: [], totalCount: BigInt(0), pageCount: BigInt(0) };
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME.STATIC,
  });
}

export function useFilterQuestions(
  subject: string | null,
  chapter: string | null,
  difficulty: string | null,
  classLevel: PublicTestType | null
) {
  const { actor, isFetching } = useActor();

  return useQuery<PublicGalleryQuestionPreview[]>({
    queryKey: ['questionsFiltered', subject, chapter, difficulty, classLevel],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.filterQuestions(subject, chapter, difficulty, classLevel);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME.STATIC,
  });
}

export function useGetQuestionPreview(questionId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<PublicGalleryQuestionPreview | null>({
    queryKey: ['questionPreview', questionId?.toString()],
    queryFn: async () => {
      if (!actor || !questionId) return null;
      return await actor.getQuestionPreview(questionId);
    },
    enabled: !!actor && !isFetching && questionId !== null,
    staleTime: STALE_TIME.STATIC,
  });
}

export function useGetQuestionsByIds(questionIds: bigint[]) {
  const { actor, isFetching } = useActor();

  return useQuery<PublicGalleryQuestionPreview[]>({
    queryKey: ['questionsByIds', questionIds.map(id => id.toString()).join(',')],
    queryFn: async () => {
      if (!actor || questionIds.length === 0) return [];
      try {
        return await actor.getQuestionsByIds(questionIds);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && questionIds.length > 0,
    staleTime: STALE_TIME.STATIC,
  });
}

export function useStartTestSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (testId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.startTestSession(testId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
      queryClient.invalidateQueries({ queryKey: ['activeSessionCount'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useUpdateSessionActivity() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (testId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateSessionActivity(testId);
    },
    retry: 1,
    retryDelay: 500,
  });
}

export function useSubmitTestAttempt() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { testId: bigint; answers: bigint[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitTestAttempt(data.testId, data.answers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
      queryClient.invalidateQueries({ queryKey: ['activeSessionCount'] });
      queryClient.invalidateQueries({ queryKey: ['allUsersWithTestAttempts'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboardByTest'] });
      queryClient.invalidateQueries({ queryKey: ['overallLeaderboard'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME.STATIC,
  });
}

export function useAddQuestion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      subject: string;
      chapter: string;
      difficulty: string;
      questionText: string;
      options: QuestionOption[];
      correctAnswer: bigint;
      explanation: string | null;
      image?: ExternalBlob | null;
      classLevel: PublicTestType;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addQuestion(
        data.subject,
        data.chapter,
        data.difficulty,
        data.questionText,
        data.options,
        data.correctAnswer,
        data.explanation,
        data.image || null,
        data.classLevel
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questionCount'] });
      queryClient.invalidateQueries({ queryKey: ['questionsGallery'] });
      queryClient.invalidateQueries({ queryKey: ['questionsFiltered'] });
    },
  });
}

export function useCreateTestConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      subject: string;
      chapters: string[];
      testType: PublicTestType;
      durationMinutes: bigint;
      totalQuestions: bigint;
      markingScheme: { correctMarks: number; incorrectPenalty: number };
      questions: bigint[];
      startTime?: bigint | null;
      endTime?: bigint | null;
      sectionType?: PublicSectionType | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTestConfig(
        data.name,
        data.subject,
        data.chapters,
        data.testType,
        data.durationMinutes,
        data.totalQuestions,
        data.markingScheme,
        data.questions,
        data.startTime || null,
        data.endTime || null,
        data.sectionType || null
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['orderedTestConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['testConfigCount'] });
      queryClient.invalidateQueries({ queryKey: ['testConfigsWithStatus'] });
      queryClient.invalidateQueries({ queryKey: ['activePublishedTestConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['stoppedTestConfigs'] });
    },
  });
}

export function useDeleteTestConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (testId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteTestConfig(testId);
    },
    onSuccess: () => {
      // Invalidate all test-related queries to ensure immediate UI updates
      queryClient.invalidateQueries({ queryKey: ['testConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['orderedTestConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['testConfigCount'] });
      queryClient.invalidateQueries({ queryKey: ['testConfigsWithStatus'] });
      queryClient.invalidateQueries({ queryKey: ['activePublishedTestConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['stoppedTestConfigs'] });
      
      // Clear local caches
      queryClient.removeQueries({ queryKey: ['testConfig'] });
      queryClient.removeQueries({ queryKey: ['questionsByTestConfig'] });
      queryClient.removeQueries({ queryKey: ['questionsWithAnswersByTestConfig'] });
    },
  });
}

export function useReorderTestConfigs() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newOrder: bigint[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.reorderTestConfigs(newOrder);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['orderedTestConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['testConfigsWithStatus'] });
    },
  });
}

export function usePublishTestConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (testId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.publishTestConfig(testId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['orderedTestConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['testConfigsWithStatus'] });
      queryClient.invalidateQueries({ queryKey: ['activePublishedTestConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['stoppedTestConfigs'] });
    },
  });
}

export function useUnpublishTestConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (testId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.unpublishTestConfig(testId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['orderedTestConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['testConfigsWithStatus'] });
      queryClient.invalidateQueries({ queryKey: ['activePublishedTestConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['stoppedTestConfigs'] });
    },
  });
}

export function useStopTestConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (testId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.stopTestConfig(testId);
    },
    onSuccess: () => {
      // Invalidate all test-related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['testConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['orderedTestConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['testConfigsWithStatus'] });
      queryClient.invalidateQueries({ queryKey: ['activePublishedTestConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['stoppedTestConfigs'] });
    },
  });
}

export function useScheduleTestConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { testId: bigint; startTime: bigint; endTime: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.scheduleTestConfig(data.testId, data.startTime, data.endTime);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['orderedTestConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['testConfigsWithStatus'] });
      queryClient.invalidateQueries({ queryKey: ['activePublishedTestConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['stoppedTestConfigs'] });
    },
  });
}

export function useGetQuestionCount() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['questionCount'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return await actor.getQuestionCount();
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME.DYNAMIC,
  });
}

export function useGetTestConfigCount() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['testConfigCount'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return await actor.getTestConfigCount();
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME.DYNAMIC,
  });
}

export function useGetUserCount() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['userCount'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return await actor.getUserCount();
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME.DYNAMIC,
  });
}

export function useGetSystemMetrics() {
  const { actor, isFetching } = useActor();

  return useQuery<PublicSystemMetrics | null>({
    queryKey: ['systemMetrics'],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getSystemMetrics();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME.REALTIME,
    refetchInterval: STALE_TIME.REALTIME, // Auto-refresh every 15 seconds
  });
}

export function useGetActiveSessions() {
  const { actor, isFetching } = useActor();

  return useQuery<PublicActiveSession[]>({
    queryKey: ['activeSessions'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getActiveSessions();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME.REALTIME,
    refetchInterval: STALE_TIME.REALTIME, // Auto-refresh every 15 seconds
  });
}

export function useGetActiveSessionCount() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['activeSessionCount'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      try {
        return await actor.getActiveSessionCount();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return BigInt(0);
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME.REALTIME,
    refetchInterval: STALE_TIME.REALTIME, // Auto-refresh every 15 seconds
  });
}

export function useCleanupStaleSessions() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (maxIdleMinutes: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.cleanupStaleSessions(maxIdleMinutes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
      queryClient.invalidateQueries({ queryKey: ['activeSessionCount'] });
      queryClient.invalidateQueries({ queryKey: ['systemMetrics'] });
    },
  });
}

export function useGetAllUsersWithTestAttempts() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[PublicUserProfile, PublicTestAttempt[]]>>({
    queryKey: ['allUsersWithTestAttempts'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllUsersWithTestAttempts();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME.DYNAMIC,
  });
}

// Comment System Hooks
export function useGetComments(questionId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<PublicComment[]>({
    queryKey: ['comments', questionId?.toString()],
    queryFn: async () => {
      if (!actor || !questionId) return [];
      try {
        return await actor.getComments(questionId);
      } catch (error: any) {
        console.error('Error fetching comments:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching && questionId !== null,
    staleTime: STALE_TIME.DYNAMIC,
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { questionId: bigint; text: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addComment(data.questionId, data.text);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.questionId.toString()] });
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteComment(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

// Leaderboard Hooks with optimized refresh
export function useGetLeaderboardByTest(testId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<PublicLeaderboardEntry[]>({
    queryKey: ['leaderboardByTest', testId?.toString()],
    queryFn: async () => {
      if (!actor || !testId) return [];
      try {
        return await actor.getLeaderboardByTest(testId);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && testId !== null,
    staleTime: STALE_TIME.LEADERBOARD,
    refetchInterval: STALE_TIME.LEADERBOARD, // Auto-refresh every 30 seconds (optimized from 20s)
  });
}

export function useGetOverallLeaderboard() {
  const { actor, isFetching } = useActor();

  return useQuery<PublicOverallLeaderboardEntry[]>({
    queryKey: ['overallLeaderboard'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getOverallLeaderboard();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME.LEADERBOARD,
    refetchInterval: STALE_TIME.LEADERBOARD, // Auto-refresh every 30 seconds (optimized from 20s)
  });
}

// Suggestion System Hooks
export function useGetAllSuggestions() {
  const { actor, isFetching } = useActor();

  return useQuery<SuggestionsResponse>({
    queryKey: ['allSuggestions'],
    queryFn: async () => {
      if (!actor) return { suggestions: [], count: BigInt(0) };
      try {
        return await actor.getAllSuggestions();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return { suggestions: [], count: BigInt(0) };
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME.DYNAMIC,
  });
}

export function useSubmitSuggestion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { author: string; feedback: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitSuggestion(data.author, data.feedback);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allSuggestions'] });
    },
  });
}

export function useDeleteSuggestion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestionId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteSuggestion(suggestionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allSuggestions'] });
    },
  });
}
