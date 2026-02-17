import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
        incorrectPenalty: bigint;
        correctMarks: bigint;
        penaltyOption?: string;
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
    score: bigint;
    timeTaken: bigint;
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
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteComment(id: bigint): Promise<void>;
    deleteExpiredUnpublishedTests(): Promise<void>;
    deleteQuestion(questionId: bigint): Promise<void>;
    deleteSuggestion(id: bigint): Promise<void>;
    getAllTestConfigsWithStatus(): Promise<Array<[TestConfig, TestStatus]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentlyLiveTestsWithStatus(): Promise<Array<[TestConfig, TestStatus]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listCommentsForQuestion(questionId: bigint): Promise<Array<Comment>>;
    listSuggestions(): Promise<SuggestionsResponse>;
    postComment(questionId: bigint, text: string): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<UserProfile>;
    setYouTubeVerified(): Promise<void>;
    submitSuggestion(author: string, feedback: string): Promise<bigint>;
}
