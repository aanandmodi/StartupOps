"use client";

import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { StartupSelector } from "@/components/startups/StartupSelector";

export default function StartupsPage() {
    return (
        <div className="min-h-screen p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl gradient-primary">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">My Startups</h1>
                        <p className="text-muted-foreground text-sm">
                            Manage all your startup projects
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Startup Selector */}
            <StartupSelector />
        </div>
    );
}
