"use client";

import { motion } from "framer-motion";
import { usePlanStore } from "@/store/usePlanStore";
import { cn } from "@/lib/utils";
import { Activity, TrendingDown, TrendingUp, Target } from "lucide-react";

export function HealthPanel() {
    const { healthScore, driftPercentage, tasks } = usePlanStore();

    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const inProgressTasks = tasks.filter((t) => t.status === "in-progress").length;
    const blockedTasks = tasks.filter((t) => t.status === "blocked").length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const healthStatus = healthScore >= 80 ? "healthy" : healthScore >= 50 ? "warning" : "critical";
    const healthColors = {
        healthy: "text-status-healthy",
        warning: "text-status-warning",
        critical: "text-status-critical",
    };

    return (
        <div className="glass-card p-6 space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <Activity className={cn("w-5 h-5", healthColors[healthStatus])} />
                <h3 className="font-semibold text-foreground">Execution Health</h3>
            </div>

            {/* Health Score Circle */}
            <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-muted"
                        />
                        {/* Progress circle */}
                        <motion.circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeLinecap="round"
                            className={healthColors[healthStatus]}
                            initial={{ strokeDasharray: "0 251.2" }}
                            animate={{
                                strokeDasharray: `${(healthScore / 100) * 251.2} 251.2`,
                            }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className={cn("text-3xl font-bold", healthColors[healthStatus])}
                        >
                            {healthScore}%
                        </motion.span>
                        <span className="text-xs text-muted-foreground capitalize">{healthStatus}</span>
                    </div>
                </div>
            </div>

            {/* Drift Indicator */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                    {driftPercentage > 15 ? (
                        <TrendingDown className="w-4 h-4 text-status-critical" />
                    ) : driftPercentage > 5 ? (
                        <TrendingUp className="w-4 h-4 text-status-warning" />
                    ) : (
                        <Target className="w-4 h-4 text-status-healthy" />
                    )}
                    <span className="text-sm text-foreground">Plan Drift</span>
                </div>
                <span className={cn(
                    "text-sm font-semibold",
                    driftPercentage > 15 ? "text-status-critical" :
                        driftPercentage > 5 ? "text-status-warning" : "text-status-healthy"
                )}>
                    {driftPercentage}%
                </span>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <div className="text-2xl font-bold text-status-healthy">{completedTasks}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">{inProgressTasks}</div>
                    <div className="text-xs text-muted-foreground">In Progress</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <div className="text-2xl font-bold text-status-critical">{blockedTasks}</div>
                    <div className="text-xs text-muted-foreground">Blocked</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <div className="text-2xl font-bold text-foreground">{completionRate}%</div>
                    <div className="text-xs text-muted-foreground">Done</div>
                </div>
            </div>
        </div>
    );
}
