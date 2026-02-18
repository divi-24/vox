// Mock types for compatibility - real data comes from API

export type Speaker = "System" | "User";

export type TranscriptEntry = {
  id: string;
  speaker: Speaker;
  timestamp: string;
  text: string;
};

export type Decision = {
  id: string;
  title: string;
  description: string;
  owner: string;
  deadline: string;
  riskScore: number;
  status: "planned" | "in-progress" | "shipped" | "blocked";
};

export type ActionItem = {
  id: string;
  label: string;
  owner: string;
  dueDate: string;
  meetingId: string;
  risk: "low" | "medium" | "high";
  done: boolean;
};

export type Meeting = {
  id: string;
  title: string;
  date: string;
  durationMinutes: number;
  decisions: Decision[];
  riskScore: number;
  overdueTasks: number;
  participants: string[];
  sentiment: "positive" | "neutral" | "negative";
};

// All real data comes from API - no mock data used
export const MOCK_LIVE_TRANSCRIPT: TranscriptEntry[] = [];
export const MOCK_MEETINGS: Meeting[] = [];
export const MOCK_ACTION_ITEMS: ActionItem[] = [];
