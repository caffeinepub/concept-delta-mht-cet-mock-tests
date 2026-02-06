import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export interface TestConfig {
    id: bigint;
    startTime?: Time;
    isPublished: boolean;
    subject: string;
    endTime?: Time;
    sectionType?: SectionType;
    isStopped: boolean;
    name: string;
    createdAt: Time;
    createdBy: Principal;
    testType: TestType;
    updatedAt?: Time;
    totalQuestions: bigint;
    durationMinutes: bigint;
    chapters: Array<string>;
    markingScheme: {
        incorrectPenalty: number;
        correctMarks: number;
    };
    questions: Array<bigint>;
}
export interface SuggestionsResponse {
    suggestions: Array<Suggestion>;
    count: bigint;
}
export interface Suggestion {
    id: bigint;
    feedback: string;
    author: string;
    timestamp: Time;
}
export interface LeaderboardEntry {
    rank: bigint;
    submittedAt: Time;
    score: number;
    userProfile: UserProfile;
}
export interface GalleryQuestionPreview {
    id: bigint;
    previewImage?: ExternalBlob;
    subject: string;
    difficulty: string;
    hasImage: boolean;
    snippet: string;
    questionText: string;
    chapter: string;
    options: Array<Option>;
}
export interface Comment {
    id: bigint;
    userId: Principal;
    text: string;
    timestamp: Time;
    questionId: bigint;
}
export interface TestAttempt {
    userId: Principal;
    answers: Array<bigint>;
    submittedAt: Time;
    score: number;
    timeTaken: bigint;
    testId: bigint;
}
export interface SanitizedQuestion {
    id: bigint;
    subject: string;
    difficulty: string;
    questionText: string;
    image?: ExternalBlob;
    chapter: string;
    options: Array<Option>;
}
export interface OverallLeaderboardEntry {
    rank: bigint;
    totalAttempts: bigint;
    userProfile: UserProfile;
    averageScore: number;
}
export interface Option {
    text: string;
    image?: ExternalBlob;
}
export interface Question {
    id: bigint;
    subject: string;
    difficulty: string;
    explanation?: string;
    createdAt: Time;
    createdBy: Principal;
    correctAnswer: bigint;
    questionText: string;
    updatedAt?: Time;
    classLevel: TestType;
    image?: ExternalBlob;
    chapter: string;
    options: Array<Option>;
}
export interface ActiveSession {
    startTime: Time;
    userId: Principal;
    lastActivity: Time;
    testId: bigint;
}
export interface UserProfile {
    id: Principal;
    isBlocked: boolean;
    createdAt: Time;
    youtubeVerificationTimestamp?: Time;
    fullName: string;
    mobileNumber: string;
    email: string;
    isYouTubeVerified: boolean;
    lastLogin: Time;
    testAttempts: Array<TestAttempt>;
    blockTimestamp?: Time;
}
export interface SystemMetrics {
    totalTests: bigint;
    totalQuestions: bigint;
    timestamp: Time;
    totalUsers: bigint;
    activeSessionCount: bigint;
}
export enum SectionType {
    full = "full",
    physicsChemistry = "physicsChemistry",
    mathematics = "mathematics"
}
export enum TestStatus {
    scheduled = "scheduled",
    live = "live",
    ended = "ended",
    finished = "finished"
}
export enum TestType {
    class11 = "class11",
    class12 = "class12",
    completeSyllabus = "completeSyllabus"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addComment(questionId: bigint, text: string): Promise<void>;
    addOptionImageToQuestion(questionId: bigint, optionIndex: bigint, image: ExternalBlob): Promise<void>;
    addQuestion(subject: string, chapter: string, difficulty: string, questionText: string, options: Array<Option>, correctAnswer: bigint, explanation: string | null, image: ExternalBlob | null, classLevel: TestType): Promise<bigint>;
    addQuestionsWithClassLevel(questions: Array<Question>, classLevel: TestType): Promise<Array<bigint>>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    blockUser(userId: Principal): Promise<void>;
    cleanupStaleSessions(maxIdleMinutes: bigint): Promise<bigint>;
    createTestConfig(name: string, subject: string, chapters: Array<string>, testType: TestType, durationMinutes: bigint, totalQuestions: bigint, markingScheme: {
        incorrectPenalty: number;
        correctMarks: number;
    }, questions: Array<bigint>, startTime: Time | null, endTime: Time | null, sectionType: SectionType | null): Promise<bigint>;
    deleteComment(commentId: bigint): Promise<void>;
    deleteSuggestion(suggestionId: bigint): Promise<void>;
    deleteTestConfig(testId: bigint): Promise<void>;
    filterQuestions(subject: string | null, chapter: string | null, difficulty: string | null, classLevel: TestType | null): Promise<Array<GalleryQuestionPreview>>;
    getActiveNonBlockedUsers(): Promise<Array<UserProfile>>;
    getActivePublishedTestConfigs(): Promise<Array<TestConfig>>;
    getActiveSessionCount(): Promise<bigint>;
    getActiveSessions(): Promise<Array<ActiveSession>>;
    getAllComments(): Promise<Array<Comment>>;
    getAllQuestionsWithImages(): Promise<Array<Question>>;
    getAllSuggestions(): Promise<SuggestionsResponse>;
    getAllTestConfigs(): Promise<Array<TestConfig>>;
    getAllTestsWithStatus(): Promise<Array<[TestConfig, TestStatus]>>;
    getAllUniqueChaptersForSubject(subject: string): Promise<Array<string>>;
    getAllUsersWithTestAttempts(): Promise<Array<[UserProfile, Array<TestAttempt>]>>;
    getBlockedUsers(): Promise<Array<UserProfile>>;
    getCallerRole(): Promise<UserRole>;
    getCallerUserProfile(): Promise<UserProfile>;
    getCallerUserRole(): Promise<UserRole>;
    getComment(commentId: bigint): Promise<Comment>;
    getComments(questionId: bigint): Promise<Array<Comment>>;
    getFilteredQuestionsCount(subject: string | null, chapter: string | null, difficulty: string | null, classLevel: TestType | null): Promise<bigint>;
    getLeaderboardByTest(testId: bigint): Promise<Array<LeaderboardEntry>>;
    getOrderedTestConfigs(): Promise<Array<TestConfig>>;
    getOverallLeaderboard(): Promise<Array<OverallLeaderboardEntry>>;
    getPublishedTests(): Promise<{
        publishedTests: Array<TestConfig>;
        liveCount: bigint;
        scheduledCount: bigint;
    }>;
    getQuestion(questionId: bigint): Promise<Question>;
    getQuestionByTestConfig(testConfigId: bigint): Promise<{
        questions: Array<SanitizedQuestion>;
        testConfig: TestConfig;
    }>;
    getQuestionCount(): Promise<bigint>;
    getQuestionPreview(questionId: bigint): Promise<GalleryQuestionPreview>;
    getQuestionWithAnswersByTestConfig(testConfigId: bigint): Promise<{
        questions: Array<Question>;
        testConfig: TestConfig;
    }>;
    getQuestionsByChapter(subject: string, chapter: string): Promise<Array<Question>>;
    getQuestionsByIds(questionIds: Array<bigint>): Promise<Array<GalleryQuestionPreview>>;
    getQuestionsBySubject(subject: string): Promise<Array<Question>>;
    getQuestionsForChapter(subject: string, chapter: string): Promise<Array<Question>>;
    getQuestionsForGallery(subject: string | null, chapter: string | null, difficulty: string | null, classLevel: TestType | null, page: bigint, pageSize: bigint): Promise<{
        totalCount: bigint;
        questions: Array<GalleryQuestionPreview>;
        pageCount: bigint;
    }>;
    getStoppedTestConfigs(): Promise<Array<TestConfig>>;
    getSystemMetrics(): Promise<SystemMetrics>;
    getTestConfig(testId: bigint): Promise<TestConfig>;
    getTestConfigCount(): Promise<bigint>;
    getTestConfigOrder(): Promise<Array<bigint>>;
    getTestConfigsInOrder(): Promise<Array<TestConfig>>;
    getTestConfigsWithStatus(): Promise<Array<[TestConfig, TestStatus]>>;
    getTestStatus(testId: bigint): Promise<TestStatus>;
    getUserCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile>;
    isCallerAdmin(): Promise<boolean>;
    isCallerBlocked(): Promise<boolean>;
    isUserBlocked(userId: Principal): Promise<boolean>;
    publishTestConfig(testId: bigint): Promise<void>;
    removeOptionImageFromQuestion(questionId: bigint, optionIndex: bigint): Promise<void>;
    reorderTestConfigs(newOrder: Array<bigint>): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    scheduleTestConfig(testId: bigint, startTime: Time, endTime: Time): Promise<void>;
    setQuestionClassLevel(questionId: bigint, classLevel: TestType): Promise<void>;
    setYouTubeVerified(): Promise<void>;
    setYouTubeVerifiedForUser(userId: Principal): Promise<void>;
    startTestSession(testId: bigint): Promise<void>;
    stopTestConfig(testId: bigint): Promise<void>;
    submitSuggestion(author: string, feedback: string): Promise<void>;
    submitTestAttempt(testId: bigint, answers: Array<bigint>): Promise<number>;
    unblockUser(userId: Principal): Promise<void>;
    unpublishTestConfig(testId: bigint): Promise<void>;
    updateCallerMobileNumber(mobileNumber: string): Promise<void>;
    updateQuestion(questionId: bigint, questionData: {
        subject: string;
        difficulty: string;
        explanation?: string;
        correctAnswer: bigint;
        questionText: string;
        classLevel: TestType;
        image?: ExternalBlob;
        chapter: string;
        options: Array<Option>;
    }): Promise<void>;
    updateSessionActivity(testId: bigint): Promise<void>;
    updateTestConfig(testId: bigint, configData: {
        startTime?: Time;
        subject: string;
        endTime?: Time;
        sectionType?: SectionType;
        name: string;
        testType: TestType;
        totalQuestions: bigint;
        durationMinutes: bigint;
        chapters: Array<string>;
        markingScheme: {
            incorrectPenalty: number;
            correctMarks: number;
        };
        questions: Array<bigint>;
    }): Promise<void>;
    uploadQuestionImage(image: ExternalBlob): Promise<ExternalBlob>;
}
