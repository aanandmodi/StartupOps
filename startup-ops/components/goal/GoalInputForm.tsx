"use client";

import { useState } from "react";
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
import { GlassCard } from "@/components/common/GlassCard";
import { useGoalStore } from "@/store/useGoalStore";
import { usePlanStore } from "@/store/usePlanStore";
import { generateExecutionPlan } from "@/lib/api";
import { domainOptions } from "@/lib/mockData";
import { Sparkles, Users, Globe, Rocket, Loader2, AlertCircle } from "lucide-react";

export function GoalInputForm() {
    const router = useRouter();
    const { setGoal, setIsGenerating, isGenerating, setHasGeneratedPlan, setStartupId } = useGoalStore();
    const { setTasks, setAlerts, setHealthScore, setDriftPercentage } = usePlanStore();

    const [startupGoal, setStartupGoal] = useState("");
    const [teamSize, setTeamSize] = useState<number>(3);
    const [domain, setDomain] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!startupGoal || !domain) return;

        const goal = { startupGoal, teamSize, domain };
        setGoal(goal);
        setIsGenerating(true);

        try {
            // Call real backend API
            const { tasks, alerts, startupId, executionHealth } = await generateExecutionPlan(goal);

            // Store data in Zustand stores
            setTasks(tasks);
            setAlerts(alerts);
            setStartupId(startupId);
            setHealthScore(executionHealth.score);
            setDriftPercentage(100 - executionHealth.score);
            setHasGeneratedPlan(true);

            // Navigate to plan page
            router.push("/plan");
        } catch (error) {
            console.error("Failed to generate plan:", error);
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to connect to AI backend. Make sure the server is running."
            );
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-2xl mx-auto"
        >
            <GlassCard className="relative overflow-hidden" glow>
                {/* Decorative gradient orb */}
                <div className="absolute -top-20 -right-20 w-40 h-40 gradient-primary rounded-full opacity-20 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500 rounded-full opacity-20 blur-3xl" />

                <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4"
                        >
                            <Rocket className="w-8 h-8 text-white" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-foreground">
                            Launch Your Startup Journey
                        </h2>
                        <p className="text-muted-foreground">
                            Tell us about your vision and our AI agents will create a comprehensive execution plan
                        </p>
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400"
                            >
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Startup Goal */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Sparkles className="w-4 h-4 text-primary" />
                            What&apos;s your startup goal?
                        </label>
                        <Textarea
                            placeholder="e.g., Build a B2B SaaS platform that helps small businesses automate their customer support with AI..."
                            value={startupGoal}
                            onChange={(e) => setStartupGoal(e.target.value)}
                            className="min-h-[120px] resize-none bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200"
                            required
                        />
                    </div>

                    {/* Team Size & Domain */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Users className="w-4 h-4 text-primary" />
                                Team Size
                            </label>
                            <Input
                                type="number"
                                min={1}
                                max={100}
                                value={teamSize}
                                onChange={(e) => setTeamSize(parseInt(e.target.value) || 1)}
                                className="bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200"
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Globe className="w-4 h-4 text-primary" />
                                Domain / Industry
                            </label>
                            <Select value={domain} onValueChange={setDomain} required>
                                <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200">
                                    <SelectValue placeholder="Select your domain" />
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
                    </div>

                    {/* Submit Button */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            type="submit"
                            disabled={isGenerating || !startupGoal || !domain}
                            className="w-full h-14 text-lg font-semibold gradient-primary text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            <AnimatePresence mode="wait">
                                {isGenerating ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-3"
                                    >
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>AI Agents Working...</span>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="submit"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-3"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        <span>Generate AI Execution Plan</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Button>
                    </motion.div>

                    {/* Agent info */}
                    {isGenerating && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center text-sm text-muted-foreground"
                        >
                            <p>5 AI agents are analyzing your startup...</p>
                            <p className="text-xs mt-1">Product • Tech • Marketing • Finance • Advisor</p>
                        </motion.div>
                    )}
                </form>
            </GlassCard>
        </motion.div>
    );
}
