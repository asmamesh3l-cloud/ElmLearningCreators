export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

export const ActivityType = {
  individual: "individual",
  group: "group",
  discussion: "discussion",
  practical: "practical",
  digital: "digital",
} as const;

export interface Activity {
  name: string;
  description: string;
  duration: number;
  type: ActivityType;
}

export type ChatMessageRole = (typeof ChatMessageRole)[keyof typeof ChatMessageRole];

export const ChatMessageRole = {
  user: "user",
  assistant: "assistant",
} as const;

export interface ChatMessage {
  role: ChatMessageRole;
  content: string;
}

export interface TimeDistribution {
  introduction: number;
  explanation: number;
  activity: number;
  assessment: number;
}

export interface DifferentiatedInstructions {
  advanced: string;
  average: string;
  needsSupport: string;
}

export interface LessonPlan {
  title: string;
  stage: string;
  grade: string;
  subject: string;
  duration: number;
  objectives: string[];
  timeDistribution: TimeDistribution;
  strategies: string[];
  introduction: string;
  mainContent: string;
  activities: Activity[];
  assessment: string;
  closure: string;
  materials: string[];
  differentiatedInstructions: DifferentiatedInstructions;
  homework?: string;
  madrasatiHomework?: string;
}

export interface LessonPlanPatch {
  title?: string;
  objectives?: string[];
  introduction?: string;
  mainContent?: string;
  activities?: Activity[];
  assessment?: string;
  closure?: string;
  materials?: string[];
  strategies?: string[];
  differentiatedInstructions?: DifferentiatedInstructions;
  homework?: string;
  madrasatiHomework?: string;
}

export interface Subject {
  name: string;
  lessons: string[];
}

export interface Grade {
  name: string;
  subjects: Subject[];
}

export interface Stage {
  name: string;
  grades: Grade[];
}

export interface CurriculumOptions {
  stages: Stage[];
}

export type StudentLevel = (typeof StudentLevel)[keyof typeof StudentLevel];

export const StudentLevel = {
  مبتدئ: "مبتدئ",
  متوسط: "متوسط",
  متقدم: "متقدم",
  مختلط: "مختلط",
} as const;

export interface LessonRequest {
  teacherName: string;
  stage: string;
  grade: string;
  subject: string;
  lessonTitle: string;
  duration?: number;
  learningOutcomes?: string;
  studentLevel?: StudentLevel;
  classNature?: string;
  learningNeeds?: string;
}

export interface LessonResponse {
  lessonPlan: LessonPlan;
  ragSources: string[];
  generatedAt: string;
}

export interface ChatRequest {
  message: string;
  lessonContext?: LessonPlan;
  history?: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
  ragSources?: string[];
  lessonPatch?: LessonPlanPatch;
  timestamp: string;
}

export interface RagRequest {
  subject: string;
  lessonTitle: string;
  stage?: string;
  grade?: string;
}

export interface RagResponse {
  sources: string[];
  context: string;
  retrievedAt: string;
}

export interface HealthStatus {
  status: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}
