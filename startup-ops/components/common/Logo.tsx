"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
    size?: "sm" | "md" | "lg";
    variant?: "full" | "icon" | "text";
    className?: string;
}

export function Logo({ size = "md", variant = "full", className }: LogoProps) {
    const sizes = {
        sm: { icon: "w-7 h-7", text: "text-base", gap: "gap-2" },
        md: { icon: "w-8 h-8", text: "text-lg", gap: "gap-2.5" },
        lg: { icon: "w-10 h-10", text: "text-xl", gap: "gap-3" },
    };

    return (
        <div className={cn("flex items-center", sizes[size].gap, className)}>
            {variant !== "text" && (
                <div
                    className={cn(
                        sizes[size].icon,
                        "rounded-lg bg-foreground flex items-center justify-center"
                    )}
                >
                    <svg viewBox="0 0 24 24" fill="none" className="w-[55%] h-[55%] text-background">
                        <path
                            d="M12 2L4 7v10l8 5 8-5V7l-8-5z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M12 22V12"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                        <path
                            d="M20 7L12 12 4 7"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
            )}
            {variant !== "icon" && (
                <span className={cn(
                    sizes[size].text,
                    "font-semibold tracking-tight text-foreground"
                )}>
                    StartupOps
                </span>
            )}
        </div>
    );
}
