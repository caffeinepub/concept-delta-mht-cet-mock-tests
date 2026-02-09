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
    deleteQuestion(questionId: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<UserProfile>;
}
