"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    Building2,
    Plus,
    Clock,
    Activity,
    ChevronRight,
    Archive,
    Trash2,
    MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGoalStore } from "@/store/useGoalStore";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Startup {
    id: number;
    name: string | null;
    domain: string;
    goal: string;
    status: string;
    created_at: string;
    updated_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
    active: "bg-green-500/20 text-green-400 border-green-500/30",
    archived: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export function StartupSelector() {
    const [startups, setStartups] = useState<Startup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMenu, setSelectedMenu] = useState<number | null>(null);

    const router = useRouter();
    const { setStartupId, reset } = useGoalStore();

    useEffect(() => {
        loadStartups();
    }, []);

    const loadStartups = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/startups/all`);
            if (response.ok) {
                const data = await response.json();
                setStartups(data);
            }
        } catch (error) {
            console.error("Failed to load startups:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const selectStartup = (startup: Startup) => {
        setStartupId(startup.id);
        router.push("/plan");
    };

    const createNewStartup = () => {
        reset();
        router.push("/");
    };

    const archiveStartup = async (id: number) => {
        try {
            await fetch(`${API_URL}/startups/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "archived" })
            });
            loadStartups();
        } catch (error) {
            console.error("Failed to archive startup:", error);
        }
        setSelectedMenu(null);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    if (isLoading) {
        return (
            <div className="glass-card p-8 text-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl" />
                    <div className="h-4 w-32 bg-white/10 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">Your Startups</h2>
                        <p className="text-sm text-muted-foreground">
                            {startups.length} startup{startups.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
                <Button onClick={createNewStartup}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Startup
                </Button>
            </div>

            {/* Startups Grid */}
            {startups.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-12 text-center"
                >
                    <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                    <h3 className="text-lg font-semibold mb-2">No startups yet</h3>
                    <p className="text-muted-foreground mb-6">
                        Create your first startup to get started with your AI co-founders.
                    </p>
                    <Button onClick={createNewStartup}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Startup
                    </Button>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {startups.map((startup, index) => (
                            <motion.div
                                key={startup.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.05 }}
                                className="glass-card p-5 rounded-xl cursor-pointer hover:bg-white/10 transition-all group relative"
                                onClick={() => selectStartup(startup)}
                            >
                                {/* Status Badge */}
                                <div className="flex items-center justify-between mb-3">
                                    <span className={cn(
                                        "px-2 py-1 rounded-full text-xs font-medium border",
                                        STATUS_COLORS[startup.status] || STATUS_COLORS.active
                                    )}>
                                        {startup.status}
                                    </span>

                                    {/* Menu Button */}
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedMenu(selectedMenu === startup.id ? null : startup.id);
                                            }}
                                            className="p-1 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </button>

                                        {selectedMenu === startup.id && (
                                            <div
                                                className="absolute right-0 top-8 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-10 min-w-[120px]"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={() => archiveStartup(startup.id)}
                                                    className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2"
                                                >
                                                    <Archive className="w-4 h-4" />
                                                    Archive
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                                    {startup.name || startup.domain}
                                </h3>

                                {/* Goal */}
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                    {startup.goal}
                                </p>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        {formatDate(startup.created_at)}
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
