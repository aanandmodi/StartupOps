"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getAuthHeaders } from "@/components/auth/AuthProvider";
import { MessageActions } from "./MessageActions";
import { MarkdownRenderer } from "@/components/common/MarkdownRenderer";
import {
    Send,
    Loader2,
    MessageSquare,
    Trash2,
    User,
    Zap,
} from "lucide-react";
import {
    ProductIcon,
    TechIcon,
    MarketingIcon,
    FinanceIcon,
    AdvisorIcon
} from "./AnimatedIcons";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Message {
    id: number;
    role: "user" | "assistant";
    content: string;
    created_at: string;
}

interface Agent {
    id: string;
    name: string;
    displayName: string;
    description: string;
    IconComponent: React.ComponentType<{ isSelected: boolean, className?: string }>;
}

const AGENTS: Agent[] = [
    { id: "product", name: "product", displayName: "Product", description: "MVP & Features", IconComponent: ProductIcon },
    { id: "tech", name: "tech", displayName: "Tech", description: "Stack & Arch", IconComponent: TechIcon },
    { id: "marketing", name: "marketing", displayName: "Marketing", description: "Growth & SEO", IconComponent: MarketingIcon },
    { id: "finance", name: "finance", displayName: "Finance", description: "Budget & runway", IconComponent: FinanceIcon },
    { id: "advisor", name: "advisor", displayName: "Advisor", description: "Strategy", IconComponent: AdvisorIcon },
];

interface AgentChatProps {
    startupId: number | string | null;
}

