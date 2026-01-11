"use client";

import { motion } from "framer-motion";
import { FileText, Calendar, DollarSign, Share2, Download, FileCode, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExportsPanelProps {
    startupId: number | null;
}

export function ExportsPanel({ startupId }: ExportsPanelProps) {
    if (!startupId) return null;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const baseUrl = `${API_URL}/startup/${startupId}/export`;

    const exports = [
        {
            name: "Master Plan",
            description: "Complete Startup Bible",
            icon: Sparkles,
            url: `${baseUrl}/master-plan`,
            gradient: "from-yellow-500 to-orange-500",
            bg: "bg-yellow-500/10",
            border: "border-yellow-500/20",
            featured: true,
        },
        {
            name: "Product Doc",
            description: "Requirements & Features",
            icon: FileText,
            url: `${baseUrl}/prd`,
            gradient: "from-blue-500 to-cyan-500",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
        },
        {
            name: "Tech Stack",
            description: "Architecture & APIs",
            icon: FileCode,
            url: `${baseUrl}/architecture`,
            gradient: "from-cyan-500 to-teal-500",
            bg: "bg-cyan-500/10",
            border: "border-cyan-500/20",
        },
        {
            name: "Budget",
            description: "Financial Forecast",
            icon: DollarSign,
            url: `${baseUrl}/budget`,
            gradient: "from-green-500 to-emerald-500",
            bg: "bg-green-500/10",
            border: "border-green-500/20",
        },
        {
            name: "Calendar",
            description: "Launch Timeline",
            icon: Calendar,
            url: `${baseUrl}/calendar`,
            gradient: "from-purple-500 to-violet-500",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20",
        },
        {
            name: "Social Posts",
            description: "Marketing Content",
            icon: Share2,
            url: `${baseUrl}/posts`,
            gradient: "from-pink-500 to-rose-500",
            bg: "bg-pink-500/10",
            border: "border-pink-500/20",
        },
    ];

    return (
        <motion.div
            className="glass-card p-6 rounded-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <motion.div
                    className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                >
                    <Download className="w-5 h-5 text-primary" />
                </motion.div>
                <div>
                    <h3 className="font-semibold text-lg">Export Artifacts</h3>
                    <p className="text-xs text-muted-foreground">Download your startup docs</p>
                </div>
            </div>

            {/* Export Items */}
            <div className="space-y-2">
                {exports.map((item, index) => (
                    <motion.a
                        key={item.name}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                            "block relative group rounded-xl transition-all duration-300",
                            item.featured && "mb-3"
                        )}
                    >
                        {/* Featured item gets special styling */}
                        {item.featured ? (
                            <div className="relative">
                                {/* Gradient border for featured */}
                                <div className={cn(
                                    "absolute -inset-[1px] rounded-xl bg-gradient-to-r opacity-70 group-hover:opacity-100 transition-opacity blur-[1px]",
                                    item.gradient
                                )} />
                                <div className={cn(
                                    "relative flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card/95 dark:bg-card/80 backdrop-blur-xl"
                                )}>
                                    <div className={cn(
                                        "p-2.5 rounded-lg bg-gradient-to-br shadow-lg",
                                        item.gradient
                                    )}>
                                        <item.icon className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                                            {item.name}
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 font-medium">
                                                RECOMMENDED
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">{item.description}</div>
                                    </div>
                                    <Download className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-y-0.5 transition-all" />
                                </div>
                            </div>
                        ) : (
                            <div className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm",
                                "bg-white/5 hover:bg-white/10",
                                item.border,
                                "group-hover:border-white/20 transition-all"
                            )}>
                                <div className={cn("p-2 rounded-lg transition-colors", item.bg)}>
                                    <item.icon className={cn(
                                        "w-4 h-4 transition-colors",
                                        `text-${item.gradient.split('-')[1]}-400`
                                    )} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-foreground">{item.name}</div>
                                    <div className="text-xs text-muted-foreground">{item.description}</div>
                                </div>
                                <Download className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        )}
                    </motion.a>
                ))}
            </div>

            {/* Footer hint */}
            <motion.p
                className="text-[11px] text-muted-foreground/60 text-center mt-4 pt-4 border-t border-white/5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                All documents generated by AI agents in real-time
            </motion.p>
        </motion.div>
    );
}
