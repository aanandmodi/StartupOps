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
    X
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
        <div className={cn("flex items-center gap-1 mt-2", className)}>
            {/* Copy */}
            <button
                onClick={handleCopy}
                className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-muted-foreground hover:text-white group"
                title="Copy response"
            >
                {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                    <Copy className="w-4 h-4" />
                )}
            </button>

            {/* Like */}
            <button
                onClick={() => handleFeedback("like")}
                className={cn(
                    "p-1.5 rounded-md hover:bg-white/10 transition-colors",
                    feedback === "like" ? "text-emerald-400" : "text-muted-foreground hover:text-white"
                )}
                title="Good response"
            >
                <ThumbsUp className="w-4 h-4" />
            </button>

            {/* Dislike */}
            <button
                onClick={() => handleFeedback("dislike")}
                className={cn(
                    "p-1.5 rounded-md hover:bg-white/10 transition-colors",
                    feedback === "dislike" ? "text-red-400" : "text-muted-foreground hover:text-white"
                )}
                title="Bad response"
            >
                <ThumbsDown className="w-4 h-4" />
            </button>

            {/* Regenerate */}
            {onRegenerate && (
                <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-muted-foreground hover:text-white disabled:opacity-50"
                    title="Regenerate response"
                >
                    <RefreshCw className={cn("w-4 h-4", isRegenerating && "animate-spin")} />
                </button>
            )}

            {/* Export Dropdown */}
            <div className="relative">
                <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
                    title="Export response"
                >
                    <Download className="w-4 h-4" />
                </button>

                <AnimatePresence>
                    {showExportMenu && (
                        <>
                            {/* Backdrop */}
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowExportMenu(false)}
                            />

                            {/* Menu */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                className="absolute bottom-full left-0 mb-2 w-48 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden"
                            >
                                <div className="p-1">
                                    <p className="px-3 py-2 text-xs text-muted-foreground font-medium">
                                        Export as
                                    </p>
                                    <button
                                        onClick={() => exportToFormat("txt")}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10 rounded-md transition-colors"
                                    >
                                        <FileText className="w-4 h-4 text-muted-foreground" />
                                        Plain Text (.txt)
                                    </button>
                                    <button
                                        onClick={() => exportToFormat("md")}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10 rounded-md transition-colors"
                                    >
                                        <FileText className="w-4 h-4 text-muted-foreground" />
                                        Markdown (.md)
                                    </button>
                                    <button
                                        onClick={() => exportToFormat("doc")}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10 rounded-md transition-colors"
                                    >
                                        <FileText className="w-4 h-4 text-muted-foreground" />
                                        Word Document (.doc)
                                    </button>
                                    <button
                                        onClick={() => exportToFormat("json")}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10 rounded-md transition-colors"
                                    >
                                        <FileText className="w-4 h-4 text-muted-foreground" />
                                        JSON (.json)
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* Share (future feature) */}
            <button
                className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-muted-foreground hover:text-white opacity-50 cursor-not-allowed"
                title="Share (coming soon)"
                disabled
            >
                <Share2 className="w-4 h-4" />
            </button>
        </div>
    );
}
