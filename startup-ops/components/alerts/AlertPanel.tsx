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
        bgColor: "bg-red-500/5",
        borderColor: "border-white/5",
        iconColor: "text-red-400",
    },
    warning: {
        icon: AlertTriangle,
        bgColor: "bg-amber-500/5",
        borderColor: "border-white/5",
        iconColor: "text-amber-400",
    },
    info: {
        icon: Info,
        bgColor: "bg-blue-500/5",
        borderColor: "border-white/5",
        iconColor: "text-blue-400",
    },
};

function AlertCard({ alert, index }: AlertCardProps) {
    const { dismissAlert } = usePlanStore();
    const config = alertConfig[alert.type];
    const Icon = config.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ delay: index * 0.03 }}
            className={cn(
                "p-3 rounded-xl border transition-all duration-200 bg-white dark:bg-transparent shadow-sm dark:shadow-none",
                config.bgColor,
                config.borderColor
            )}
        >
            <div className="flex items-start gap-2.5">
                <div className={cn("p-1.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-transparent")}>
                    <Icon className={cn("w-3.5 h-3.5", config.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground text-xs mb-0.5 line-clamp-1">
                        {alert.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {alert.message}
                    </p>
                    <p className="text-[9px] text-muted-foreground/50 mt-1.5">
                        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => dismissAlert(alert.id)}
                    className="shrink-0 w-6 h-6 rounded-lg hover:bg-white/10"
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
        <motion.div
            className="glass-card p-5 space-y-4 rounded-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/10">
                    <Bell className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                    <h3 className="font-medium text-sm text-foreground">Alerts</h3>
                    <p className="text-[10px] text-muted-foreground">Action items & warnings</p>
                </div>
            </div>

            {/* Alerts List */}
            <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-none">
                <AnimatePresence>
                    {alerts.length > 0 ? (
                        alerts.map((alert, index) => (
                            <AlertCard key={alert.id} alert={alert} index={index} />
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8"
                        >
                            <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/20" />
                            <p className="text-xs font-medium text-foreground mb-0.5">All caught up!</p>
                            <p className="text-[10px] text-muted-foreground">No active alerts</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
