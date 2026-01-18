"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useGoalStore } from "@/store/useGoalStore";
import { getAuthHeaders } from "@/components/auth/AuthProvider";
import {
    Send,
    Loader2,
    MessageSquare,
    Trash2,
    User,
    Bot,
    Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Message {
    id: number;
    role: "user" | "assistant";
    content: string;
    created_at: string;
}

interface Agent {
    name: string;
    displayName: string;
    description: string;
    icon: string;
    color: string;
}

const AGENTS: Agent[] = [
    { name: "product", displayName: "Product", description: "MVP planning & features", icon: "🎯", color: "from-blue-500 to-cyan-500" },
    { name: "tech", displayName: "Tech", description: "Architecture & stack", icon: "⚙️", color: "from-purple-500 to-pink-500" },
    { name: "marketing", displayName: "Marketing", description: "Growth strategies", icon: "📣", color: "from-orange-500 to-yellow-500" },
    { name: "finance", displayName: "Finance", description: "Budget & runway", icon: "💰", color: "from-emerald-500 to-teal-500" },
    { name: "advisor", displayName: "Advisor", description: "Strategic guidance", icon: "🧠", color: "from-indigo-500 to-violet-500" },
];

interface AgentChatProps {
    startupId: number | null;
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
            const response = await fetch(
                `${API_URL}/chat/${startupId}/${selectedAgent.name}/history`,
                { headers: getAuthHeaders() }
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

    const sendMessage = async () => {
        if (!input.trim() || !startupId || isSending) return;

        const userMessage: Message = {
            id: Date.now(),
            role: "user",
            content: input,
            created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsSending(true);

        try {
            const response = await fetch(
                `${API_URL}/chat/${startupId}/${selectedAgent.name}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...getAuthHeaders(),
                    },
                    body: JSON.stringify({ content: input }),
                }
            );

            if (response.ok) {
                const assistantMessage = await response.json();
                setMessages((prev) => [...prev, assistantMessage]);
            } else {
                // Add error message
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now() + 1,
                        role: "assistant",
                        content: "Sorry, I encountered an error. Please try again.",
                        created_at: new Date().toISOString(),
                    },
                ]);
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
        } finally {
            setIsSending(false);
        }
    };

    const clearChat = async () => {
        if (!startupId) return;

        try {
            await fetch(
                `${API_URL}/chat/${startupId}/${selectedAgent.name}`,
                {
                    method: "DELETE",
                    headers: getAuthHeaders(),
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
            <div className="glass-card p-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No Startup Selected</h3>
                <p className="text-muted-foreground">
                    Create a startup first to chat with your AI co-founders.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)]">
            {/* Agent Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {AGENTS.map((agent) => (
                    <button
                        key={agent.name}
                        onClick={() => setSelectedAgent(agent)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                            selectedAgent.name === agent.name
                                ? `bg-gradient-to-r ${agent.color} text-white shadow-lg`
                                : "bg-white/5 hover:bg-white/10 text-muted-foreground"
                        )}
                    >
                        <span className="text-lg">{agent.icon}</span>
                        {agent.displayName}
                    </button>
                ))}
            </div>

            {/* Chat Area */}
            <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br",
                            selectedAgent.color
                        )}>
                            {selectedAgent.icon}
                        </div>
                        <div>
                            <h3 className="font-semibold">{selectedAgent.displayName} Co-Founder</h3>
                            <p className="text-xs text-muted-foreground">{selectedAgent.description}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearChat}
                        className="hover:bg-red-500/10 hover:text-red-400"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className={cn(
                                "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 bg-gradient-to-br",
                                selectedAgent.color
                            )}>
                                {selectedAgent.icon}
                            </div>
                            <h4 className="font-semibold mb-2">Chat with {selectedAgent.displayName}</h4>
                            <p className="text-sm text-muted-foreground max-w-xs">
                                Ask me anything about {selectedAgent.description.toLowerCase()}.
                            </p>
                            <div className="mt-6 space-y-2">
                                <p className="text-xs text-muted-foreground">Try asking:</p>
                                {getSuggestions(selectedAgent.name).map((suggestion, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setInput(suggestion)}
                                        className="block w-full text-left text-sm p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        "{suggestion}"
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex gap-3",
                                        message.role === "user" ? "justify-end" : "justify-start"
                                    )}
                                >
                                    {message.role === "assistant" && (
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-gradient-to-br shrink-0",
                                            selectedAgent.color
                                        )}>
                                            {selectedAgent.icon}
                                        </div>
                                    )}
                                    <div
                                        className={cn(
                                            "max-w-[80%] p-3 rounded-2xl text-sm",
                                            message.role === "user"
                                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                                : "bg-white/5 rounded-bl-sm"
                                        )}
                                    >
                                        <p className="whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                    {message.role === "user" && (
                                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                                            <User className="w-4 h-4 text-primary" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                    {isSending && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex gap-3"
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-gradient-to-br shrink-0",
                                selectedAgent.color
                            )}>
                                {selectedAgent.icon}
                            </div>
                            <div className="bg-white/5 rounded-2xl rounded-bl-sm p-3">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" />
                                    <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:0.1s]" />
                                    <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                                </div>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex gap-2">
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`Ask ${selectedAgent.displayName} something...`}
                            className="min-h-[44px] max-h-32 resize-none bg-white/5 border-white/10"
                            disabled={isSending}
                        />
                        <Button
                            onClick={sendMessage}
                            disabled={!input.trim() || isSending}
                            size="icon"
                            className="h-[44px] w-[44px] shrink-0"
                        >
                            {isSending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function getSuggestions(agentName: string): string[] {
    const suggestions: Record<string, string[]> = {
        product: [
            "What features should we build for MVP?",
            "How should we prioritize our roadmap?",
            "Should we add a freemium tier?",
        ],
        tech: [
            "What tech stack do you recommend?",
            "How should we architect the backend?",
            "What's the best auth solution?",
        ],
        marketing: [
            "What's our go-to-market strategy?",
            "Which channels should we focus on?",
            "How do we acquire our first 100 users?",
        ],
        finance: [
            "What's our runway with current burn rate?",
            "How should we allocate our budget?",
            "When should we start fundraising?",
        ],
        advisor: [
            "What's our biggest risk right now?",
            "Are we on track with our goals?",
            "What should we focus on this week?",
        ],
    };
    return suggestions[agentName] || [];
}
