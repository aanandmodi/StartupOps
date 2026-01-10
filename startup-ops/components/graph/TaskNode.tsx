"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Task, Priority, TaskStatus } from "@/store/usePlanStore";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, AlertCircle, Loader2 } from "lucide-react";

interface TaskNodeData {
    task: Task;
}

const statusIcons: Record<TaskStatus, React.ElementType> = {
    pending: Circle,
    "in-progress": Loader2,
    completed: CheckCircle2,
    blocked: AlertCircle,
};

const statusColors: Record<TaskStatus, string> = {
    pending: "text-muted-foreground",
    "in-progress": "text-primary",
    completed: "text-status-healthy",
    blocked: "text-status-critical",
};

const priorityColors: Record<Priority, string> = {
    high: "bg-priority-high",
    medium: "bg-priority-medium",
    low: "bg-priority-low",
};

function TaskNodeComponent({ data }: NodeProps<TaskNodeData>) {
    const { task } = data;
    const StatusIcon = statusIcons[task.status];

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            className={cn(
                "px-4 py-3 rounded-xl backdrop-blur-xl bg-card/90 border-2 shadow-xl min-w-[180px] max-w-[220px]",
                task.status === "blocked"
                    ? "border-status-critical/50 shadow-status-critical/20"
                    : task.status === "completed"
                        ? "border-status-healthy/50 shadow-status-healthy/20"
                        : "border-white/20 shadow-primary/10"
            )}
        >
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 !bg-primary border-2 border-background"
            />

            {/* Node Content */}
            <div className="flex items-start gap-2">
                <StatusIcon
                    className={cn(
                        "w-4 h-4 mt-1 shrink-0",
                        statusColors[task.status],
                        task.status === "in-progress" && "animate-spin"
                    )}
                />
                <div className="flex-1 min-w-0">
                    <p className={cn(
                        "font-medium text-sm text-foreground leading-tight",
                        task.status === "completed" && "line-through opacity-70"
                    )}>
                        {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            priorityColors[task.priority]
                        )} />
                        <span className="text-xs text-muted-foreground capitalize">
                            {task.priority}
                        </span>
                    </div>
                </div>
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 !bg-primary border-2 border-background"
            />
        </motion.div>
    );
}

export const TaskNode = memo(TaskNodeComponent);
