import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Goal {
    startupGoal: string;
    teamSize: number;
    domain: string;
}

interface GoalState {
    goal: Goal | null;
    startupId: number | null; // Store the startup ID from backend
    isGenerating: boolean;
    hasGeneratedPlan: boolean;
    setGoal: (goal: Goal) => void;
    setStartupId: (id: number) => void;
    setIsGenerating: (isGenerating: boolean) => void;
    setHasGeneratedPlan: (hasGeneratedPlan: boolean) => void;
    reset: () => void;
}

export const useGoalStore = create<GoalState>()(
    persist(
        (set) => ({
            goal: null,
            startupId: null,
            isGenerating: false,
            hasGeneratedPlan: false,
            setGoal: (goal) => set({ goal }),
            setStartupId: (startupId) => set({ startupId }),
            setIsGenerating: (isGenerating) => set({ isGenerating }),
            setHasGeneratedPlan: (hasGeneratedPlan) => set({ hasGeneratedPlan }),
            reset: () =>
                set({
                    goal: null,
                    startupId: null,
                    isGenerating: false,
                    hasGeneratedPlan: false,
                }),
        }),
        {
            name: "startupops-goal-storage",
        }
    )
);
