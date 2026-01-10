"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Task, TaskStatus, Priority, usePlanStore } from "@/store/usePlanStore";
import { cn } from "@/lib/utils";
import {
    Clock,
    CheckCircle2,
    Circle,
    AlertCircle,
    Loader2,
    ArrowRight,
    GitBranch,
} from "lucide-react";

interface TaskCardProps {
    task: Task;
}

const priorityConfig: Record<Priority, { color: string; label: string }> = {
    high: { color: "bg-priority-high text-white", label: "High" },
    medium: { color: "bg-priority-medium text-black", label: "Medium" },
    low: { color: "bg-priority-low text-white", label: "Low" },
};

const statusConfig: Record<TaskStatus, { icon: React.ElementType; color: string; label: string }> = {
    pending: { icon: Circle, color: "text-muted-foreground", label: "Pending" },
    "in-progress": { icon: Loader2, color: "text-primary", label: "In Progress" },
    completed: { icon: CheckCircle2, color: "text-status-healthy", label: "Completed" },
    blocked: { icon: AlertCircle, color: "text-status-critical", label: "Blocked" },
};

const statusOrder: TaskStatus[] = ["pending", "in-progress", "completed", "blocked"];

export function TaskCard({ task }: TaskCardProps) {
    const { updateTaskStatus } = usePlanStore();
    const priority = priorityConfig[task.priority];
    const status = statusConfig[task.status];
    const StatusIcon = status.icon;

    const cycleStatus = () => {
        const currentIndex = statusOrder.indexOf(task.status);
        const nextIndex = (currentIndex + 1) % statusOrder.length;
        updateTaskStatus(task.id, statusOrder[nextIndex]);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "glass-card p-5 cursor-pointer group transition-all duration-300",
                task.status === "blocked" && "border-status-critical/50",
                task.status === "completed" && "opacity-75"
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className={cn(
                    "font-semibold text-foreground line-clamp-2",
                    task.status === "completed" && "line-through opacity-70"
                )}>
                    {task.title}
                </h3>
                <Badge className={cn(priority.color, "shrink-0 text-xs")}>
                    {priority.label}
                </Badge>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {task.description}
            </p>

            {/* Meta info */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {task.estimatedDays}d
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Estimated: {task.estimatedDays} days</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {task.dependencies.length > 0 && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="flex items-center gap-1">
                                        <GitBranch className="w-3.5 h-3.5" />
                                        {task.dependencies.length}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{task.dependencies.length} dependencies</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>

                {/* Status button */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    cycleStatus();
                                }}
                                className={cn(
                                    "h-8 px-3 gap-2 transition-all",
                                    status.color,
                                    "hover:bg-accent"
                                )}
                            >
                                <StatusIcon className={cn(
                                    "w-4 h-4",
                                    task.status === "in-progress" && "animate-spin"
                                )} />
                                <span className="text-xs hidden sm:inline">{status.label}</span>
                                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Click to change status</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </motion.div>
    );
}
