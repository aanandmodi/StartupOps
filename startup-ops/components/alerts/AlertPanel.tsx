"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Alert, usePlanStore } from "@/store/usePlanStore";
import { cn } from "@/lib/utils";
import {
    AlertTriangle,
    AlertCircle,
    Info,
    X,
    Bell,
    ChevronRight,
    Sparkles,
    Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface AlertCardProps {
    alert: Alert;
    index: number;
}

const alertConfig = {
    urgent: {
        icon: AlertCircle,
        bgColor: "bg-gradient-to-r from-red-500/10 to-orange-500/5",
        borderColor: "border-red-500/20",
        iconColor: "text-red-400",
        glowColor: "shadow-red-500/10",
    },
    warning: {
        icon: AlertTriangle,
        bgColor: "bg-gradient-to-r from-amber-500/10 to-yellow-500/5",
        borderColor: "border-amber-500/20",
        iconColor: "text-amber-400",
        glowColor: "shadow-amber-500/10",
    },
    info: {
        icon: Info,
        bgColor: "bg-gradient-to-r from-blue-500/10 to-cyan-500/5",
        borderColor: "border-blue-500/20",
        iconColor: "text-blue-400",
        glowColor: "shadow-blue-500/10",
    },
};

function AlertCard({ alert, index }: AlertCardProps) {
    const { dismissAlert } = usePlanStore();
    const config = alertConfig[alert.type];
    const Icon = config.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02, x: 4 }}
            className={cn(
                "p-4 rounded-xl border backdrop-blur-sm shadow-lg transition-all duration-300",
                config.bgColor,
                config.borderColor,
                config.glowColor
            )}
        >
            <div className="flex items-start gap-3">
                <motion.div
                    className={cn("p-2 rounded-lg bg-white/5", config.bgColor)}
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                >
                    <Icon className={cn("w-4 h-4", config.iconColor)} />
                </motion.div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground text-sm mb-1 line-clamp-1">
                        {alert.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-2 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                    </p>
                </div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => dismissAlert(alert.id)}
                        className="shrink-0 w-7 h-7 rounded-lg hover:bg-white/10 hover:text-foreground"
                    >
                        <X className="w-3.5 h-3.5" />
                    </Button>
                </motion.div>
            </div>
        </motion.div>
    );
}

export function AlertPanel() {
    const { alerts } = usePlanStore();

    const urgentCount = alerts.filter(a => a.type === "urgent").length;
    const warningCount = alerts.filter(a => a.type === "warning").length;

    return (
        <motion.div
            className="glass-card p-6 space-y-4 rounded-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <motion.div
                        className="p-2 rounded-xl bg-amber-500/10"
                        animate={{ rotate: alerts.length > 0 ? [0, -5, 5, 0] : 0 }}
                        transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                    >
                        <Bell className="w-5 h-5 text-amber-400" />
                    </motion.div>
                    <div>
                        <h3 className="font-semibold text-foreground">Alerts</h3>
                        <p className="text-xs text-muted-foreground">Action items & warnings</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {urgentCount > 0 && (
                        <span className="text-xs font-medium px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                            {urgentCount} urgent
                        </span>
                    )}
                    {warningCount > 0 && (
                        <span className="text-xs font-medium px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {warningCount} warning
                        </span>
                    )}
                </div>
            </div>

            {/* Alerts List */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                <AnimatePresence>
                    {alerts.length > 0 ? (
                        alerts.map((alert, index) => (
                            <AlertCard key={alert.id} alert={alert} index={index} />
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-10"
                        >
                            <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            >
                                <Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
                            </motion.div>
                            <p className="text-sm font-medium text-foreground mb-1">All caught up!</p>
                            <p className="text-xs text-muted-foreground">No active alerts</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* AI Recommendations - Enhanced */}
            <div className="pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Insights</span>
                </div>
                <div className="space-y-2">
                    {[
                        { text: "Consider parallelizing backend and frontend tasks", icon: Lightbulb },
                        { text: "Schedule hiring process earlier to avoid delays", icon: Lightbulb },
                    ].map((rec, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            whileHover={{ x: 4, backgroundColor: "rgba(139, 92, 246, 0.1)" }}
                            className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 cursor-pointer group transition-all duration-200"
                        >
                            <div className="p-1.5 rounded-lg bg-purple-500/10 mt-0.5">
                                <rec.icon className="w-3.5 h-3.5 text-purple-400" />
                            </div>
                            <p className="text-xs text-foreground/80 group-hover:text-foreground transition-colors leading-relaxed flex-1">
                                {rec.text}
                            </p>
                            <ChevronRight className="w-4 h-4 text-purple-400/50 group-hover:text-purple-400 group-hover:translate-x-1 transition-all mt-0.5" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
