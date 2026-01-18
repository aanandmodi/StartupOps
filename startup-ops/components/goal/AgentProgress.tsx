"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AgentStatus {
    name: string;
    displayName: string;
    status: "pending" | "running" | "complete" | "error";
    message?: string;
}

interface AgentProgressProps {
    agents: AgentStatus[];
    currentAgent: string | null;
    progress: number;
    isComplete: boolean;
    error?: string | null;
}

const agentColors: Record<string, string> = {
    product: "from-blue-500 to-cyan-500",
    tech: "from-purple-500 to-pink-500",
    marketing: "from-orange-500 to-yellow-500",
    finance: "from-emerald-500 to-teal-500",
    advisor: "from-indigo-500 to-violet-500",
};

const agentIcons: Record<string, string> = {
    product: "🎯",
    tech: "⚙️",
    marketing: "📣",
    finance: "💰",
    advisor: "🧠",
};

export function AgentProgress({
    agents,
    currentAgent,
    progress,
    isComplete,
    error,
}: AgentProgressProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto"
        >
            {/* Main Progress Card */}
            <div className="glass-card p-6 rounded-2xl border border-white/10 overflow-hidden relative">
                {/* Background gradient animation */}
                <div className="absolute inset-0 opacity-10">
                    <motion.div
                        className={cn(
                            "absolute inset-0 bg-gradient-to-r",
                            currentAgent ? agentColors[currentAgent] : "from-blue-500 to-purple-500"
                        )}
                        animate={{
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                </div>

                {/* Header */}
                <div className="relative z-10 flex items-center gap-3 mb-6">
                    <motion.div
                        className="p-2 rounded-xl bg-primary/10"
                        animate={{ rotate: isComplete ? 0 : 360 }}
                        transition={{ duration: 2, repeat: isComplete ? 0 : Infinity, ease: "linear" }}
                    >
                        <Sparkles className="w-5 h-5 text-primary" />
                    </motion.div>
                    <div>
                        <h3 className="font-semibold text-foreground">
                            {isComplete ? "AI Co-Founders Ready!" : "Building Your Startup..."}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {isComplete
                                ? "All agents have completed their analysis"
                                : `${progress}% complete`}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="relative z-10 mb-6">
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className={cn(
                                "h-full rounded-full bg-gradient-to-r",
                                currentAgent ? agentColors[currentAgent] : "from-blue-500 to-purple-500"
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        />
                    </div>
                </div>

                {/* Agent List */}
                <div className="relative z-10 space-y-3">
                    <AnimatePresence>
                        {agents.map((agent, index) => (
                            <motion.div
                                key={agent.name}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl transition-all duration-300",
                                    agent.status === "running"
                                        ? "bg-white/10 border border-white/20"
                                        : agent.status === "complete"
                                            ? "bg-white/5"
                                            : "bg-transparent"
                                )}
                            >
                                {/* Agent Icon */}
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
                                        agent.status === "running"
                                            ? `bg-gradient-to-br ${agentColors[agent.name]}`
                                            : agent.status === "complete"
                                                ? "bg-emerald-500/20"
                                                : "bg-white/5"
                                    )}
                                >
                                    {agent.status === "running" ? (
                                        <motion.span
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                        >
                                            {agentIcons[agent.name]}
                                        </motion.span>
                                    ) : agent.status === "complete" ? (
                                        <Check className="w-5 h-5 text-emerald-500" />
                                    ) : agent.status === "error" ? (
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                    ) : (
                                        <span className="opacity-40">{agentIcons[agent.name]}</span>
                                    )}
                                </div>

                                {/* Agent Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={cn(
                                                "font-medium text-sm",
                                                agent.status === "running"
                                                    ? "text-foreground"
                                                    : agent.status === "complete"
                                                        ? "text-muted-foreground"
                                                        : "text-muted-foreground/50"
                                            )}
                                        >
                                            {agent.displayName}
                                        </span>
                                        {agent.status === "running" && (
                                            <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                        )}
                                    </div>
                                    {agent.message && agent.status === "running" && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-xs text-muted-foreground mt-0.5"
                                        >
                                            {agent.message}
                                        </motion.p>
                                    )}
                                </div>

                                {/* Status Badge */}
                                {agent.status === "complete" && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400"
                                    >
                                        Done
                                    </motion.span>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Error Display */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                    >
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
