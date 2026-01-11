"use client";

import { motion } from "framer-motion";
import { Task, usePlanStore, TaskStatus } from "@/store/usePlanStore";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";
import { Circle, Loader2, CheckCircle2 } from "lucide-react";

interface KanbanBoardProps {
    tasks: Task[];
}

const COLUMNS: { id: TaskStatus; label: string; icon: any; color: string }[] = [
    {
        id: "pending",
        label: "To Do",
        icon: Circle,
        color: "text-muted-foreground"
    },
    {
        id: "in-progress",
        label: "In Progress",
        icon: Loader2,
        color: "text-blue-400"
    },
    {
        id: "completed",
        label: "Done",
        icon: CheckCircle2,
        color: "text-green-400"
    },
];

export function KanbanBoard({ tasks }: KanbanBoardProps) {
    // Filter tasks that are blocked into 'pending' or keep them separate? 
    // For simplicity and aesthetics, let's treat "blocked" as a state on the card, 
    // but visually place them in "To Do" or "In Progress" depending on logic.
    // However, the user might want a "Blocked" column. Let's stick to the 3 main ones for simplicity
    // and just dump 'blocked' into 'pending' or 'in-progress' for now, or maybe just render them 
    // based on their actual status if we enforced the status types strictly.
    // Actually, let's just use the status directly. If a task is 'blocked', we'll show it in 'To Do' 
    // but with the blocked indicator (which TaskCard already handles).
    // Wait, the status types are pending | in-progress | completed | blocked.
    // A 4th column for Blocked might be too much clutter. Let's add it if needed, 
    // but for now let's Map 'blocked' tasks to 'pending' column visually but keep their status?
    // No, better to have a dedicated column if we have many blocked tasks.
    // Let's stick to 3 columns and put 'blocked' in 'To Do' (Pending) loop for now, 
    // or maybe add a 4th "Blocked" column if it fits. 
    // Let's try 3 columns. 'blocked' happens rarely in this MVP flow. 
    // We will render 'blocked' tasks in the 'To Do' column for now.

    const getColumnTasks = (status: string) => {
        if (status === "pending") {
            return tasks.filter(t => t.status === "pending" || t.status === "blocked");
        }
        return tasks.filter(t => t.status === status);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-240px)] min-h-[500px]">
            {COLUMNS.map((col) => {
                const colTasks = getColumnTasks(col.id);
                const Icon = col.icon;

                return (
                    <div key={col.id} className="flex flex-col h-full">
                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-4 px-2">
                            <div className="flex items-center gap-2">
                                <div className={cn("p-1.5 rounded-md bg-white/5", col.color)}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <h3 className="font-semibold text-foreground">{col.label}</h3>
                                <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                                    {colTasks.length}
                                </span>
                            </div>
                        </div>

                        {/* Column Content */}
                        <div className="glass-subtle rounded-2xl p-4 flex-1 h-full overflow-y-auto custom-scrollbar border border-white/5">
                            <div className="space-y-3">
                                {colTasks.length > 0 ? (
                                    colTasks.map((task) => (
                                        <TaskCard key={task.id} task={task} />
                                    ))
                                ) : (
                                    <div className="h-32 flex flex-col items-center justify-center text-muted-foreground/40 border-2 border-dashed border-white/5 rounded-xl">
                                        <p className="text-sm">No tasks</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
