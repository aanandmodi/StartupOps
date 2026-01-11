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

const priorityConfig: Record<Priority, { color: string; bgColor: string; label: string }> = {
    high: {
        color: "text-red-400",
        bgColor: "bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30",
        label: "High"
    },
    medium: {
        color: "text-amber-400",
        bgColor: "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30",
        label: "Medium"
    },
    low: {
        color: "text-emerald-400",
        bgColor: "bg-gradient-to-r from-emerald-500/20 to-green-500/20 border-emerald-500/30",
        label: "Low"
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
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "relative group cursor-pointer rounded-2xl transition-all duration-300",
                task.status === "completed" && "opacity-70"
            )}
        >
            {/* Gradient Border Effect */}
            <div className={cn(
                "absolute -inset-[1px] rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-[1px]",
                categoryColor
            )} />

            {/* Card Content */}
            <div className={cn(
                "relative backdrop-blur-xl bg-card/80 dark:bg-white/5 border border-white/10 p-5 rounded-2xl",
                task.status === "blocked" && "border-red-500/30"
            )}>
                {/* Status Indicator Line */}
                <div className={cn(
                    "absolute top-0 left-0 w-1 h-full rounded-l-2xl bg-gradient-to-b",
                    task.status === "completed" ? "from-emerald-500 to-green-500" :
                        task.status === "in-progress" ? "from-blue-500 to-cyan-500" :
                            task.status === "blocked" ? "from-red-500 to-orange-500" :
                                "from-muted-foreground/30 to-muted-foreground/10"
                )} />

                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className={cn(
                        "font-semibold text-foreground line-clamp-2 leading-snug",
                        task.status === "completed" && "line-through opacity-70"
                    )}>
                        {task.title}
                    </h3>
                    <Badge
                        className={cn(
                            "shrink-0 text-xs font-medium px-2.5 py-0.5 border rounded-lg",
                            priority.bgColor,
                            priority.color
                        )}
                    >
                        {priority.label}
                    </Badge>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                    {task.description}
                </p>

                {/* Meta Info Row */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <motion.span
                                        className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                                        <span className="font-medium">{task.estimatedDays}d</span>
                                    </motion.span>
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
                                        <motion.span
                                            className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            <GitBranch className="w-3.5 h-3.5 text-purple-400" />
                                            <span className="font-medium">{task.dependencies.length}</span>
                                        </motion.span>
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
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            cycleStatus();
                                        }}
                                        className={cn(
                                            "h-8 px-3 gap-2 rounded-lg transition-all font-medium",
                                            status.bgColor,
                                            status.color,
                                            "hover:opacity-80"
                                        )}
                                    >
                                        <StatusIcon className={cn(
                                            "w-4 h-4",
                                            task.status === "in-progress" && "animate-spin"
                                        )} />
                                        <span className="text-xs hidden sm:inline">{status.label}</span>
                                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Button>
                                </motion.div>
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
