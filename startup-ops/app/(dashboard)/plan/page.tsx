"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { usePlanStore, Category } from "@/store/usePlanStore";
import { useGoalStore } from "@/store/useGoalStore";
import { HealthPanel } from "@/components/health/HealthPanel";
import { AlertPanel } from "@/components/alerts/AlertPanel";
import { ExportsPanel } from "@/components/plan/ExportsPanel";
import { LoadingGrid } from "@/components/common/LoadingSkeleton";
import { getDashboard, convertBackendTask, convertBackendAlert } from "@/lib/api";
import { ListTodo, RefreshCw, Sparkles, Zap, Target, TrendingUp, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskCard } from "@/components/plan/TaskCard";
import { cn } from "@/lib/utils";

const categories: Category[] = ["product", "tech", "marketing", "finance", "operations", "hiring", "legal"];

const categoryIcons: Record<Category | "all", React.ElementType> = {
    all: Sparkles,
    product: Rocket,
    tech: Zap,
    marketing: TrendingUp,
    finance: Target,
    operations: ListTodo,
    hiring: Sparkles,
    legal: Sparkles,
};

const categoryColors: Record<Category | "all", string> = {
    all: "from-violet-500 to-purple-500",
    product: "from-blue-500 to-cyan-500",
    tech: "from-emerald-500 to-teal-500",
    marketing: "from-orange-500 to-amber-500",
    finance: "from-green-500 to-emerald-500",
    operations: "from-indigo-500 to-violet-500",
    hiring: "from-pink-500 to-rose-500",
    legal: "from-slate-500 to-zinc-500",
};

export default function PlanPage() {
    const router = useRouter();
    const { hasGeneratedPlan, startupId } = useGoalStore();
    const { tasks, setTasks, setAlerts, setHealthScore, setDriftPercentage, selectedCategory, setSelectedCategory, isLoading, setIsLoading } = usePlanStore();
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Redirect if no startup created
    useEffect(() => {
        if (!startupId && !hasGeneratedPlan) {
            router.push("/");
        }
    }, [startupId, hasGeneratedPlan, router]);

    // Force default category to be 'product' on mount if 'all' is selected
    useEffect(() => {
        if (selectedCategory === "all") {
            setSelectedCategory("product");
        }
    }, [selectedCategory, setSelectedCategory]);

    // Load data from API
    useEffect(() => {
        async function fetchDashboard() {
            if (!startupId) return;

            setIsLoading(true);
            try {
                const dashboard = await getDashboard(startupId);
                setTasks(dashboard.tasks.map(convertBackendTask));
                setAlerts(dashboard.alerts.map(convertBackendAlert));
                setHealthScore(dashboard.execution_health.score);
                setDriftPercentage(100 - dashboard.execution_health.score);
            } catch (error) {
                console.error("Failed to fetch dashboard:", error);
            } finally {
                setIsLoading(false);
            }
        }

        if (tasks.length === 0 && startupId) {
            fetchDashboard();
        }
    }, [startupId, tasks.length, setTasks, setAlerts, setHealthScore, setDriftPercentage, setIsLoading]);

    const handleRefresh = async () => {
        if (!startupId) return;

        setIsRefreshing(true);
        try {
            const dashboard = await getDashboard(startupId);
            setTasks(dashboard.tasks.map(convertBackendTask));
            setAlerts(dashboard.alerts.map(convertBackendAlert));
            setHealthScore(dashboard.execution_health.score);
            setDriftPercentage(100 - dashboard.execution_health.score);
        } catch (error) {
            console.error("Failed to refresh dashboard:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const currentTasks = tasks.filter(t => t.category === selectedCategory);
    const completedCount = currentTasks.filter(t => t.status === "completed").length;
    const progress = currentTasks.length > 0 ? (completedCount / currentTasks.length) * 100 : 0;
    const CategoryIcon = categoryIcons[selectedCategory] || Sparkles;

    return (
        <div className="min-h-screen p-6 lg:p-8">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
            </div>

            {/* Clean Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/5">
                        <ListTodo className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">
                            Execution Plan
                        </h1>
                        <p className="text-muted-foreground text-xs">
                            AI-generated roadmap tailored for your startup
                        </p>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
                {/* Main Content */}
                <div className="xl:col-span-3 space-y-6">

                    {/* Category Tabs - Frosted Lavender */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="relative"
                    >
                        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                            {categories.map((cat, index) => {
                                const count = tasks.filter(t => t.category === cat).length;
                                const isActive = selectedCategory === cat;
                                const Icon = categoryIcons[cat];

                                return (
                                    <motion.button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.02 }}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap border",
                                            isActive
                                                ? "bg-violet-100 dark:bg-[#2a2438] border-violet-200 dark:border-[#3d3450] text-violet-900 dark:text-white shadow-sm dark:shadow-none"
                                                : "bg-transparent border-gray-200 dark:border-zinc-800 text-muted-foreground hover:text-foreground hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-white/5"
                                        )}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        <span className={cn(
                                            "text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full transition-colors",
                                            isActive
                                                ? "bg-violet-200 dark:bg-[#4a3d5c] text-violet-700 dark:text-violet-300"
                                                : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500"
                                        )}>
                                            {count}
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Slim Progress Bar */}
                    {currentTasks.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-3 px-1"
                        >
                            <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full bg-violet-500/60"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                />
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {completedCount}/{currentTasks.length}
                            </span>
                        </motion.div>
                    )}

                    {/* Task Cards Grid */}
                    {isLoading ? (
                        <LoadingGrid count={6} variant="card" />
                    ) : currentTasks.length > 0 ? (
                        <motion.div
                            key={selectedCategory}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                            <AnimatePresence mode="popLayout">
                                {currentTasks.map((task, index) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <TaskCard task={task} categoryColor={categoryColors[selectedCategory]} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card p-16 text-center rounded-2xl border border-white/5"
                        >
                            <motion.div
                                animate={{ y: [0, -8, 0] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            >
                                <CategoryIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                            </motion.div>
                            <p className="text-lg font-medium text-foreground mb-2">No tasks yet</p>
                            <p className="text-muted-foreground text-sm">Tasks for {selectedCategory} will appear here</p>
                        </motion.div>
                    )}
                </div>

                {/* Sidebar Panels */}
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <HealthPanel />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <AlertPanel />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <ExportsPanel startupId={startupId} />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

