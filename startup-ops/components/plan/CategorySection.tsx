"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Task, Category, usePlanStore } from "@/store/usePlanStore";
import { categoryLabels, categoryColors } from "@/lib/mockData";
import { TaskCard } from "./TaskCard";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategorySectionProps {
    category: Category;
    tasks: Task[];
}

export function CategorySection({ category, tasks }: CategorySectionProps) {
    const { expandedCategories, toggleCategoryExpanded } = usePlanStore();
    const isExpanded = expandedCategories.includes(category);

    const completedCount = tasks.filter((t) => t.status === "completed").length;
    const totalCount = tasks.length;
    const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <motion.div
            layout
            className="mb-6"
        >
            {/* Category Header */}
            <motion.button
                onClick={() => toggleCategoryExpanded(category)}
                className="w-full flex items-center gap-4 p-4 glass-subtle rounded-xl hover:bg-accent/20 transition-colors group"
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
            >
                {/* Expand/Collapse Icon */}
                <motion.div
                    animate={{ rotate: isExpanded ? 0 : -90 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </motion.div>

                {/* Category Color Indicator */}
                <div className={cn("w-3 h-3 rounded-full", categoryColors[category])} />

                {/* Category Name */}
                <span className="font-semibold text-foreground flex-1 text-left">
                    {categoryLabels[category]}
                </span>

                {/* Task Count */}
                <span className="text-sm text-muted-foreground">
                    {completedCount}/{totalCount} tasks
                </span>

                {/* Progress Bar */}
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={cn("h-full rounded-full", categoryColors[category])}
                    />
                </div>
            </motion.button>

            {/* Tasks Grid */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 pl-12">
                            {tasks.map((task) => (
                                <TaskCard key={task.id} task={task} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
