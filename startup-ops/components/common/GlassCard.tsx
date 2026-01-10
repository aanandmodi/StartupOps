"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    glow?: boolean;
}

export function GlassCard({ children, className, hover = false, glow = false }: GlassCardProps) {
    return (
        <motion.div
            whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
            transition={{ duration: 0.2 }}
            className={cn(
                "glass-card p-6",
                glow && "glow",
                hover && "cursor-pointer",
                className
            )}
        >
            {children}
        </motion.div>
    );
}

interface GlassPanelProps {
    children: React.ReactNode;
    className?: string;
    variant?: "default" | "subtle";
}

export function GlassPanel({ children, className, variant = "default" }: GlassPanelProps) {
    return (
        <div
            className={cn(
                variant === "default" ? "glass" : "glass-subtle",
                "rounded-2xl p-6",
                className
            )}
        >
            {children}
        </div>
    );
}
