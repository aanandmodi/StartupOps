"use client";

import { motion } from "framer-motion";
import { usePlanStore } from "@/store/usePlanStore";
import { cn } from "@/lib/utils";
import { Activity, TrendingDown, CheckCircle2, Clock, AlertCircle, Zap } from "lucide-react";

export function HealthPanel() {
    const { healthScore, driftPercentage, tasks } = usePlanStore();

    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const inProgressTasks = tasks.filter((t) => t.status === "in-progress").length;
    const blockedTasks = tasks.filter((t) => t.status === "blocked").length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const healthStatus = healthScore >= 80 ? "healthy" : healthScore >= 50 ? "warning" : "critical";
    const healthConfig = {
        healthy: { color: "text-emerald-400", label: "Excellent" },
        warning: { color: "text-amber-400", label: "Warning" },
        critical: { color: "text-muted-foreground", label: "Critical" },
    };

    const currentConfig = healthConfig[healthStatus];

    return (
        <motion.div
            className="glass-card p-5 space-y-5 rounded-2xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <Activity className="w-4 h-4 text-primary" />
                </div>
                <div>
                    <h3 className="font-medium text-sm text-foreground">Execution Health</h3>
                    <p className="text-[10px] text-muted-foreground">Real-time project status</p>
                </div>
            </div>

            {/* Health Score Circle */}
            <div className="flex items-center justify-center py-4">
                <div className="relative w-28 h-28">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="text-white/5"
                        />
                        {/* Progress circle */}
                        <motion.circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            strokeWidth="3"
                            strokeLinecap="round"
                            className={currentConfig.color}
                            initial={{ strokeDasharray: "0 264" }}
                            animate={{
                                strokeDasharray: `${(healthScore / 100) * 264} 264`,
                            }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-3xl font-semibold text-foreground"
                        >
                            {healthScore}
                        </motion.span>
                        <span className="text-[10px] text-muted-foreground">{currentConfig.label}</span>
                    </div>
                </div>
            </div>

            {/* Plan Drift */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-white/5">
                        <TrendingDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div>
                        <span className="text-xs font-medium text-foreground">Plan Drift</span>
                        <p className="text-[10px] text-muted-foreground">From original timeline</p>
                    </div>
                </div>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                    {driftPercentage}%
                </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
                {[
                    { label: "Completed", value: completedTasks, icon: CheckCircle2 },
                    { label: "In Progress", value: inProgressTasks, icon: Zap },
                    { label: "Blocked", value: blockedTasks, icon: AlertCircle },
                    { label: "Done Rate", value: `${completionRate}%`, icon: Clock },
                ].map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * index }}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center"
                    >
                        <div className="flex items-center justify-center gap-1.5 mb-0.5">
                            <stat.icon className="w-3 h-3 text-muted-foreground" />
                            <span className="text-lg font-semibold text-foreground tabular-nums">
                                {stat.value}
                            </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
