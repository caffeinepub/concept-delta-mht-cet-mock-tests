import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, Question, TestConfig, TestAttempt, TestStatus, TestType, SectionType, Comment, LeaderboardEntry, OverallLeaderboardEntry } from '../types/local';
import type { UserProfile as BackendUserProfile } from '../backend';
import { toast } from 'sonner';

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
function convertLocalProfileToBackend(localProfile: Omit<UserProfile, 'id' | 'testAttempts' | 'createdAt' | 'lastLogin'>, actorPrincipal: any): BackendUserProfile {
  return {
    id: actorPrincipal,
    fullName: localProfile.fullName,
    email: localProfile.email,
    mobileNumber: localProfile.mobileNumber,
    testAttempts: [],
    createdAt: BigInt(Date.now() * 1000000),
    lastLogin: BigInt(Date.now() * 1000000),
    isYouTubeVerified: localProfile.isYouTubeVerified,
    youtubeVerificationTimestamp: localProfile.youtubeVerificationTimestamp ?? undefined,
    isBlocked: localProfile.isBlocked,
    blockTimestamp: localProfile.blockTimestamp ?? undefined,
  };
}

export function useGetCallerUserProfile() {
  const { actor, isFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.getCallerUserProfile();
      if (!result) return null;
      return convertBackendProfileToLocal(result);
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: Omit<UserProfile, 'id' | 'testAttempts' | 'createdAt' | 'lastLogin'>) => {
      if (!actor) throw new Error('Actor not available');
      
      // Get the actor's principal - we need to pass a dummy principal since backend will override with caller
      const dummyPrincipal = { toText: () => 'dummy' } as any;
      const backendProfile = convertLocalProfileToBackend(profile, dummyPrincipal);
      
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
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetTestConfigsWithStatus() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<Array<[TestConfig, TestStatus]>>({
    queryKey: ['testConfigsWithStatus'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      // Backend method not available - return empty array
      return [];
    },
    enabled: !!actor && !actorFetching,
    staleTime: 30000,
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
      if (!actor) throw new Error('Actor not available');
      return [];
    },
    enabled: !!actor && !isFetching,
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
  });
}

export function useGetQuestionsBySubject(subject: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['questionsBySubject', subject],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return [];
    },
    enabled: !!actor && !isFetching && !!subject,
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
  });
}

export function useDeleteQuestion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questionId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteQuestion(questionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionsBySubject'] });
      queryClient.invalidateQueries({ queryKey: ['questionCount'] });
      queryClient.invalidateQueries({ queryKey: ['testConfigsWithStatus'] });
      queryClient.invalidateQueries({ queryKey: ['orderedTestConfigs'] });
    },
  });
}

export function useGetQuestionsWithAnswersByTestConfig(testId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['questionsWithAnswers', testId?.toString()],
    queryFn: async () => {
      if (!actor || !testId) throw new Error('Actor or testId not available');
      return [];
    },
    enabled: !!actor && !isFetching && testId !== null,
  });
}

export function useGetQuestionCount() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['questionCount'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return BigInt(0);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTestConfigCount() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['testConfigCount'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return BigInt(0);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserCount() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['userCount'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return BigInt(0);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSystemMetrics() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['systemMetrics'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return null;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useGetActiveSessions() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['activeSessions'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return [];
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useCleanupStaleSessions() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inactiveMinutes: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return BigInt(0);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
      queryClient.invalidateQueries({ queryKey: ['systemMetrics'] });
    },
  });
}

export function useGetAllUsersWithTestAttempts() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['allUsersWithTestAttempts'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useBlockUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Method not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsersWithTestAttempts'] });
    },
  });
}

export function useUnblockUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Method not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsersWithTestAttempts'] });
    },
  });
}

export function useGetCommentsByQuestion(questionId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['comments', questionId?.toString()],
    queryFn: async () => {
      if (!actor || questionId === null) return [];
      return [];
    },
    enabled: !!actor && !isFetching && questionId !== null,
  });
}

export function usePostComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { questionId: bigint; text: string }) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Method not implemented');
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
    mutationFn: async (params: { commentId: bigint; questionId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Method not implemented');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.questionId.toString()] });
    },
  });
}

export function useGetLeaderboard(testId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['leaderboard', testId?.toString()],
    queryFn: async () => {
      if (!actor || testId === null) return [];
      return [];
    },
    enabled: !!actor && !isFetching && testId !== null,
    refetchInterval: 20000,
  });
}

export function useGetOverallLeaderboard() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['overallLeaderboard'],
    queryFn: async () => {
      if (!actor) return [];
      return [];
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 20000,
  });
}

export function useSubmitSuggestion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { author: string; feedback: string }) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Method not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allSuggestions'] });
    },
  });
}

export function useGetAllSuggestions() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['allSuggestions'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return { suggestions: [], count: BigInt(0) };
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDeleteSuggestion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestionId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Method not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allSuggestions'] });
    },
  });
}

// Stub exports for missing methods
export function useGetQuestionsByTestConfig() {
  return useQuery({ queryKey: ['stub'], queryFn: async () => [], enabled: false });
}

export function useSubmitTestAttempt() {
  return useMutation({ mutationFn: async () => { throw new Error('Not implemented'); } });
}

export function useStartTestSession() {
  return useMutation({ mutationFn: async () => { throw new Error('Not implemented'); } });
}

export function useUpdateSessionActivity() {
  return useMutation({ mutationFn: async () => { throw new Error('Not implemented'); } });
}

export function useUpdateCallerMobileNumber() {
  return useMutation({ mutationFn: async () => { throw new Error('Not implemented'); } });
}

export function useGetTestConfig() {
  return useQuery({ queryKey: ['stub'], queryFn: async () => null, enabled: false });
}

export function useSetYouTubeVerified() {
  return useMutation({ mutationFn: async () => { throw new Error('Not implemented'); } });
}
