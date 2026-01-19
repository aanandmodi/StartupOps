"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Logo } from "@/components/common/Logo";

interface PreloaderProps {
    minDuration?: number;
}

export function Preloader({ minDuration = 2000 }: PreloaderProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(true);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Precise progress simulation
        const startTime = Date.now();
        const duration = minDuration;

        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min((elapsed / duration) * 100, 100);

            setProgress(newProgress);

            if (newProgress < 100) {
                requestAnimationFrame(updateProgress);
            } else {
                setIsLoading(false);
            }
        };

        requestAnimationFrame(updateProgress);

        return () => { };
    }, [minDuration]);

    useEffect(() => {
        if (!isLoading) {
            const hideTimer = setTimeout(() => setIsVisible(false), 800);
            return () => clearTimeout(hideTimer);
        }
    }, [isLoading]);

    if (!isVisible) return null;

    return (
        <AnimatePresence mode="wait">
            {(isLoading || isVisible) && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/40 backdrop-blur-3xl"
                >
                    <div className="relative">
                        {/* Glowing Background Effect - Deeper and smoother */}
                        <div className="absolute inset-0 bg-white/5 blur-[100px] rounded-full scale-150 opacity-20" />

                        <motion.svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="w-32 h-32 relative z-10"
                        >
                            {/* Path 1: Outline Drawing */}
                            <motion.path
                                d="M12 2L4 7v10l8 5 8-5V7l-8-5z"
                                stroke="currentColor"
                                strokeWidth="0.5"
                                className="text-white"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                            />

                            {/* Path 2: Vertical Center Line */}
                            <motion.path
                                d="M12 22V12"
                                stroke="currentColor"
                                strokeWidth="0.5"
                                className="text-white"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1, ease: "easeInOut", delay: 0.5 }}
                            />

                            {/* Path 3: Right Diagonal */}
                            <motion.path
                                d="M20 7L12 12"
                                stroke="currentColor"
                                strokeWidth="0.5"
                                className="text-white"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1, ease: "easeInOut", delay: 0.8 }}
                            />

                            {/* Path 4: Left Diagonal */}
                            <motion.path
                                d="M12 12L4 7"
                                stroke="currentColor"
                                strokeWidth="0.5"
                                className="text-white"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1, ease: "easeInOut", delay: 0.8 }}
                            />

                            {/* Fill Animation - Fade in after drawing */}
                            <motion.path
                                d="M12 2L4 7v10l8 5 8-5V7l-8-5z"
                                fill="currentColor"
                                className="text-white"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.15 }}
                                transition={{ duration: 1, delay: 1.5 }}
                            />
                        </motion.svg>
                    </div>

                    {/* Text Animation - Typewriter effect */}
                    <div className="mt-8 relative z-10 overflow-hidden">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={{
                                hidden: { opacity: 0 },
                                visible: {
                                    opacity: 1,
                                    transition: {
                                        staggerChildren: 0.1,
                                        delayChildren: 0.2 // Start with logo
                                    }
                                }
                            }}
                            className="flex"
                        >
                            {"StartupOps".split("").map((char, index) => (
                                <motion.span
                                    key={index}
                                    variants={{
                                        hidden: { opacity: 0, y: 10 },
                                        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
                                    }}
                                    className="text-2xl font-semibold tracking-tight text-white font-[family-name:var(--font-geist-sans)]"
                                >
                                    {char}
                                </motion.span>
                            ))}
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
