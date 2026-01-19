"use client";

import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
    className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
    const { theme, setTheme } = useTheme();

    const themes = [
        { value: "light", icon: Sun, label: "Light" },
        { value: "dark", icon: Moon, label: "Dark" },
        { value: "system", icon: Monitor, label: "System" },
    ] as const;

    return (
        <div className={cn(
            "flex items-center p-1 rounded-lg bg-secondary border border-border",
            className
        )}>
            {themes.map(({ value, icon: Icon, label }) => (
                <motion.button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={cn(
                        "relative flex items-center justify-center w-8 h-8 rounded-md transition-colors",
                        theme === value
                            ? "text-background"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={label}
                >
                    {theme === value && (
                        <motion.div
                            layoutId="theme-indicator"
                            className="absolute inset-0 bg-foreground rounded-md"
                            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                        />
                    )}
                    <Icon className="w-4 h-4 relative z-10" />
                </motion.button>
            ))}
        </div>
    );
}
