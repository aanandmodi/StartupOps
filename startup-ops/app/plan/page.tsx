"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { usePlanStore, Category } from "@/store/usePlanStore";
import { useGoalStore } from "@/store/useGoalStore";
import { CategorySection } from "@/components/plan/CategorySection";
import { HealthPanel } from "@/components/health/HealthPanel";
import { AlertPanel } from "@/components/alerts/AlertPanel";
import { LoadingGrid } from "@/components/common/LoadingSkeleton";
import { getDashboard, convertBackendTask, convertBackendAlert } from "@/lib/api";
import { ListTodo, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const categories: Category[] = ["product", "marketing", "finance", "operations", "hiring", "legal"];

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

    const filteredCategories = selectedCategory === "all"
        ? categories
        : categories.filter((c) => c === selectedCategory);

    const getTasksByCategory = (category: Category) =>
        tasks.filter((task) => task.category === category);

    return (
        <div className="min-h-screen p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl gradient-primary">
                            <ListTodo className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground">Execution Plan</h1>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
                <p className="text-muted-foreground ml-14">
                    AI-generated execution tasks for your startup
                </p>
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Main Content */}
                <div className="xl:col-span-3 space-y-4">
                    {/* Filter Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-4 flex items-center gap-4 flex-wrap"
                    >
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Filter className="w-4 h-4" />
                            <span className="text-sm font-medium">Filter:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant={selectedCategory === "all" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedCategory("all")}
                                className={selectedCategory === "all" ? "gradient-primary text-white border-0" : ""}
                            >
                                All
                                <Badge variant="secondary" className="ml-2 bg-white/20">
                                    {tasks.length}
                                </Badge>
                            </Button>
                            {categories.map((cat) => {
                                const count = getTasksByCategory(cat).length;
                                if (count === 0) return null;
                                return (
                                    <Button
                                        key={cat}
                                        variant={selectedCategory === cat ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSelectedCategory(cat)}
                                        className={selectedCategory === cat ? "gradient-primary text-white border-0" : ""}
                                    >
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        <Badge variant="secondary" className="ml-2 bg-white/20">
                                            {count}
                                        </Badge>
                                    </Button>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Category Sections */}
                    {isLoading ? (
                        <LoadingGrid count={6} variant="card" />
                    ) : tasks.length > 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            {filteredCategories.map((category) => {
                                const categoryTasks = getTasksByCategory(category);
                                if (categoryTasks.length === 0) return null;
                                return (
                                    <CategorySection
                                        key={category}
                                        category={category}
                                        tasks={categoryTasks}
                                    />
                                );
                            })}
                        </motion.div>
                    ) : (
                        <div className="glass-card p-12 text-center">
                            <p className="text-muted-foreground">No tasks generated yet.</p>
                            <Button
                                className="mt-4 gradient-primary text-white"
                                onClick={() => router.push("/")}
                            >
                                Create Execution Plan
                            </Button>
                        </div>
                    )}
                </div>

                {/* Sidebar Panels */}
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <HealthPanel />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <AlertPanel />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
