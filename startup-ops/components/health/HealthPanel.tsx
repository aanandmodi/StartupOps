"use client";

import { motion } from "framer-motion";
import { usePlanStore } from "@/store/usePlanStore";
import { cn } from "@/lib/utils";
import { Activity, TrendingDown, TrendingUp, Target, Zap, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export function HealthPanel() {
    const { healthScore, driftPercentage, tasks } = usePlanStore();

    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const inProgressTasks = tasks.filter((t) => t.status === "in-progress").length;
    const blockedTasks = tasks.filter((t) => t.status === "blocked").length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const healthStatus = healthScore >= 80 ? "healthy" : healthScore >= 50 ? "warning" : "critical";
    const healthConfig = {
        healthy: {
            color: "text-emerald-400",
            gradient: "from-emerald-500 to-green-500",
            bg: "bg-emerald-500/10",
            label: "Excellent"
        },
        warning: {
            color: "text-amber-400",
            gradient: "from-amber-500 to-yellow-500",
            bg: "bg-amber-500/10",
            label: "Needs Attention"
        },
        critical: {
            color: "text-red-400",
            gradient: "from-red-500 to-orange-500",
            bg: "bg-red-500/10",
            label: "Critical"
        },
    };

    const currentConfig = healthConfig[healthStatus];

    return (
        <motion.div
            className="glass-card p-6 space-y-6 rounded-2xl overflow-hidden relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Ambient Glow */}
            <div className={cn(
                "absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20",
                healthStatus === "healthy" ? "bg-emerald-500" :
                    healthStatus === "warning" ? "bg-amber-500" : "bg-red-500"
            )} />

            {/* Header */}
            <div className="flex items-center gap-3 relative">
                <motion.div
                    className={cn("p-2 rounded-xl", currentConfig.bg)}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                >
                    <Activity className={cn("w-5 h-5", currentConfig.color)} />
                </motion.div>
                <div>
                    <h3 className="font-semibold text-foreground">Execution Health</h3>
                    <p className="text-xs text-muted-foreground">Real-time project status</p>
                </div>
            </div>

            {/* Health Score Circle - Enhanced */}
            <div className="flex items-center justify-center py-2">
                <div className="relative w-36 h-36">
                    {/* Outer glow ring */}
                    <div className={cn(
                        "absolute inset-0 rounded-full blur-lg opacity-30",
                        `bg-gradient-to-br ${currentConfig.gradient}`
                    )} />

                    <svg className="w-full h-full transform -rotate-90 relative" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="6"
                            className="text-white/5"
                        />
                        {/* Progress circle */}
                        <motion.circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            strokeWidth="6"
                            strokeLinecap="round"
                            className={currentConfig.color}
                            initial={{ strokeDasharray: "0 251.2", stroke: "currentColor" }}
                            animate={{
                                strokeDasharray: `${(healthScore / 100) * 251.2} 251.2`,
                            }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            style={{
                                filter: `drop-shadow(0 0 8px currentColor)`
                            }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5, type: "spring" }}
                            className={cn("text-4xl font-bold", currentConfig.color)}
                        >
                            {healthScore}
                        </motion.span>
                        <span className="text-xs text-muted-foreground font-medium mt-1">{currentConfig.label}</span>
                    </div>
                </div>
            </div>

            {/* Drift Indicator - Enhanced */}
            <motion.div
                className={cn(
                    "flex items-center justify-between p-4 rounded-xl border backdrop-blur-sm",
                    driftPercentage > 15 ? "bg-red-500/5 border-red-500/20" :
                        driftPercentage > 5 ? "bg-amber-500/5 border-amber-500/20" :
                            "bg-emerald-500/5 border-emerald-500/20"
                )}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
            >
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-2 rounded-lg",
                        driftPercentage > 15 ? "bg-red-500/10" :
                            driftPercentage > 5 ? "bg-amber-500/10" : "bg-emerald-500/10"
                    )}>
                        {driftPercentage > 15 ? (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                        ) : driftPercentage > 5 ? (
                            <TrendingUp className="w-4 h-4 text-amber-400" />
                        ) : (
                            <Target className="w-4 h-4 text-emerald-400" />
                        )}
                    </div>
                    <div>
                        <span className="text-sm font-medium text-foreground">Plan Drift</span>
                        <p className="text-xs text-muted-foreground">From original timeline</p>
                    </div>
                </div>
                <span className={cn(
                    "text-lg font-bold tabular-nums",
                    driftPercentage > 15 ? "text-red-400" :
                        driftPercentage > 5 ? "text-amber-400" : "text-emerald-400"
                )}>
                    {driftPercentage}%
                </span>
            </motion.div>

            {/* Quick Stats Grid - Enhanced */}
            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: "Completed", value: completedTasks, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                    { label: "In Progress", value: inProgressTasks, icon: Zap, color: "text-blue-400", bg: "bg-blue-500/10" },
                    { label: "Blocked", value: blockedTasks, icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
                    { label: "Done Rate", value: `${completionRate}%`, icon: Clock, color: "text-purple-400", bg: "bg-purple-500/10" },
                ].map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ scale: 1.03, y: -2 }}
                        className={cn(
                            "p-3 rounded-xl backdrop-blur-sm border border-white/5 text-center",
                            stat.bg
                        )}
                    >
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                            <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
                            <div className={cn("text-xl font-bold tabular-nums", stat.color)}>
                                {stat.value}
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
