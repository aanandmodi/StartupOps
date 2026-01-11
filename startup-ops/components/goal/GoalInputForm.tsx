"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useGoalStore } from "@/store/useGoalStore";
import { usePlanStore } from "@/store/usePlanStore";
import { useMetricsStore } from "@/store/useMetricsStore";
import { generateExecutionPlan } from "@/lib/api";
import { domainOptions } from "@/lib/mockData";
import { Sparkles, ArrowRight, Loader2, AlertCircle, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function GoalInputForm() {
    const router = useRouter();
    const { setGoal, setIsGenerating, isGenerating, setHasGeneratedPlan, setStartupId } = useGoalStore();
    const { setTasks, setAlerts, setHealthScore, setDriftPercentage } = usePlanStore();
    const { setMarketingMetrics, setFinanceMetrics } = useMetricsStore();

    // Reset generating state on mount
    useEffect(() => {
        setIsGenerating(false);
    }, [setIsGenerating]);

    const [startupGoal, setStartupGoal] = useState("");
    const [teamSize, setTeamSize] = useState<number>(3);
    const [domain, setDomain] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [showOptions, setShowOptions] = useState(false);

    const handleSubmit = async () => {
        if (!startupGoal) return;
        // Default domain if not selected to avoid blocking, or force selection?
        // Let's default to SaaS if empty for smoother detailed demo, or ask user.
        // For this UI, let's force domain selection if we want valid data, or pick first.
        const activeDomain = domain || "saas";

        setError(null);

        const goal = { startupGoal, teamSize, domain: activeDomain };
        setGoal(goal);
        setIsGenerating(true);

        try {
            const { tasks, alerts, startupId, executionHealth, metrics } = await generateExecutionPlan(goal);

            setTasks(tasks);
            setAlerts(alerts);
            setStartupId(startupId);
            setHealthScore(executionHealth.score);
            setDriftPercentage(100 - executionHealth.score);
            setMarketingMetrics(metrics.marketing);
            setFinanceMetrics(metrics.finance);
            setHasGeneratedPlan(true);

            router.push("/plan");
        } catch (error) {
            console.error("Failed to generate plan:", error);
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to connect to AI backend."
            );
            setIsGenerating(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto relative group">
            {/* Main Input Wrapper */}
            <div
                className={cn(
                    "relative flex flex-col bg-[#111] border border-white/10 rounded-2xl overflow-hidden transition-all duration-300",
                    "group-hover:border-white/20 group-focus-within:border-primary/50 group-focus-within:ring-1 group-focus-within:ring-primary/50 group-focus-within:shadow-[0_0_30px_-5px_oklch(0.55_0.25_260_/_0.2)]"
                )}
            >
                <Textarea
                    placeholder="Describe your startup idea..."
                    value={startupGoal}
                    onChange={(e) => setStartupGoal(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isGenerating}
                    className="w-full min-h-[120px] p-6 text-lg bg-transparent border-0 focus-visible:ring-0 resize-none placeholder:text-muted-foreground/50"
                />

                {/* Bottom Actions Bar */}
                <div className="flex items-center justify-between px-4 pb-4 bg-transparent">

                    {/* Options Toggle */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowOptions(!showOptions)}
                            className={cn("text-muted-foreground hover:text-white gap-2 transition-colors", showOptions && "text-primary")}
                        >
                            <Settings2 className="w-4 h-4" />
                            <span className="text-xs">Config</span>
                        </Button>

                        {/* Inline options if visible */}
                        <AnimatePresence>
                            {showOptions && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="flex items-center gap-2"
                                >
                                    <div className="h-4 w-[1px] bg-white/10 mx-1" />

                                    <div className="w-20">
                                        <Input
                                            type="number"
                                            min={1}
                                            value={teamSize}
                                            onChange={(e) => setTeamSize(parseInt(e.target.value) || 1)}
                                            className="h-8 text-xs bg-[#222] border-white/10"
                                        />
                                    </div>

                                    <div className="w-32">
                                        <Select value={domain} onValueChange={setDomain}>
                                            <SelectTrigger className="h-8 text-xs bg-[#222] border-white/10">
                                                <SelectValue placeholder="Domain" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {domainOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Submit Button */}
                    <Button
                        onClick={handleSubmit}
                        disabled={!startupGoal || isGenerating}
                        size="icon"
                        className={cn(
                            "rounded-xl w-10 h-10 transition-all duration-300",
                            startupGoal ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-white/5 text-white/20"
                        )}
                    >
                        {isGenerating ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <ArrowRight className="w-5 h-5" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute -bottom-12 left-0 right-0 text-center"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
