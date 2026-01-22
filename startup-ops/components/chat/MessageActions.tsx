"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Copy,
    Check,
    ThumbsUp,
    ThumbsDown,
    RefreshCw,
    Download,
    FileText,
    Share2,
    MoreHorizontal,
    X,
    ClipboardCopy
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageActionsProps {
    content: string;
    messageId: number;
    onRegenerate?: () => void;
    onFeedback?: (type: "like" | "dislike") => void;
    className?: string;
}

export function MessageActions({
    content,
    messageId,
    onRegenerate,
    onFeedback,
    className
}: MessageActionsProps) {
    const [copied, setCopied] = useState(false);
    const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
        }
    };

    const handleFeedback = (type: "like" | "dislike") => {
        setFeedback(feedback === type ? null : type);
        onFeedback?.(type);
    };

    const handleRegenerate = async () => {
        setIsRegenerating(true);
        await onRegenerate?.();
        setIsRegenerating(false);
    };

    const exportToFormat = (format: "txt" | "md" | "doc" | "json") => {
        let blob: Blob;
        let filename: string;

        switch (format) {
            case "txt":
                blob = new Blob([content], { type: "text/plain" });
                filename = `response_${messageId}.txt`;
                break;
            case "md":
                blob = new Blob([content], { type: "text/markdown" });
                filename = `response_${messageId}.md`;
                break;
            case "doc":
                // Simple HTML for Word compatibility
                const htmlContent = `
                    <!DOCTYPE html>
                    <html>
                    <head><meta charset="utf-8"><title>Response</title></head>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px;">
                        ${content.split('\n').map(line => {
                    if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`;
                    if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`;
                    if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`;
                    if (line.startsWith('- ') || line.startsWith('* ')) return `<li>${line.slice(2)}</li>`;
                    if (line.trim() === '') return '<br>';
                    return `<p>${line}</p>`;
                }).join('\n')}
                    </body>
                    </html>
                `;
                blob = new Blob([htmlContent], { type: "application/msword" });
                filename = `response_${messageId}.doc`;
                break;
            case "json":
                blob = new Blob([JSON.stringify({ content, timestamp: new Date().toISOString() }, null, 2)], { type: "application/json" });
                filename = `response_${messageId}.json`;
                break;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        setShowExportMenu(false);
    };

    return (
        <div className={cn("flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300", className)}>
            <div className="flex items-center gap-0.5">
                {/* Copy */}
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground relative overflow-hidden group/btn"
                    title="Copy response"
                >
                    <AnimatePresence mode="wait">
                        {copied ? (
                            <motion.div
                                key="check"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                            >
                                <Check className="w-3.5 h-3.5" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="copy"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                            >
                                <Copy className="w-3.5 h-3.5" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>

                <div className="w-px h-3 bg-white/10 mx-1" />

                {/* Like */}
                <button
                    onClick={() => handleFeedback("like")}
                    className={cn(
                        "p-1.5 rounded-lg hover:bg-white/10 transition-colors",
                        feedback === "like" ? "text-foreground bg-white/10" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Helpful"
                >
                    <ThumbsUp className="w-3.5 h-3.5" />
                </button>

                {/* Dislike */}
                <button
                    onClick={() => handleFeedback("dislike")}
                    className={cn(
                        "p-1.5 rounded-lg hover:bg-white/10 transition-colors",
                        feedback === "dislike" ? "text-foreground bg-white/10" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Not helpful"
                >
                    <ThumbsDown className="w-3.5 h-3.5" />
                </button>

                {/* Regenerate */}
                {onRegenerate && (
                    <>
                        <div className="w-px h-3 bg-white/10 mx-1" />
                        <button
                            onClick={handleRegenerate}
                            disabled={isRegenerating}
                            className={cn(
                                "p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50",
                                isRegenerating && "animate-spin"
                            )}
                            title="Regenerate response"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </>
                )}

                {/* Export Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className={cn(
                            "p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground ml-1",
                            showExportMenu && "bg-white/10 text-foreground"
                        )}
                        title="Export response"
                    >
                        <Download className="w-3.5 h-3.5" />
                    </button>

                    <AnimatePresence>
                        {showExportMenu && (
                            <>
                                {/* Backdrop for mobile/outside click */}
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowExportMenu(false)}
                                />

                                {/* Menu */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                    className="absolute top-full left-0 mt-2 w-48 bg-card border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
                                >
                                    <div className="p-1.5 space-y-0.5">
                                        <div className="px-2 py-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider opacity-70">
                                            Export Format
                                        </div>
                                        <div className="h-px bg-white/5 my-1" />
                                        <button
                                            onClick={() => exportToFormat("txt")}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-white/5 rounded-lg transition-colors group"
                                        >
                                            <FileText className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                            Plain Text (.txt)
                                        </button>
                                        <button
                                            onClick={() => exportToFormat("md")}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-white/5 rounded-lg transition-colors group"
                                        >
                                            <FileText className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                            Markdown (.md)
                                        </button>
                                        <button
                                            onClick={() => exportToFormat("doc")}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-white/5 rounded-lg transition-colors group"
                                        >
                                            <FileText className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                            Word Document (.doc)
                                        </button>
                                        <button
                                            onClick={() => exportToFormat("json")}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-white/5 rounded-lg transition-colors group"
                                        >
                                            <FileText className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                            JSON (.json)
                                        </button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

