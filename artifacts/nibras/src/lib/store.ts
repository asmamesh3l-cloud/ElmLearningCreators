import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LessonPlan, ChatMessage, LessonPlanPatch } from '@workspace/api-client-react';

interface AppState {
  teacherName: string;
  setTeacherName: (name: string) => void;
  
  currentLesson: LessonPlan | null;
  setCurrentLesson: (lesson: LessonPlan | null) => void;
  patchCurrentLesson: (patch: LessonPlanPatch) => void;
  
  ragSources: string[];
  setRagSources: (sources: string[]) => void;
  
  chatHistory: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChatHistory: () => void;
}

function applyPatch(current: LessonPlan, patch: LessonPlanPatch): LessonPlan {
  const updated = { ...current };
  if (patch.title !== undefined) updated.title = patch.title;
  if (patch.objectives !== undefined) updated.objectives = patch.objectives;
  if (patch.introduction !== undefined) updated.introduction = patch.introduction;
  if (patch.mainContent !== undefined) updated.mainContent = patch.mainContent;
  if (patch.activities !== undefined) updated.activities = patch.activities;
  if (patch.assessment !== undefined) updated.assessment = patch.assessment;
  if (patch.closure !== undefined) updated.closure = patch.closure;
  if (patch.materials !== undefined) updated.materials = patch.materials;
  if (patch.strategies !== undefined) updated.strategies = patch.strategies;
  if (patch.homework !== undefined) updated.homework = patch.homework;
  if (patch.madrasatiHomework !== undefined) updated.madrasatiHomework = patch.madrasatiHomework;
  if (patch.differentiatedInstructions !== undefined) {
    updated.differentiatedInstructions = {
      ...current.differentiatedInstructions,
      ...patch.differentiatedInstructions,
    };
  }
  return updated;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      teacherName: '',
      setTeacherName: (name) => set({ teacherName: name }),
      
      currentLesson: null,
      setCurrentLesson: (lesson) => set({ currentLesson: lesson }),
      patchCurrentLesson: (patch) => set((state) => ({
        currentLesson: state.currentLesson ? applyPatch(state.currentLesson, patch) : state.currentLesson,
      })),
      
      ragSources: [],
      setRagSources: (sources) => set({ ragSources: sources }),
      
      chatHistory: [],
      addChatMessage: (message) => set((state) => ({ chatHistory: [...state.chatHistory, message] })),
      clearChatHistory: () => set({ chatHistory: [] }),
    }),
    {
      name: 'nibras-storage',
      partialize: (state) => ({
        teacherName: state.teacherName,
        currentLesson: state.currentLesson,
        ragSources: state.ragSources,
        chatHistory: state.chatHistory,
      }),
    }
  )
);
