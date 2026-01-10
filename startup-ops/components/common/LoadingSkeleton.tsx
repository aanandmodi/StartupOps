"use client";

import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
    className?: string;
    variant?: "text" | "card" | "chart" | "circle";
}

export function LoadingSkeleton({ className, variant = "text" }: LoadingSkeletonProps) {
    const baseClasses = "animate-shimmer rounded-lg";

    switch (variant) {
        case "card":
            return (
                <div className={cn("space-y-4 p-6 glass-card", className)}>
                    <div className={cn(baseClasses, "h-6 w-3/4")} />
                    <div className={cn(baseClasses, "h-4 w-full")} />
                    <div className={cn(baseClasses, "h-4 w-5/6")} />
                    <div className={cn(baseClasses, "h-10 w-1/3 mt-4")} />
                </div>
            );
        case "chart":
            return (
                <div className={cn("space-y-4 p-6 glass-card", className)}>
                    <div className={cn(baseClasses, "h-6 w-1/2")} />
                    <div className={cn(baseClasses, "h-48 w-full")} />
                </div>
            );
        case "circle":
            return (
                <div className={cn(baseClasses, "w-12 h-12 rounded-full", className)} />
            );
        default:
            return (
                <div className={cn(baseClasses, "h-4 w-full", className)} />
            );
    }
}

interface LoadingGridProps {
    count?: number;
    variant?: "text" | "card" | "chart";
}

export function LoadingGrid({ count = 6, variant = "card" }: LoadingGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <LoadingSkeleton key={i} variant={variant} />
            ))}
        </div>
    );
}
