"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import Image from "next/image";

const testimonials = [
    {
        name: "Sarah Chen",
        role: "Founder, TechFlow",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        content: "StartupOps completely transformed how we build. The AI agents feel like real team members, handling everything from market research to our financial models.",
        rating: 5
    },
    {
        name: "Michael Rodriguez",
        role: "CTO, BuildSmart",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
        content: "I was skeptical about AI co-founders, but the Tech Agent's architecture recommendations were spot on. It saved us weeks of research and technical debt.",
        rating: 5
    },
    {
        name: "Emily Watson",
        role: "CEO, GrowthHack",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
        content: "The Marketing Agent's strategy was better than what we got from expensive agencies. We're seeing 3x growth in our user base since implementing the plan.",
        rating: 5
    },
    {
        name: "David Kim",
        role: "Product Lead, InnovateX",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
        content: "The ability to generate a full PRD and execution plan in minutes is a game changer. It let us focus on building rather than planning.",
        rating: 5
    },
    {
        name: "Jessica Liu",
        role: "Founder, GreenScale",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica",
        content: "Finance Agent helped us extend our runway by 4 months with smart budgeting. Essential tool for any early-stage startup.",
        rating: 5
    },
    {
        name: "Alex Thompson",
        role: "Indie Hacker",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
        content: "As a solo founder, having 5 AI experts on call 24/7 is incredible. I never feel stuck anymore.",
        rating: 5
    }
];

export function TestimonialsCarousel() {
    return (
        <section className="py-24 bg-zinc-950 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/[0.02] to-transparent" />

            <div className="max-w-7xl mx-auto px-6 mb-16 text-center relative z-10">
                <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-sm font-medium text-violet-400 tracking-wider bg-violet-500/10 px-4 py-1.5 rounded-full mb-4 inline-block"
                >
                    WALL OF LOVE
                </motion.span>
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
                >
                    Loved by founders <br />
                    <span className="text-zinc-500">around the world</span>
                </motion.h2>
            </div>

            <div className="relative flex overflow-x-hidden">
                {/* First Row - Moving Left */}
                <motion.div
                    className="flex gap-6 py-4 px-6 animate-scroll" // We'll use Framer Motion for infinite scroll
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 40 // Adjust speed
                    }}
                    style={{ width: "fit-content" }}
                >
                    {[...testimonials, ...testimonials].map((testimonial, i) => (
                        <div
                            key={`${testimonial.name}-${i}`}
                            className="flex-shrink-0 w-[400px] p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm hover:border-violet-500/30 transition-colors"
                        >
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                                ))}
                            </div>
                            <p className="text-zinc-300 mb-6 leading-relaxed relative">
                                <Quote className="absolute -top-2 -left-2 w-8 h-8 text-zinc-800/50 -z-10 transform -scale-x-100" />
                                "{testimonial.content}"
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800">
                                    <Image
                                        src={testimonial.image}
                                        alt={testimonial.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-white">{testimonial.name}</h4>
                                    <p className="text-xs text-zinc-500">{testimonial.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
