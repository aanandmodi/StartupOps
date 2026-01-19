"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Cpu,
    Zap,
    Users,
    Shield,
    ArrowRight,
    Mail,
    Lock,
    Github,
    Eye,
    EyeOff,
    Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/common/Logo";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Google Icon Component
function GoogleIcon() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
        </svg>
    );
}

const features = [
    {
        icon: Cpu,
        text: "AI Co-Founders for Product, Tech, Marketing & Finance",
    },
    {
        icon: Zap,
        text: "Auto-generate execution plans from your idea",
    },
    {
        icon: Users,
        text: "Chat with specialized AI agents anytime",
    },
    {
        icon: Shield,
        text: "Enterprise-grade security & privacy",
    },
];

interface AuthPageProps {
    defaultMode?: "login" | "signup";
}

export function AuthPage({ defaultMode = "login" }: AuthPageProps) {
    const router = useRouter();
    const [mode, setMode] = useState<"login" | "signup">(defaultMode);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Form fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Update mode when defaultMode prop changes
    useEffect(() => {
        setMode(defaultMode);
    }, [defaultMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Demo Bypass
            if (email === "demo@startupops.com") {
                localStorage.setItem("demo_mode", "true");
                setTimeout(() => router.push("/plan"), 1000);
                return;
            }

            const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
            const body = mode === "login"
                ? { email, password }
                : { name, email, password };

            const response = await fetch(`${API_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || "Authentication failed");

            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("user", JSON.stringify(data.user));

            const pendingGoal = sessionStorage.getItem("pendingStartupGoal");
            if (pendingGoal) {
                sessionStorage.removeItem("pendingStartupGoal");
                router.push("/");
                return;
            }

            try {
                const startupsResponse = await fetch(`${API_URL}/startups/all`, {
                    headers: { "Authorization": `Bearer ${data.access_token}` }
                });
                if (startupsResponse.ok) {
                    const startups = await startupsResponse.json();
                    if (startups.length > 1) {
                        router.push("/startups");
                        return;
                    }
                }
            } catch { }

            router.push("/plan");
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = async (provider: "google" | "github") => {
        try {
            setIsLoading(true);
            const { auth, googleProvider, githubProvider } = await import("@/lib/firebase");
            const { signInWithPopup } = await import("firebase/auth");

            const authProvider = provider === "google" ? googleProvider : githubProvider;
            const result = await signInWithPopup(auth, authProvider);
            const user = result.user;

            // Get ID token
            const token = await user.getIdToken();

            // Send to backend to create session/verify
            // Note: You might need to adjust this endpoint if your backend expects different format
            // For now, we assume we might need a new endpoint or adapting the existing one.
            // But immediate "auth" is done via Firebase. 

            // For this implementation, we'll store what we have and redirect, 
            // assuming the backend will eventually verify the Firebase token.

            localStorage.setItem("access_token", token); // Storing Firebase token as access token
            localStorage.setItem("user", JSON.stringify({
                id: user.uid,
                email: user.email,
                name: user.displayName,
                avatar_url: user.photoURL,
                provider: provider
            }));

            router.push("/plan");
        } catch (error: any) {
            console.error("Social login error:", error);
            setError(error.message || "Failed to sign in with " + provider);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDemoLogin = () => {
        setIsLoading(true);
        setTimeout(() => {
            localStorage.setItem("demo_mode", "true");
            router.push("/plan");
        }, 800);
    };

    return (
        <div className="min-h-screen relative bg-black text-white font-sans overflow-hidden flex">
            {/* Left Side - Brand & Experience - Mango Curve Cut */}
            <div
                className="hidden lg:flex flex-col justify-between p-12 lg:p-16 bg-[#050505] w-[60%] relative z-20"
                style={{ clipPath: "path('M 0 0 L 85% 0 C 100% 35% 75% 65% 95% 100% L 0 100% Z')" }}
            >
                {/* Dynamic Background Mesh */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-[-20%] w-[800px] h-[800px] bg-primary/30 blur-[150px] rounded-full mix-blend-screen opacity-20 animate-pulse-slow" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-900/40 blur-[120px] rounded-full mix-blend-screen opacity-20" />
                    <div className="absolute top-[40%] left-[20%] w-[400px] h-[400px] bg-violet-600/10 blur-[100px] rounded-full mix-blend-overlay" />
                    {/* Grid pattern removed from left side as requested */}
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-20 animate-fade-in">
                        <Logo size="md" variant="icon" className="text-white" />
                        <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                            StartupOps
                        </span>
                    </div>

                    <div className="max-w-xl">
                        <h1 className="text-5xl lg:text-6xl font-bold tracking-tight mb-8 leading-[1.1]">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60">
                                Your AI Co-Founders,
                            </span>
                            <br />
                            <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-400">
                                Ready to Execute
                            </span>
                        </h1>
                        <p className="text-lg text-white/60 mb-12 leading-relaxed font-light">
                            Transform your startup idea into an actionable execution plan with intelligent agents for Product, Engineering, Marketing, and Finance.
                        </p>

                        <div className="space-y-5">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                                    className="flex items-center gap-4 group cursor-default"
                                >
                                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-primary group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-black/20">
                                        <feature.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-white/80 font-medium group-hover:text-white transition-colors">
                                        {feature.text}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 mt-12 p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-md shadow-2xl">
                    <div className="flex gap-1 mb-3 text-amber-400">
                        {[1, 2, 3, 4, 5].map((_, i) => (
                            <span key={i}>★</span>
                        ))}
                    </div>
                    <p className="text-white/90 italic mb-4 font-medium leading-relaxed">
                        "StartupOps feels like cheating. It generated a complete roadmap in minutes that would have taken us months to plan manually."
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 border border-white/20" />
                        <div>
                            <div className="text-sm font-semibold text-white">Sarah Jenkins</div>
                            <div className="text-xs text-white/50">Founder, TechFlow AI</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="relative flex-1 flex items-center justify-center p-6 lg:p-12 bg-[#000] -ml-[15%] lg:ml-0">
                {/* Background Grid & Glows */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {/* Rotated Grid Container - Opposite Angle */}
                    <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[url('/grid-pattern.svg')] opacity-[0.4] -rotate-12 pointer-events-none" />

                    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full opacity-20" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-violet-600/10 blur-[80px] rounded-full opacity-20" />
                </div>

                <div className="w-full max-w-[420px] relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-[#0A0A0A] border border-white/10 rounded-[32px] p-8 lg:p-10 shadow-2xl shadow-black ring-1 ring-white/5 backdrop-blur-xl"
                    >
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                                {mode === "login" ? "Welcome back" : "Create account"}
                            </h2>
                            <p className="text-white/50 text-sm">
                                {mode === "login" ? "Sign in to access your dashboard" : "Get started with your AI co-founders"}
                            </p>
                        </div>

                        {/* Sliding Toggle */}
                        <div className="relative flex p-1.5 bg-white/5 rounded-2xl mb-10 border border-white/5 h-14">
                            {/* Sliding Background */}
                            <motion.div
                                className="absolute top-1.5 bottom-1.5 rounded-xl bg-primary shadow-lg shadow-primary/25 z-0"
                                initial={false}
                                animate={{
                                    left: mode === "login" ? "6px" : "50%",
                                    right: mode === "login" ? "50%" : "6px",
                                }}
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />

                            <button
                                onClick={() => setMode("login")}
                                className={`flex-1 relative z-10 text-sm font-semibold transition-colors duration-300 ${mode === "login" ? 'text-white' : 'text-white/40 hover:text-white'}`}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => setMode("signup")}
                                className={`flex-1 relative z-10 text-sm font-semibold transition-colors duration-300 ${mode === "signup" ? 'text-white' : 'text-white/40 hover:text-white'}`}
                            >
                                Sign Up
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <AnimatePresence mode="wait">
                                {mode === "signup" && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-2 overflow-hidden"
                                    >
                                        <label className="text-[11px] font-bold text-white/40 ml-1 uppercase tracking-widest">Full Name</label>
                                        <Input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-[#111] border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:ring-0 transition-all text-sm h-12"
                                            placeholder="John Doe"
                                            required={mode === "signup"}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-white/40 ml-1 uppercase tracking-widest">Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[#111] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:ring-0 transition-all text-sm h-12"
                                        placeholder="founder@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-white/40 ml-1 uppercase tracking-widest">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[#111] border border-white/10 rounded-xl pl-11 pr-11 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:ring-0 transition-all text-sm h-12"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {mode === "login" && (
                                    <div className="flex justify-end pt-1">
                                        <button type="button" className="text-xs text-primary hover:text-primary/80 transition-colors font-medium">Forgot password?</button>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 bg-white text-black hover:bg-white/90 rounded-full font-bold mt-4 shadow-lg shadow-white/5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        {mode === "login" ? "Signing In..." : "Creating Account..."}
                                    </>
                                ) : (
                                    <>
                                        {mode === "login" ? "Sign In" : "Create Account"}
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                                <span className="bg-[#0A0A0A] px-4 text-white/30">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                type="button"
                                onClick={() => handleSocialLogin("google")}
                                variant="outline"
                                className="h-11 bg-transparent border-white/10 hover:bg-white/5 hover:text-white text-white/60 rounded-xl hover:border-white/20 transition-all"
                            >
                                <GoogleIcon />
                                <span className="ml-2 font-medium">Google</span>
                            </Button>
                            <Button
                                type="button"
                                onClick={() => handleSocialLogin("github")}
                                variant="outline"
                                className="h-11 bg-transparent border-white/10 hover:bg-white/5 hover:text-white text-white/60 rounded-xl hover:border-white/20 transition-all"
                            >
                                <Github className="w-5 h-5" />
                                <span className="ml-2 font-medium">GitHub</span>
                            </Button>
                        </div>

                        <div className="mt-8 text-center">
                            <Button
                                type="button"
                                onClick={handleDemoLogin}
                                variant="link"
                                className="text-white/20 hover:text-white/50 text-xs font-normal transition-colors p-0 h-auto"
                            >
                                Try Demo Mode
                            </Button>
                        </div>
                    </motion.div>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-white/30 font-medium">
                            By continuing, you agree to our <a href="#" className="text-white/40 hover:text-white hover:underline transition-colors">Terms of Service</a> and <a href="#" className="text-white/40 hover:text-white hover:underline transition-colors">Privacy Policy</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
