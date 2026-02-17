// Local type definitions for types not exported by backend
// These match the backend Motoko types but are defined locally for frontend use

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
  image: any | null; // ExternalBlob type
}

export interface Question {
  id: bigint;
  subject: string;
  chapter: string;
  difficulty: string;
  questionText: string;
  options: Option[];
  correctAnswer: bigint;
  explanation: string | null;
  image: any | null; // ExternalBlob type
  createdBy: string;
  createdAt: bigint;
  updatedAt: bigint | null;
  classLevel: TestType;
}

export interface SanitizedQuestion {
  id: bigint;
  subject: string;
  chapter: string;
  difficulty: string;
  questionText: string;
  options: Option[];
  image: any | null;
}

export enum TestStatus {
  scheduled = 'scheduled',
  live = 'live',
  ended = 'ended',
  finished = 'finished',
}

export enum TestType {
  class11 = 'class11',
  class12 = 'class12',
  completeSyllabus = 'completeSyllabus',
}

export enum SectionType {
  physicsChemistry = 'physicsChemistry',
  mathematics = 'mathematics',
  full = 'full',
}

export interface TestConfig {
  id: bigint;
  name: string;
  subject: string;
  chapters: string[];
  testType: TestType;
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
  score: number;
  rank: bigint;
  submittedAt: bigint;
}

export interface OverallLeaderboardEntry {
  userProfile: UserProfile;
  averageScore: number;
  totalAttempts: bigint;
  rank: bigint;
}
