"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";

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

// GitHub Icon Component
function GitHubIcon() {
    return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
            />
        </svg>
    );
}

export function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        setIsLoading("google");
        setError(null);

        // For demo purposes - in production, use Google Sign-In SDK
        // This would normally be done via Google OAuth popup
        try {
            // Simulate getting a credential from Google OAuth
            // In real implementation, use @react-oauth/google
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
            alert("GitHub OAuth requires GITHUB_CLIENT_ID setup in your environment.");
            setIsLoading(null);
            return;
        }

        // Redirect to GitHub OAuth
        const redirectUri = `${window.location.origin}/auth/callback/github`;
        const scope = "user:email read:user";
        const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

        window.location.href = githubUrl;
    };

    const handleDemoLogin = async () => {
        // Demo mode - bypass auth for testing
        setIsLoading("demo");
        try {
            // Store a demo token
            localStorage.setItem("demo_mode", "true");
            router.push("/plan");
        } catch (err) {
            setError("Demo login failed");
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/20 blur-[120px] rounded-full opacity-20" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[100px] rounded-full opacity-20" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="glass-card p-8 rounded-2xl border border-white/10">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/10 mb-4">
                            <Sparkles className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mb-2">
                            Welcome to StartupOps
                        </h1>
                        <p className="text-muted-foreground">
                            Sign in to access your AI co-founders
                        </p>
                    </div>

                    {/* Login Buttons */}
                    <div className="space-y-3">
                        <Button
                            onClick={handleGoogleLogin}
                            disabled={isLoading !== null}
                            className="w-full h-12 bg-white text-black hover:bg-gray-100 gap-3"
                        >
                            <GoogleIcon />
                            {isLoading === "google" ? "Connecting..." : "Continue with Google"}
                        </Button>

                        <Button
                            onClick={handleGitHubLogin}
                            disabled={isLoading !== null}
                            className="w-full h-12 bg-[#24292e] hover:bg-[#2f363d] gap-3"
                        >
                            <GitHubIcon />
                            {isLoading === "github" ? "Connecting..." : "Continue with GitHub"}
                        </Button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="bg-background px-2 text-muted-foreground">
                                    or
                                </span>
                            </div>
                        </div>

                        <Button
                            onClick={handleDemoLogin}
                            disabled={isLoading !== null}
                            variant="outline"
                            className="w-full h-12 border-white/10 hover:bg-white/5"
                        >
                            {isLoading === "demo" ? "Loading..." : "Try Demo Mode"}
                        </Button>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Footer */}
                    <p className="text-xs text-muted-foreground text-center mt-6">
                        By signing in, you agree to our Terms of Service and Privacy Policy
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
