"use client";

import { motion } from "framer-motion";
import { GoalInputForm } from "@/components/goal/GoalInputForm";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Glow Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/20 blur-[120px] rounded-full opacity-20" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full opacity-20" />
      </div>

      {/* Header / Nav (Minimal) */}
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/10">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">StartupOps</span>
        </div>

        {/* Optional decorative links */}
        {/* <div className="text-sm text-muted-foreground hidden md:flex gap-6">
           <span>Features</span>
           <span>Pricing</span>
           <span>Docs</span>
        </div> */}
      </header>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-3xl flex flex-col items-center text-center space-y-8">

        {/* Hero Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/80 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Introduced AI Co-Founder V2
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            What will you <span className="text-blue-500">build</span> today?
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Create stunning startups, execute plans, and track growth with your personal AI co-founder.
          </p>
        </motion.div>

        {/* Input Form */}
        <div className="w-full">
          <GoalInputForm />
        </div>

        {/* Short Footer / Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="pt-12 flex gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500"
        >
          {/* Add logos or simple trust indicators if needed */}
        </motion.div>

      </div>

      {/* Footer Gradient Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-30" />
    </div>
  );
}
