"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { GoalInputForm } from "@/components/goal/GoalInputForm";
import { useGoalStore } from "@/store/useGoalStore";
import {
    Zap, Shield, Users, Sparkles, Check, ArrowRight, Star,
    Brain, Target, LineChart, GitBranch, MessageSquare, Cpu,
    Twitter, Github, Linkedin, ChevronRight, Play, ArrowUpRight, Layers, LogOut
} from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { isAuthenticated, getCurrentUser, logout } from "@/components/auth/AuthGuard";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { TestimonialsCarousel } from "@/components/landing/TestimonialsCarousel";

const cycleWords = ["build", "launch", "scale", "grow"];

export default function HomePage() {
    const router = useRouter();
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);
    const [showCreateStartup, setShowCreateStartup] = useState(false);
    const heroRef = useRef<HTMLDivElement>(null);

    // Simple scroll animation for hero
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
    const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

    // Check auth state on mount
    useEffect(() => {
        setIsLoggedIn(isAuthenticated());
        setUser(getCurrentUser());
    }, []);

    useEffect(() => {
        const interval = setInterval(() => setCurrentWordIndex((prev) => (prev + 1) % cycleWords.length), 2500);
        return () => clearInterval(interval);
    }, []);

    const handleStartBuilding = () => {
        if (isLoggedIn) {
            router.push("/plan");
        } else {
            router.push("/login");
        }
    };

    const handleWatchDemo = () => {
        document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
    };

    const handlePricingCTA = (planName: string) => {
        if (planName === "Enterprise") {
            window.location.href = "mailto:sales@startupops.ai?subject=Enterprise%20Inquiry";
        } else {
            router.push("/login");
        }
    };


    const { setStartupId } = useGoalStore();

    const handleDashboardClick = async (e: React.MouseEvent) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem("access_token");
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

            if (isLoggedIn) {
                const response = await fetch(`${API_URL}/startups/`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });

                if (response.ok) {
                    const startups = await response.json();
                    if (startups && startups.length > 0) {
                        const latest = startups.sort((a: any, b: any) =>
                            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                        )[0];

                        setStartupId(latest.id);
                        router.push("/plan");
                        return;
                    }
                }
                // No startups found -> Show create popup
                setShowCreateStartup(true);
            } else {
                router.push("/login");
            }
        } catch (error) {
            console.error("Failed to fetch startups for dashboard redirect:", error);
            router.push("/plan");
        }
    };

    const handleTryAutoExecute = () => {
        if (isLoggedIn) {
            router.push("/execute");
        } else {
            router.push("/login");
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-white antialiased">

            {/* ===== NAVIGATION ===== */}
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-12">
                        <Logo size="sm" />
                        <div className="hidden md:flex items-center gap-8">
                            {["Features", "Pricing", "Docs", "Blog"].map((item) => (
                                <a key={item} href={`#${item.toLowerCase()}`} className="text-sm text-zinc-400 hover:text-white transition-colors duration-300">{item}</a>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {isLoggedIn ? (
                            <>
                                <Link href="/startups" className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2">My Startups</Link>
                                <a href="/plan" onClick={handleDashboardClick} className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2">Dashboard</a>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-xs text-violet-400 font-bold">
                                        {user?.name?.charAt(0).toUpperCase() || "U"}
                                    </div>
                                    <button onClick={logout} className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2">Log in</Link>
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Link href="/login" className="text-sm font-medium px-5 py-2.5 rounded-full bg-white text-black hover:bg-zinc-200 transition-colors">
                                        Start free →
                                    </Link>
                                </motion.div>
                            </>
                        )}
                    </div>
                </div>
            </motion.nav>

            {/* ===== HERO ===== */}
            <motion.section ref={heroRef} style={{ opacity: heroOpacity, scale: heroScale }} className="relative min-h-screen flex items-center justify-center overflow-hidden">

                {/* Background */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(0,0,0,0))]" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
                </div>

                {/* Floating elements */}
                <motion.div animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-32 left-[15%] w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-white/10 backdrop-blur-xl flex items-center justify-center"
                >
                    <Brain className="w-7 h-7 text-violet-400" />
                </motion.div>
                <motion.div animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute top-40 right-[18%] w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10 backdrop-blur-xl flex items-center justify-center"
                >
                    <LineChart className="w-6 h-6 text-cyan-400" />
                </motion.div>
                <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute bottom-40 left-[20%] w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-white/10 backdrop-blur-xl flex items-center justify-center"
                >
                    <Target className="w-5 h-5 text-emerald-400" />
                </motion.div>
                <motion.div animate={{ y: [0, 20, 0], rotate: [0, 8, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute bottom-32 right-[15%] w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-white/10 backdrop-blur-xl flex items-center justify-center"
                >
                    <Sparkles className="w-6 h-6 text-orange-400" />
                </motion.div>

                {/* Content */}
                <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-32">

                    {isLoggedIn ? (
                        /* ===== LOGGED IN USER CONTENT ===== */
                        <>
                            {/* Welcome Badge */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-xl mb-8"
                            >
                                <span className="flex h-2 w-2 relative">
                                    <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <span className="text-sm text-emerald-300">Welcome back, {user?.name?.split(' ')[0] || 'Founder'}!</span>
                            </motion.div>

                            {/* Personalized Headline */}
                            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
                                className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1] mb-6"
                            >
                                <span className="text-white">Ready to continue</span>
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400">
                                    building?
                                </span>
                            </motion.h1>

                            {/* Subheadline */}
                            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                                className="text-lg md:text-xl text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed"
                            >
                                Jump back into your startup journey. Your AI co-founders are ready to help.
                            </motion.p>

                            {/* Quick Action Buttons */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
                            >
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={handleDashboardClick}
                                    className="group px-8 py-4 rounded-full bg-white text-black font-medium flex items-center gap-2 hover:bg-zinc-100 transition-all"
                                >
                                    Go to Dashboard
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </motion.button>
                                <motion.button whileHover={{ scale: 1.02 }}
                                    onClick={() => router.push("/chat")}
                                    className="group px-8 py-4 rounded-full border border-zinc-700 text-white font-medium flex items-center gap-2 hover:border-zinc-500 hover:bg-white/5 transition-all"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Chat with AI
                                </motion.button>
                            </motion.div>

                            {/* Quick Access Cards */}
                            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8 }}
                                className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto"
                            >
                                {[
                                    { icon: Target, label: "Execution Plan", desc: "View your tasks", href: "/plan", iconClass: "text-violet-400", hoverBorder: "hover:border-violet-500/30" },
                                    { icon: Cpu, label: "Auto-Execute", desc: "Generate artifacts", href: "/execute", iconClass: "text-fuchsia-400", hoverBorder: "hover:border-fuchsia-500/30" },
                                    { icon: LineChart, label: "KPI Metrics", desc: "Track progress", href: "/metrics", iconClass: "text-cyan-400", hoverBorder: "hover:border-cyan-500/30" },
                                ].map((item) => (
                                    <motion.div key={item.label} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                                        <Link href={item.href}
                                            className={`block p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 ${item.hoverBorder} transition-all group`}
                                        >
                                            <item.icon className={`w-6 h-6 ${item.iconClass} mb-3`} />
                                            <h3 className="font-semibold text-white mb-1">{item.label}</h3>
                                            <p className="text-sm text-zinc-500">{item.desc}</p>
                                        </Link>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Or Create New Startup */}
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                                className="mt-16"
                            >
                                <p className="text-zinc-500 mb-4">Or start something new</p>
                                <div className="relative max-w-2xl mx-auto">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-50" />
                                    <div className="relative">
                                        <GoalInputForm />
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    ) : (
                        /* ===== LOGGED OUT USER CONTENT ===== */
                        <>
                            {/* Badge */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl mb-8"
                            >
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute h-full w-full rounded-full bg-violet-400 opacity-75" />
                                    <span className="relative rounded-full h-2 w-2 bg-violet-500" />
                                </span>
                                <span className="text-sm text-zinc-300">Introducing Multi-Agent AI</span>
                                <ChevronRight className="w-4 h-4 text-zinc-500" />
                            </motion.div>

                            {/* Headline */}
                            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
                                className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight leading-[0.95] mb-8"
                            >
                                <span className="text-white">The AI platform</span>
                                <br />
                                <span className="text-white">that helps you </span>
                                <span className="relative inline-block">
                                    <AnimatePresence mode="wait">
                                        <motion.span key={cycleWords[currentWordIndex]}
                                            initial={{ y: 40, opacity: 0, rotateX: -40 }} animate={{ y: 0, opacity: 1, rotateX: 0 }} exit={{ y: -40, opacity: 0, rotateX: 40 }}
                                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                            className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 inline-block"
                                        >{cycleWords[currentWordIndex]}</motion.span>
                                    </AnimatePresence>
                                </span>
                            </motion.h1>

                            {/* Subheadline */}
                            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                                className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed"
                            >
                                Five specialized AI co-founders work together to transform your startup idea into a comprehensive execution plan. From product to finance, we've got you covered.
                            </motion.p>

                            {/* CTA Buttons */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
                            >
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={handleStartBuilding}
                                    className="group px-8 py-4 rounded-full bg-white text-black font-medium flex items-center gap-2 hover:bg-zinc-100 transition-all"
                                >
                                    Start building free
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </motion.button>
                                <motion.button whileHover={{ scale: 1.02 }}
                                    onClick={handleWatchDemo}
                                    className="group px-8 py-4 rounded-full border border-zinc-700 text-white font-medium flex items-center gap-2 hover:border-zinc-500 hover:bg-white/5 transition-all"
                                >
                                    <Play className="w-4 h-4" />
                                    Watch demo
                                </motion.button>
                            </motion.div>

                            {/* Input Preview */}
                            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8 }}
                                className="relative max-w-2xl mx-auto"
                            >
                                <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-50" />
                                <div className="relative">
                                    <GoalInputForm />
                                </div>
                            </motion.div>

                            {/* Social proof */}
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                                className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-16 text-sm text-zinc-500"
                            >
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border-2 border-zinc-900" />
                                    ))}
                                </div>
                                <div className="flex items-center gap-4">
                                    <span>Loved by <strong className="text-white">10,000+</strong> founders</span>
                                    <span className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                                        <span className="ml-1">4.9/5</span>
                                    </span>
                                </div>
                            </motion.div>
                        </>
                    )}
                </div>
            </motion.section>

            {/* ===== TRUSTED BY / LOGOS ===== */}
            <section className="py-20 border-y border-zinc-800 relative overflow-hidden">
                {/* ... (existing trusted by content) ... */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/[0.02] to-transparent" />
                <div className="max-w-6xl mx-auto px-6 relative">
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center text-sm text-zinc-500 mb-10"
                    >TRUSTED BY INNOVATIVE TEAMS</motion.p>
                    <div className="flex items-center justify-center gap-12 md:gap-20">
                        {["Stripe", "Vercel", "Linear", "Notion", "Figma"].map((name, i) => (
                            <motion.span
                                key={name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 0.4, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                whileHover={{ opacity: 0.8, scale: 1.05 }}
                                className="text-xl md:text-2xl font-bold text-zinc-400 cursor-default transition-all"
                            >{name}</motion.span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== BENTO FEATURES ===== */}
            <section id="features" className="py-32 px-6 relative overflow-hidden">
                {/* ... (existing features content) ... */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-violet-500/10 via-transparent to-transparent rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-cyan-500/10 via-transparent to-transparent rounded-full blur-3xl" />
                </div>

                <div className="max-w-7xl mx-auto relative">

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-20"
                    >
                        <motion.span
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="inline-block text-sm font-medium text-violet-400 tracking-wider bg-violet-500/10 px-4 py-1.5 rounded-full mb-4"
                        >FEATURES</motion.span>
                        <h2 className="text-4xl md:text-6xl font-bold mt-4 tracking-tight">
                            Everything you need,<br />
                            <span className="text-zinc-500">nothing you don't</span>
                        </h2>
                    </motion.div>

                    {/* Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                        {/* Large card - AI Agents */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5 }}
                            whileHover={{ y: -5, transition: { duration: 0.2 } }}
                            className="md:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 overflow-hidden group hover:border-violet-500/30 hover:shadow-[0_0_60px_-15px_rgba(139,92,246,0.2)] transition-all duration-300 relative"
                        >
                            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-3xl group-hover:from-violet-500/20 transition-all duration-500" />
                            <div className="relative">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                                        <Brain className="w-6 h-6 text-violet-400" />
                                    </div>
                                    <span className="text-xs font-medium text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full">CORE</span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold mb-3">5 AI Co-Founders</h3>
                                <p className="text-zinc-400 max-w-md mb-8">Product, Tech, Marketing, Finance, and Advisor agents work together to build your startup.</p>
                                <div className="flex flex-wrap gap-3">
                                    {["Product", "Tech", "Marketing", "Finance", "Advisor"].map((agent, i) => (
                                        <motion.div
                                            key={agent}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.1 }}
                                            whileHover={{ scale: 1.05, backgroundColor: "rgba(139, 92, 246, 0.2)" }}
                                            className="px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-sm cursor-default transition-colors"
                                        >{agent}</motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Execution Plans */}
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                            className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors group"
                        >
                            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 w-fit mb-6">
                                <Target className="w-6 h-6 text-cyan-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Execution Plans</h3>
                            <p className="text-zinc-400 text-sm">AI-generated roadmaps tailored to your startup's unique needs and goals.</p>
                        </motion.div>

                        {/* KPI Tracking */}
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                            className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
                        >
                            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 w-fit mb-6">
                                <LineChart className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Real-time Analytics</h3>
                            <p className="text-zinc-400 text-sm">Track KPIs, monitor progress, and optimize your execution strategy.</p>
                        </motion.div>

                        {/* Dependencies */}
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
                            className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
                        >
                            <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 w-fit mb-6">
                                <GitBranch className="w-6 h-6 text-orange-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Visual Dependencies</h3>
                            <p className="text-zinc-400 text-sm">Interactive graph showing task dependencies and critical paths.</p>
                        </motion.div>

                        {/* Wide card - Auto Execute */}
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
                            className="md:col-span-2 p-8 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-colors relative overflow-hidden"
                        >
                            <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-fuchsia-500/10 to-transparent rounded-full blur-3xl" />
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20">
                                            <Cpu className="w-6 h-6 text-fuchsia-400" />
                                        </div>
                                        <span className="text-xs font-medium text-fuchsia-400 bg-fuchsia-500/10 px-3 py-1 rounded-full">NEW</span>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2">Auto-Execute Mode</h3>
                                    <p className="text-zinc-400 max-w-md">Let AI agents autonomously execute tasks, write code, send emails, and make progress while you sleep.</p>
                                </div>
                                <motion.button whileHover={{ scale: 1.03 }} onClick={handleTryAutoExecute} className="px-6 py-3 rounded-full bg-fuchsia-500 text-white font-medium flex items-center gap-2 shrink-0">
                                    Try it now <ArrowUpRight className="w-4 h-4" />
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ===== TESTIMONIALS ===== */}
            <TestimonialsCarousel />

            {/* ===== PRICING ===== */}
            <section id="pricing" className="py-32 px-6 bg-zinc-950">
                <div className="max-w-6xl mx-auto">

                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <span className="text-sm font-medium text-violet-400 tracking-wider">PRICING</span>
                        <h2 className="text-4xl md:text-6xl font-bold mt-4 tracking-tight">
                            Simple, transparent<br />
                            <span className="text-zinc-500">token-based pricing</span>
                        </h2>
                        <p className="text-zinc-400 mt-6 max-w-xl mx-auto">Start free, scale as you grow. Only pay for the AI tokens you actually use.</p>
                    </motion.div>

                    {/* Pricing Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { name: "Starter", price: "Free", desc: "Perfect for trying out", features: ["5 AI conversations/day", "Basic execution plans", "Email support"], cta: "Get started" },
                            { name: "Pro", price: "$29", desc: "For serious founders", features: ["Unlimited conversations", "Auto-execute mode", "Priority support", "Advanced analytics"], cta: "Start free trial", featured: true },
                            { name: "Enterprise", price: "Custom", desc: "For teams at scale", features: ["Everything in Pro", "Custom integrations", "Dedicated support", "SLA guarantee"], cta: "Contact sales" },
                        ].map((plan, i) => (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className={`p-8 rounded-3xl border ${plan.featured ? 'bg-gradient-to-b from-violet-500/10 to-zinc-900 border-violet-500/30' : 'bg-zinc-900 border-zinc-800'} relative`}
                            >
                                {plan.featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-violet-500 text-xs font-medium">Most popular</div>}
                                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                                <p className="text-zinc-500 text-sm mb-4">{plan.desc}</p>
                                <div className="text-4xl font-bold mb-6">{plan.price}<span className="text-lg text-zinc-500 font-normal">{plan.price !== "Custom" && "/mo"}</span></div>
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                                            <Check className="w-4 h-4 text-emerald-400" />{f}
                                        </li>
                                    ))}
                                </ul>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => handlePricingCTA(plan.name)}
                                    className={`w-full py-3 rounded-full font-medium ${plan.featured ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'} transition-colors`}
                                >
                                    {plan.cta}
                                </motion.button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== CTA ===== */}
            <section className="py-32 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-500/20 blur-[150px] rounded-full" />

                <div className="max-w-4xl mx-auto text-center relative">
                    <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="text-4xl md:text-6xl font-bold mb-6"
                    >
                        Ready to build your<br />startup with AI?
                    </motion.h2>
                    <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                        className="text-xl text-zinc-400 mb-10"
                    >
                        Join thousands of founders who are building faster with AI co-founders.
                    </motion.p>
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <motion.button whileHover={{ scale: 1.02 }} onClick={handleStartBuilding}
                            className="px-8 py-4 rounded-full bg-white text-black font-medium flex items-center gap-2"
                        >
                            Start building free <ArrowRight className="w-4 h-4" />
                        </motion.button>
                        <button className="text-zinc-400 hover:text-white transition-colors">Talk to sales →</button>
                    </motion.div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="py-16 px-6 border-t border-zinc-800">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-white/10">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-lg">StartupOps</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-zinc-500">
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Docs</a>
                        </div>
                        <div className="flex items-center gap-4">
                            <a href="#" className="p-2 rounded-lg hover:bg-white/5 transition-colors"><Twitter className="w-5 h-5 text-zinc-500 hover:text-white" /></a>
                            <a href="#" className="p-2 rounded-lg hover:bg-white/5 transition-colors"><Github className="w-5 h-5 text-zinc-500 hover:text-white" /></a>
                            <a href="#" className="p-2 rounded-lg hover:bg-white/5 transition-colors"><Linkedin className="w-5 h-5 text-zinc-500 hover:text-white" /></a>
                        </div>
                    </div>
                    <p className="text-center text-sm text-zinc-600 mt-12">© 2024 StartupOps. All rights reserved.</p>
                </div>
            </footer>

            <Modal isOpen={showCreateStartup} onClose={() => setShowCreateStartup(false)} title="Create New Startup">
                <GoalInputForm />
            </Modal>

            {/* JSON-LD Schema for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "StartupOps",
                        "applicationCategory": "BusinessApplication",
                        "operatingSystem": "Web",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "AI Co-Founder Platform that helps you build, launch, and scale your startup with 5 specialized AI agents.",
                        "author": {
                            "@type": "Organization",
                            "name": "StartupOps Inc."
                        },
                        "aggregateRating": {
                            "@type": "AggregateRating",
                            "ratingValue": "4.9",
                            "ratingCount": "10420"
                        }
                    })
                }}
            />
        </div>
    );
}
