"use client";

import { memo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { motion } from "framer-motion";
import { Task, Priority, TaskStatus, Category } from "@/store/usePlanStore";
import { cn } from "@/lib/utils";
import {
    CheckCircle2,
    Circle,
    AlertCircle,
    Loader2,
    Package,
    Code2,
    Megaphone,
    DollarSign,
    Briefcase,
    Users,
    Scale,
    Clock
} from "lucide-react";

type TaskNodeType = Node<{ task: Task }>;

const statusIcons: Record<TaskStatus, React.ElementType> = {
    pending: Circle,
    "in-progress": Loader2,
    completed: CheckCircle2,
    blocked: AlertCircle,
};

const statusColors: Record<TaskStatus, string> = {
    pending: "text-slate-400",
    "in-progress": "text-blue-400",
    completed: "text-emerald-400",
    blocked: "text-red-400",
};

const categoryConfig: Record<Category, { icon: React.ElementType; gradient: string; border: string }> = {
    product: {
        icon: Package,
        gradient: "from-violet-500/20 to-purple-600/20",
        border: "border-violet-500/50"
    },
    tech: {
        icon: Code2,
        gradient: "from-blue-500/20 to-cyan-600/20",
        border: "border-blue-500/50"
    },
    marketing: {
        icon: Megaphone,
        gradient: "from-pink-500/20 to-rose-600/20",
        border: "border-pink-500/50"
    },
    finance: {
        icon: DollarSign,
        gradient: "from-emerald-500/20 to-teal-600/20",
        border: "border-emerald-500/50"
    },
    operations: {
        icon: Briefcase,
        gradient: "from-orange-500/20 to-amber-600/20",
        border: "border-orange-500/50"
    },
    hiring: {
        icon: Users,
        gradient: "from-indigo-500/20 to-blue-600/20",
        border: "border-indigo-500/50"
    },
    legal: {
        icon: Scale,
        gradient: "from-slate-500/20 to-gray-600/20",
        border: "border-slate-500/50"
    },
};

const priorityBadge: Record<Priority, { color: string; label: string }> = {
    high: { color: "bg-red-500/20 text-red-300 border-red-500/30", label: "High" },
    medium: { color: "bg-amber-500/20 text-amber-300 border-amber-500/30", label: "Med" },
    low: { color: "bg-slate-500/20 text-slate-300 border-slate-500/30", label: "Low" },
};

function TaskNodeComponent({ data }: NodeProps<TaskNodeType>) {
    const { task } = data;
    const StatusIcon = statusIcons[task.status];
    const categoryInfo = categoryConfig[task.category] || categoryConfig.operations;
    const CategoryIcon = categoryInfo.icon;
    const priorityInfo = priorityBadge[task.priority];

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn(
                "relative px-4 py-3 rounded-2xl backdrop-blur-xl border-2 shadow-2xl min-w-[200px] max-w-[240px]",
                "bg-gradient-to-br",
                categoryInfo.gradient,
                categoryInfo.border,
                task.status === "completed" && "opacity-80"
            )}
        >
            {/* Glow effect */}
            <div className={cn(
                "absolute inset-0 rounded-2xl blur-xl opacity-30 -z-10",
                "bg-gradient-to-br",
                categoryInfo.gradient
            )} />

            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-4 !h-4 !bg-gradient-to-br from-primary to-purple-500 !border-2 !border-background !-top-2"
            />

            {/* Category Badge */}
            <div className="flex items-center justify-between mb-2">
                <div className={cn(
                    "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
                    "bg-white/10 backdrop-blur-sm border border-white/10"
                )}>
                    <CategoryIcon className="w-3 h-3" />
                    <span className="capitalize">{task.category}</span>
                </div>
                <div className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium border",
                    priorityInfo.color
                )}>
                    {priorityInfo.label}
                </div>
            </div>

            {/* Node Content */}
            <div className="flex items-start gap-2">
                <StatusIcon
                    className={cn(
                        "w-5 h-5 mt-0.5 shrink-0",
                        statusColors[task.status],
                        task.status === "in-progress" && "animate-spin"
                    )}
                />
                <div className="flex-1 min-w-0">
                    <p className={cn(
                        "font-semibold text-sm text-foreground leading-tight",
                        task.status === "completed" && "line-through opacity-70"
                    )}>
                        {task.title}
                    </p>
                    {task.estimatedDays && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{task.estimatedDays} days</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Dependencies indicator */}
            {task.dependencies.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/10">
                    <span className="text-xs text-muted-foreground">
                        {task.dependencies.length} dependenc{task.dependencies.length === 1 ? "y" : "ies"}
                    </span>
                </div>
            )}

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-4 !h-4 !bg-gradient-to-br from-primary to-purple-500 !border-2 !border-background !-bottom-2"
            />
        </motion.div>
    );
}

export const TaskNode = memo(TaskNodeComponent);
