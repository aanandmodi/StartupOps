"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { ArtifactGenerator } from "@/components/execution/ArtifactGenerator";
import { useGoalStore } from "@/store/useGoalStore";

export default function ExecutePage() {
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
                        <Zap className="w-6 h-6 text-foreground" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Auto-Execute</h1>
                        <p className="text-muted-foreground text-sm">
                            Generate code, documents, and templates with AI
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Generator Interface */}
            <ArtifactGenerator startupId={startupId} />
        </div>
    );
}
