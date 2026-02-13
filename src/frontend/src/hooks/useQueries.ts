import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, Question, TestConfig, TestAttempt, TestStatus, TestType, SectionType, Comment, LeaderboardEntry, OverallLeaderboardEntry } from '../types/local';
import type { UserProfile as BackendUserProfile, Comment as BackendComment, Suggestion } from '../backend';
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
        // Backend method not available - return empty array
        return [];
      } catch (error) {
        console.error('Error fetching test configs:', error);
        return [];
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
        return [];
      } catch (error) {
        console.error('Error fetching ordered test configs:', error);
        return [];
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

  return useQuery({
    queryKey: ['questionsBySubject', subject],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return [];
      } catch (error) {
        console.error('Error fetching questions by subject:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!subject,
    retry: false,
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

  return useQuery<{ suggestions: Suggestion[]; count: bigint }>({
    queryKey: ['allSuggestions'],
    queryFn: async () => {
      if (!actor) return { suggestions: [], count: BigInt(0) };
      try {
        const result = await actor.listSuggestions();
        return result;
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        return { suggestions: [], count: BigInt(0) };
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
