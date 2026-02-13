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
export interface SuggestionsResponse {
    suggestions: Array<Suggestion>;
    count: bigint;
}
export interface Comment {
    id: bigint;
    userId: Principal;
    text: string;
    timestamp: Time;
    questionId: bigint;
}
export interface Suggestion {
    id: bigint;
    feedback: string;
    author: string;
    timestamp: Time;
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
export interface TestAttempt {
    userId: Principal;
    answers: Array<bigint>;
    submittedAt: Time;
    score: number;
    timeTaken: bigint;
    testId: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteComment(id: bigint): Promise<void>;
    deleteQuestion(questionId: bigint): Promise<void>;
    deleteSuggestion(id: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listCommentsForQuestion(questionId: bigint): Promise<Array<Comment>>;
    listSuggestions(): Promise<SuggestionsResponse>;
    postComment(questionId: bigint, text: string): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<UserProfile>;
    setYouTubeVerified(): Promise<void>;
    submitSuggestion(author: string, feedback: string): Promise<bigint>;
}
