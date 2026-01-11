import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Priority = "high" | "medium" | "low";
export type TaskStatus = "pending" | "in-progress" | "completed" | "blocked";
export type Category = "product" | "marketing" | "finance" | "operations" | "hiring" | "legal" | "tech";

export interface Task {
    id: string;
    title: string;
    description: string;
    priority: Priority;
    status: TaskStatus;
    category: Category;
    estimatedDays: number;
    dependencies: string[];
    assignee?: string;
}

export interface Alert {
    id: string;
    type: "urgent" | "warning" | "info";
    title: string;
    message: string;
    taskId?: string;
    timestamp: Date;
}

interface PlanState {
    tasks: Task[];
    alerts: Alert[];
    selectedCategory: Category | "all";
    expandedCategories: Category[];
    healthScore: number;
    driftPercentage: number;
    isLoading: boolean;
    setTasks: (tasks: Task[]) => void;
    addTasks: (tasks: Task[]) => void;
    updateTaskStatus: (taskId: string, status: TaskStatus) => void;
    setAlerts: (alerts: Alert[]) => void;
    addAlerts: (alerts: Alert[]) => void;
    dismissAlert: (alertId: string) => void;
    setSelectedCategory: (category: Category | "all") => void;
    toggleCategoryExpanded: (category: Category) => void;
    setHealthScore: (score: number) => void;
    setDriftPercentage: (drift: number) => void;
    setIsLoading: (loading: boolean) => void;
    reset: () => void;
}

export const usePlanStore = create<PlanState>()(
    persist(
        (set) => ({
            tasks: [],
            alerts: [],
            selectedCategory: "all",
            expandedCategories: ["product", "tech", "marketing", "finance", "operations", "hiring", "legal"],
            healthScore: 0,
            driftPercentage: 0,
            isLoading: false,

            setTasks: (tasks) => set({ tasks }),

            addTasks: (newTasks) =>
                set((state) => ({
                    tasks: [...state.tasks, ...newTasks],
                })),

            updateTaskStatus: (taskId, status) =>
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.id === taskId ? { ...task, status } : task
                    ),
                })),

            setAlerts: (alerts) => set({ alerts }),

            addAlerts: (newAlerts) =>
                set((state) => ({
                    alerts: [...state.alerts, ...newAlerts],
                })),

            dismissAlert: (alertId) =>
                set((state) => ({
                    alerts: state.alerts.filter((alert) => alert.id !== alertId),
                })),

            setSelectedCategory: (category) => set({ selectedCategory: category }),

            toggleCategoryExpanded: (category) =>
                set((state) => ({
                    expandedCategories: state.expandedCategories.includes(category)
                        ? state.expandedCategories.filter((c) => c !== category)
                        : [...state.expandedCategories, category],
                })),

            setHealthScore: (score) => set({ healthScore: score }),
            setDriftPercentage: (drift) => set({ driftPercentage: drift }),
            setIsLoading: (loading) => set({ isLoading: loading }),
            reset: () =>
                set({
                    tasks: [],
                    alerts: [],
                    selectedCategory: "all",
                    healthScore: 0,
                    driftPercentage: 0,
                    isLoading: false,
                }),
        }),
        {
            name: "startupops-plan-storage",
        }
    )
);
