"use client";

import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { AgentChat } from "@/components/chat/AgentChat";
import { useGoalStore } from "@/store/useGoalStore";

export default function ChatPage() {
    const { startupId } = useGoalStore();

    return (
        <div className="min-h-screen p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                        <MessageSquare className="w-6 h-6 text-foreground" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Agent Chat</h1>
                        <p className="text-muted-foreground text-sm">
                            Talk directly with your AI co-founders
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Chat Interface */}
            <AgentChat startupId={startupId} />
        </div>
    );
}
