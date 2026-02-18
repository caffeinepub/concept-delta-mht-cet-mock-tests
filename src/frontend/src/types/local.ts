// Local type definitions for types not exported by backend
// These match the backend Motoko types but are defined locally for frontend use

import { ExternalBlob } from '../backend';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  testAttempts: TestAttempt[];
  createdAt: bigint;
  lastLogin: bigint;
  isYouTubeVerified: boolean;
  youtubeVerificationTimestamp: bigint | null;
  isBlocked: boolean;
  blockTimestamp: bigint | null;
}

export interface TestAttempt {
  userId: string;
  testId: bigint;
  answers: bigint[];
  score: bigint;
  timeTaken: bigint;
  submittedAt: bigint;
}

export interface Option {
  text: string;
  image?: ExternalBlob;
}

export interface Question {
  id: bigint;
  subject: string;
  chapter: string;
  difficulty: string;
  questionText: string;
  options: Option[];
  correctAnswer: bigint;
  explanation?: string;
  image?: ExternalBlob;
  createdBy: string;
  createdAt: bigint;
  updatedAt?: bigint;
  classLevel: string;
}

export type TestType = 'class11' | 'class12' | 'completeSyllabus';
export type SectionType = 'physicsChemistry' | 'mathematics' | 'full';
export type TestStatus = 'scheduled' | 'live' | 'ended' | 'finished';

export interface TestConfig {
  id: bigint;
  name: string;
  subject: string;
  chapters: string[];
  testType: string;
  durationMinutes: bigint;
  totalQuestions: bigint;
  markingScheme: {
    correctMarks: number;
    incorrectPenalty: number;
    penaltyOption: string | null;
  };
  questions: bigint[];
  createdBy: string;
  createdAt: bigint;
  updatedAt: bigint | null;
  isPublished: boolean;
  isStopped: boolean;
  startTime: bigint | null;
  endTime: bigint | null;
  sectionType: SectionType | null;
}

export interface Comment {
  id: bigint;
  questionId: bigint;
  userId: string;
  text: string;
  timestamp: bigint;
}

export interface LeaderboardEntry {
  userProfile: UserProfile;
  score: bigint;
  rank: bigint;
  submittedAt: bigint;
}

export interface OverallLeaderboardEntry {
  userProfile: UserProfile;
  averageScore: bigint;
  totalAttempts: bigint;
  rank: bigint;
}
