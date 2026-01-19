"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
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
    EyeOff
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/common/Logo";

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

export function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isLogin, setIsLogin] = useState(true);

    const handleGoogleLogin = async () => {
        setIsLoading("google");
        setError(null);
        try {
            alert("Google OAuth requires Google Client ID setup. Please configure GOOGLE_CLIENT_ID in your environment.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Google login failed");
        } finally {
            setIsLoading(null);
        }
    };

    const handleGitHubLogin = () => {
        setIsLoading("github");
        setError(null);
        const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
        if (!clientId) {
            alert("GitHub OAuth requires GITHUB_CLIENT_ID setup.");
            setIsLoading(null);
            return;
        }
        const redirectUri = `${window.location.origin}/auth/callback/github`;
        const scope = "user:email read:user";
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    };

    const handleDemoLogin = async () => {
        setIsLoading("demo");
        try {
            localStorage.setItem("demo_mode", "true");
            router.push("/plan");
        } catch (err) {
            setError("Demo login failed");
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex overflow-hidden font-sans">
            {/* Left Side - Brand & Value Prop */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden bg-[#0A0A0A]">
                {/* Background Glows */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full opacity-10" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-900/20 blur-[120px] rounded-full opacity-10" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-16">
                        <Logo size="md" />
                        <span className="text-xl font-bold tracking-tight">StartupOps</span>
                    </div>

                    <div className="max-w-xl">
                        <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight">
                            Your AI Co-Founders,<br />
                            <span className="text-white/60">Ready to Execute</span>
                        </h1>
                        <p className="text-lg text-white/50 mb-12 leading-relaxed">
                            Transform your startup idea into an actionable execution plan with AI-powered co-founders for every domain.
                        </p>

                        <div className="space-y-6">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + index * 0.1 }}
                                    className="flex items-center gap-4 group"
                                >
                                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/80 group-hover:bg-white/10 group-hover:text-white transition-colors">
                                        <feature.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-white/70 font-medium">{feature.text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 mt-12 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="flex gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((_, i) => (
                            <div key={i} className="text-white text-sm">★</div>
                        ))}
                    </div>
                    <p className="text-white/80 italic mb-4">
                        "StartupOps saved us months of planning. Our AI co-founders generated a complete roadmap in minutes."
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500" />
                        <div>
                            <div className="text-sm font-semibold">Sarah K.</div>
                            <div className="text-xs text-white/40">Founder at TechStartup</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative bg-black">
                {/* Mobile Background Glow */}
                <div className="absolute inset-0 lg:hidden overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/20 blur-[80px] rounded-full opacity-20" />
                </div>

                <div className="w-full max-w-md relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/50"
                    >
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
                            <p className="text-white/40 text-sm">Sign in to access your dashboard</p>
                        </div>

                        {/* Toggle */}
                        <div className="flex p-1 bg-white/5 rounded-lg mb-8">
                            <button
                                onClick={() => setIsLogin(true)}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-white text-black shadow-lg' : 'text-white/50 hover:text-white'}`}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => setIsLogin(false)}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-white text-black shadow-lg' : 'text-white/50 hover:text-white'}`}
                            >
                                Sign Up
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-white/70 ml-1">Email address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <input
                                        type="email"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all text-sm"
                                        placeholder="founder@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-white/70 ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all text-sm"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="flex justify-end">
                                    <button className="text-xs text-primary hover:text-primary/80 transition-colors">Forgot password?</button>
                                </div>
                            </div>

                            <Button
                                onClick={handleDemoLogin} // Keeping demo login as the primary action for now per existing logic
                                disabled={isLoading !== null}
                                className="w-full h-12 bg-white text-black hover:bg-gray-200 rounded-xl font-semibold mt-2"
                            >
                                {isLoading === "demo" ? "Signing In..." : (isLogin ? "Sign In" : "Create Account")}
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-widest">
                                <span className="bg-[#111] px-4 text-white/30 font-medium">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                onClick={handleGoogleLogin}
                                disabled={isLoading !== null}
                                variant="outline"
                                className="h-11 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-white/80 rounded-xl"
                            >
                                <GoogleIcon />
                                <span className="ml-2">Google</span>
                            </Button>
                            <Button
                                onClick={handleGitHubLogin}
                                disabled={isLoading !== null}
                                variant="outline"
                                className="h-11 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-white/80 rounded-xl"
                            >
                                <Github className="w-5 h-5" />
                                <span className="ml-2">GitHub</span>
                            </Button>
                        </div>

                        <p className="text-[10px] text-white/20 text-center mt-8">
                            OAuth buttons use demo mode. Configure API keys for production.
                        </p>
                    </motion.div>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-white/40">
                            By continuing, you agree to our <a href="#" className="text-white/60 hover:underline">Terms of Service</a> and <a href="#" className="text-white/60 hover:underline">Privacy Policy</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
