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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface AlertCardProps {
    alert: Alert;
}

const alertConfig = {
    urgent: {
        icon: AlertCircle,
        bgColor: "bg-status-critical/10 border-status-critical/30",
        iconColor: "text-status-critical",
    },
    warning: {
        icon: AlertTriangle,
        bgColor: "bg-status-warning/10 border-status-warning/30",
        iconColor: "text-status-warning",
    },
    info: {
        icon: Info,
        bgColor: "bg-primary/10 border-primary/30",
        iconColor: "text-primary",
    },
};

function AlertCard({ alert }: AlertCardProps) {
    const { dismissAlert } = usePlanStore();
    const config = alertConfig[alert.type];
    const Icon = config.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={cn(
                "p-4 rounded-xl border backdrop-blur-sm",
                config.bgColor
            )}
        >
            <div className="flex items-start gap-3">
                <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", config.iconColor)} />
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground text-sm mb-1">
                        {alert.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-2">
                        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => dismissAlert(alert.id)}
                    className="shrink-0 w-6 h-6 hover:bg-white/10"
                >
                    <X className="w-3 h-3" />
                </Button>
            </div>
        </motion.div>
    );
}

export function AlertPanel() {
    const { alerts } = usePlanStore();

    return (
        <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-status-warning" />
                    <h3 className="font-semibold text-foreground">Alerts</h3>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {alerts.length} active
                </span>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                <AnimatePresence>
                    {alerts.length > 0 ? (
                        alerts.map((alert) => (
                            <AlertCard key={alert.id} alert={alert} />
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8 text-muted-foreground"
                        >
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">All caught up!</p>
                            <p className="text-xs opacity-70">No active alerts</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* AI Recommendations */}
            <div className="pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-muted-foreground">AI RECOMMENDATIONS</span>
                </div>
                <div className="space-y-2">
                    {[
                        "Consider parallelizing backend and frontend tasks",
                        "Schedule hiring process earlier to avoid delays",
                    ].map((rec, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-2 p-2 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer group"
                        >
                            <ChevronRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                            <p className="text-xs text-foreground">{rec}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