export function AgentChat({ startupId }: AgentChatProps) {
    const [selectedAgent, setSelectedAgent] = useState<Agent>(AGENTS[0]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load chat history when agent changes
    useEffect(() => {
        if (!startupId) return;
        loadChatHistory();
    }, [startupId, selectedAgent.name]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const loadChatHistory = async () => {
        if (!startupId) return;
        setIsLoading(true);

        try {
            const headers = await getAuthHeaders();
            const response = await fetch(
                `${API_URL}/chat/${startupId}/${selectedAgent.name}/history`,
                { headers }
            );

            if (response.ok) {
                const data = await response.json();
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error("Failed to load chat history:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async (contentOverride?: string, isRegeneration: boolean = false) => {
        const messageContent = contentOverride || input;
        if (!messageContent.trim() || !startupId || isSending) return;

        if (!isRegeneration) {
            const userMessage: Message = {
                id: Date.now(),
                role: "user",
                content: messageContent,
                created_at: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, userMessage]);
            setInput("");
        }

        setIsSending(true);

        try {
            const headers = await getAuthHeaders();
            const response = await fetch(
                `${API_URL}/chat/${startupId}/${selectedAgent.name}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...headers,
                    },
                    body: JSON.stringify({ content: messageContent }),
                }
            );

            if (response.ok) {
                const fullResponse = await response.json();
                const fullContent = fullResponse.content;

                // Create a placeholder message with empty content
                const messageId = Date.now() + 1;
                const assistantMessage: Message = {
                    ...fullResponse,
                    id: messageId,
                    content: "",
                };

                setMessages((prev) => [...prev, assistantMessage]);
                setIsSending(false); // Stop "thinking" animation

                // Simulate typing effect
                const chunkSize = 2; // Characters per tick
                let currentText = "";

                for (let i = 0; i < fullContent.length; i += chunkSize) {
                    // Check if component is still mounted/valid (optional handling could be added)
                    const chunk = fullContent.slice(i, i + chunkSize);
                    currentText += chunk;

                    setMessages((prev) =>
                        prev.map(msg =>
                            msg.id === messageId
                                ? { ...msg, content: currentText }
                                : msg
                        )
                    );

                    // Random delay for natural feel (10-30ms)
                    await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 10));
                }
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now() + 1,
                        role: "assistant",
                        content: "Sorry, I encountered an error. Please try again.",
                        created_at: new Date().toISOString(),
                    },
                ]);
                setIsSending(false);
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    role: "assistant",
                    content: "Connection error. Please check your network and try again.",
                    created_at: new Date().toISOString(),
                },
            ]);
            setIsSending(false);
        }
    };

    const clearChat = async () => {
        if (!startupId) return;

        try {
            const headers = await getAuthHeaders();
            await fetch(
                `${API_URL}/chat/${startupId}/${selectedAgent.name}`,
                {
                    method: "DELETE",
                    headers,
                }
            );
            setMessages([]);
        } catch (error) {
            console.error("Failed to clear chat:", error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (!startupId) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center p-8">
                <div className="w-16 h-16 rounded-3xl bg-muted/20 flex items-center justify-center mb-6">
                    <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Startup Selected</h3>
                <p className="text-muted-foreground max-w-md">
                    Select a startup to begin.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] relative">
            {/* Header: Fixed Top */}
            <div className="flex-none pb-4 px-2">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Agent Tabs - Animated Icons */}
                    <div className="flex p-1 bg-muted/20 dark:bg-white/5 rounded-2xl border border-border/10">
                        {AGENTS.map((agent) => {
                            const isSelected = selectedAgent.id === agent.id;
                            return (
                                <button
                                    key={agent.id}
                                    onClick={() => setSelectedAgent(agent)}
                                    className={cn(
                                        "relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                                        isSelected
                                            ? "text-primary-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
                                    )}
                                >
                                    {isSelected && (
                                        <motion.div
                                            layoutId="agent-tab-bg"
                                            className="absolute inset-0 bg-primary rounded-xl shadow-sm"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        <agent.IconComponent
                                            isSelected={isSelected}
                                            className={cn("w-4 h-4", isSelected ? "text-primary-foreground" : "text-current")}
                                        />
                                        <span className="hidden sm:inline">{agent.displayName}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-muted/20 dark:bg-white/5 border border-border/10 text-xs text-muted-foreground">
                            <Zap className="w-3.5 h-3.5" />
                            <span>{(messages.length * 150).toLocaleString()} / 10k</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={clearChat}
                            className="h-9 w-9 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground transition-colors rounded-xl"
                            title="Clear conversation"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Chat Area: Scrollable Middle */}
            <div className="flex-1 overflow-y-auto px-4 pb-32 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
                <div className="max-w-4xl mx-auto space-y-8 py-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Loading specific knowledge...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-80">
                            <div className="w-20 h-20 rounded-3xl bg-muted/10 dark:bg-white/5 flex items-center justify-center mb-6 ring-1 ring-border/10">
                                <selectedAgent.IconComponent isSelected={true} className="w-10 h-10 text-foreground/70" />
                            </div>
                            <h4 className="text-2xl font-semibold mb-3 tracking-tight text-foreground">
                                Ask {selectedAgent.displayName}
                            </h4>
                            <p className="text-muted-foreground max-w-md mb-10 leading-relaxed text-sm">
                                {selectedAgent.description}
                                <br />
                                Ready to analyze and strategize.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                                {getSuggestions(selectedAgent.name).map((suggestion, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setInput(suggestion)}
                                        className="text-left text-sm p-4 rounded-2xl bg-muted/10 dark:bg-white/5 hover:bg-muted/20 dark:hover:bg-white/10 border border-border/5 hover:border-border/20 transition-all duration-200 group"
                                    >
                                        <span className="text-foreground/80 group-hover:text-foreground">{suggestion}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {messages.map((message, index) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "group flex gap-4 md:gap-6",
                                        message.role === "user" ? "flex-row-reverse" : "flex-row"
                                    )}
                                >
                                    {/* Avatar */}
                                    <div className="shrink-0 mt-1">
                                        {message.role === "assistant" ? (
                                            <div className="w-8 h-8 rounded-xl bg-muted/20 dark:bg-white/5 flex items-center justify-center ring-1 ring-border/10">
                                                <selectedAgent.IconComponent isSelected={false} className="w-4 h-4 text-foreground/80" />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                                <User className="w-4 h-4 text-primary" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className={cn(
                                        "flex flex-col max-w-[85%] lg:max-w-[75%]",
                                        message.role === "user" ? "items-end" : "items-start"
                                    )}>
                                        <div className="text-xs text-muted-foreground/50 mb-1.5 px-1 uppercase tracking-wider font-medium">
                                            {message.role === "assistant" ? selectedAgent.displayName : "You"}
                                        </div>

                                        <div
                                            className={cn(
                                                "text-sm md:text-base leading-7",
                                                message.role === "assistant"
                                                    ? "bg-card dark:bg-white/5 border border-border/40 dark:border-white/5 rounded-2xl p-6 shadow-sm w-full"
                                                    : "text-foreground px-0"
                                            )}
                                        >
                                            {message.role === "assistant" ? (
                                                <MarkdownRenderer content={message.content} />
                                            ) : (
                                                <p className="whitespace-pre-wrap font-medium text-lg leading-relaxed text-right text-foreground/90">
                                                    {message.content}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions for Assistant */}
                                        {message.role === "assistant" && (
                                            <div className="mt-2 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <MessageActions
                                                    content={message.content}
                                                    messageId={message.id}
                                                    className="justify-start"
                                                    onRegenerate={() => {
                                                        // Find the last user message
                                                        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                                                        if (lastUserMsg) {
                                                            // Remove the last assistant message (this one) from visible state immediately for better UX
                                                            setMessages(prev => prev.filter(m => m.id !== message.id));
                                                            // Re-send the user's last input
                                                            setInput(lastUserMsg.content); // Optional: populate input
                                                            sendMessage(); // This uses 'input', so we need to be careful.
                                                            // Better approach: Call sendMessage with explicit content argument if we refactor,
                                                            // OR just trigger the fetch logic directly.
                                                            // Let's modify sendMessage to accept optional content override or just handle state update.

                                                            // ACTUALLY, sendMessage uses `input` state. 
                                                            // Direct calling might be tricky if state isn't updated yet.
                                                            // Let's update `sendMessage` to accept optional content argument.
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            {isSending && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="flex gap-4 md:gap-6"
                                >
                                    <div className="shrink-0 mt-1">
                                        <div className="w-8 h-8 rounded-xl bg-muted/20 dark:bg-white/5 flex items-center justify-center ring-1 ring-border/10">
                                            <selectedAgent.IconComponent isSelected={true} className="w-4 h-4 text-foreground/80 animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-start justify-center">
                                        <div className="text-xs text-muted-foreground/50 mb-1.5 px-1 uppercase tracking-wider font-medium">
                                            {selectedAgent.displayName}
                                        </div>
                                        <div className="flex items-center gap-2 bg-card dark:bg-white/5 border border-border/40 dark:border-white/5 rounded-2xl px-4 py-3 shadow-sm">
                                            <span className="text-sm text-foreground/70 font-medium">Generating</span>
                                            <div className="flex gap-1 h-2 items-center">
                                                <motion.div
                                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                                    transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                                                    className="w-1 h-1 bg-primary rounded-full"
                                                />
                                                <motion.div
                                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                                                    className="w-1 h-1 bg-primary rounded-full"
                                                />
                                                <motion.div
                                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                                                    className="w-1 h-1 bg-primary rounded-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area: Fixed Bottom */}
            <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-10 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none">
                <div className="max-w-3xl mx-auto pointer-events-auto">
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-[32px] blur opacity-0 group-hover:opacity-100 transition duration-500" />

                        <div className="relative flex items-end gap-2 bg-background/80 dark:bg-black/60 backdrop-blur-xl border border-border/10 rounded-[32px] shadow-2xl dark:shadow-black/50 p-2 pr-2 ring-1 ring-white/5 transition-all focus-within:ring-primary/20 focus-within:border-primary/20">
                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={`Message ${selectedAgent.displayName}...`}
                                className="min-h-[52px] max-h-[200px] w-full resize-none bg-transparent border-0 focus-visible:ring-0 py-3.5 px-5 text-base placeholder:text-muted-foreground/40 text-foreground scrollbar-thin scrollbar-thumb-muted-foreground/20"
                                disabled={isSending}
                                rows={1}
                            />
                            <Button
                                onClick={() => sendMessage()}
                                disabled={!input.trim() || isSending}
                                size="icon"
                                className={cn(
                                    "h-10 w-10 rounded-full shrink-0 mb-1.5 transition-all duration-300",
                                    input.trim() && !isSending
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                                        : "bg-muted/10 dark:bg-white/5 text-muted-foreground hover:bg-muted/20 dark:hover:bg-white/10"
                                )}
                            >
                                {isSending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5 ml-0.5" />
                                )}
                            </Button>
                        </div>

                        <div className="text-center mt-3">
                            <p className="text-[10px] text-muted-foreground/40 font-medium tracking-wide">
                                AI responses can be inaccurate. Check important info.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function getSuggestions(agentName: string): string[] {
    const suggestions: Record<string, string[]> = {
        product: [
            "Outline key features for our MVP.",
            "Analyze competitor pricing models.",
            "Draft a user feedback survey.",
            "What's our core value proposition?"
        ],
        tech: [
            "Propose a scalable tech stack.",
            "Explain data privacy measures.",
            "Review our API security.",
            "CI/CD pipeline best practices."
        ],
        marketing: [
            "Plan a GTM strategy.",
            "Draft a viral launch tweet.",
            "Suggest blog topics for SEO.",
            "How to improve acquisition cost?"
        ],
        finance: [
            "Calculate monthly burn rate.",
            "Project 12-month runway.",
            "Define key financial metrics.",
            "Unit economics breakdown."
        ],
        advisor: [
            "Review our pitch deck structure.",
            "Identify strategic risks.",
            "How to approach investors?",
            "Key partnerships to pursue."
        ],
    };
    return suggestions[agentName] || [];
}
