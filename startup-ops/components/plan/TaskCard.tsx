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
    Sparkles,
} from "lucide-react";

interface TaskCardProps {
    task: Task;
    categoryColor?: string;
}

const priorityConfig: Record<Priority, { color: string; bgColor: string; label: string; hoverGlow: string }> = {
    high: {
        color: "text-red-400",
        bgColor: "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-white/5",
        label: "High",
        hoverGlow: "hover:bg-red-500/10 hover:border-white/10"
    },
    medium: {
        color: "text-amber-400",
        bgColor: "bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-white/5",
        label: "Medium",
        hoverGlow: "hover:bg-amber-500/10 hover:border-white/10"
    },
    low: {
        color: "text-emerald-400",
        bgColor: "bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-white/5",
        label: "Low",
        hoverGlow: "hover:bg-emerald-500/10 hover:border-white/10"
    },
};

const statusConfig: Record<TaskStatus, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
    pending: {
        icon: Circle,
        color: "text-muted-foreground",
        bgColor: "bg-muted/50",
        label: "Pending"
    },
    "in-progress": {
        icon: Loader2,
        color: "text-blue-400",
        bgColor: "bg-blue-500/10",
        label: "In Progress"
    },
    completed: {
        icon: CheckCircle2,
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/10",
        label: "Completed"
    },
    blocked: {
        icon: AlertCircle,
        color: "text-red-400",
        bgColor: "bg-red-500/10",
        label: "Blocked"
    },
};

const statusOrder: TaskStatus[] = ["pending", "in-progress", "completed", "blocked"];

export function TaskCard({ task, categoryColor = "from-blue-500 to-cyan-500" }: TaskCardProps) {
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
            transition={{ duration: 0.2 }}
            className={cn(
                "relative cursor-pointer rounded-2xl group",
                "transition-all duration-200 ease-out",
                "backdrop-blur-sm",
                priority.hoverGlow,
                task.status === "completed" && "opacity-70"
            )}
        >
            {/* Card Content */}
            <div className={cn(
                "relative bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/8 p-4 rounded-2xl shadow-sm dark:shadow-none",
                "transition-all duration-300",
                "group-hover:border-violet-200 dark:group-hover:border-white/12",
                task.status === "blocked" && "border-red-500/20 dark:border-red-500/20"
            )}>
                {/* Status Indicator Dot */}
                <div className={cn(
                    "absolute top-4 left-4 w-2 h-2 rounded-full",
                    task.status === "completed" ? "bg-emerald-400" :
                        task.status === "in-progress" ? "bg-blue-400 animate-pulse" :
                            task.status === "blocked" ? "bg-red-400" :
                                "bg-muted-foreground/40"
                )} />

                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2.5 pl-5">
                    <h3 className={cn(
                        "font-medium text-sm text-foreground line-clamp-2 leading-snug",
                        task.status === "completed" && "line-through opacity-60"
                    )}>
                        {task.title}
                    </h3>
                    <span
                        className={cn(
                            "shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded",
                            priority.color,
                            "bg-current/10"
                        )}
                    >
                        {priority.label}
                    </span>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3 pl-5 leading-relaxed">
                    {task.description}
                </p>

                {/* Meta Info Row */}
                <div className="flex items-center justify-between gap-2 pl-5">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span
                                        className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 rounded hover:bg-white/8 transition-colors cursor-default"
                                    >
                                        <Clock className="w-3 h-3 text-blue-400/80" />
                                        <span>{task.estimatedDays}d</span>
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">
                                    <p>Estimated: {task.estimatedDays} days</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {task.dependencies.length > 0 && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span
                                            className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 rounded hover:bg-white/8 transition-colors cursor-default"
                                        >
                                            <GitBranch className="w-3 h-3 text-purple-400/80" />
                                            <span>{task.dependencies.length}</span>
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-xs">
                                        <p>{task.dependencies.length} dependencies</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>

                    {/* Status Button */}
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
                                        "h-6 px-2 gap-1.5 rounded transition-all text-[10px] font-medium",
                                        status.bgColor,
                                        status.color,
                                        "hover:opacity-90"
                                    )}
                                >
                                    <StatusIcon className={cn(
                                        "w-3 h-3",
                                        task.status === "in-progress" && "animate-spin"
                                    )} />
                                    <span className="hidden sm:inline">{status.label}</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-xs">
                                <div className="flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    <p>Click to change status</p>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
        </motion.div>
    );
}
