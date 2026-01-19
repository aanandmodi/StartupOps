"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/", "/login", "/register"];

// Routes that should redirect to dashboard if already logged in
const AUTH_ROUTES = ["/login", "/register"];

interface User {
    id: number;
    email: string;
    name: string;
    avatar_url: string | null;
}

interface AuthGuardProps {
    children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        checkAuth();
    }, [pathname]);

    const checkAuth = async () => {
        const accessToken = localStorage.getItem("access_token");
        const storedUser = localStorage.getItem("user");

        // If we have a stored user and token, verify it's still valid
        if (accessToken && storedUser) {
            try {
                const response = await fetch(`${API_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                    localStorage.setItem("user", JSON.stringify(userData));

                    // If on auth routes (login), redirect to dashboard
                    if (AUTH_ROUTES.includes(pathname)) {
                        router.push("/plan");
                        return;
                    }
                } else {
                    // Token expired, try to refresh
                    const refreshed = await tryRefreshToken();
                    if (!refreshed) {
                        clearAuth();
                        if (!PUBLIC_ROUTES.includes(pathname)) {
                            router.push("/login");
                            return;
                        }
                    }
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                // On network error, still allow access to cached user for offline support
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            }
        } else {
            // No token - redirect to login if on protected route
            if (!PUBLIC_ROUTES.includes(pathname)) {
                router.push("/login");
                return;
            }
        }

        setIsLoading(false);
    };

    const tryRefreshToken = async (): Promise<boolean> => {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) return false;

        try {
            const response = await fetch(`${API_URL}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token: refreshToken })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("refresh_token", data.refresh_token);
                localStorage.setItem("user", JSON.stringify(data.user));
                setUser(data.user);
                return true;
            }
        } catch (error) {
            console.error("Token refresh failed:", error);
        }

        return false;
    };

    const clearAuth = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        setUser(null);
    };

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-6">
                    {/* Logo with pulse animation */}
                    <div className="relative">
                        <div className="w-14 h-14 rounded-xl bg-foreground flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-background">
                                <path
                                    d="M12 2L4 7v10l8 5 8-5V7l-8-5z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path d="M12 22V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M20 7L12 12 4 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        {/* Animated ring */}
                        <div className="absolute -inset-2 rounded-2xl border border-border animate-pulse" />
                    </div>

                    {/* Spinner */}
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>

                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

// Export helper to get current user
export function getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
}

// Export helper to check if logged in
export function isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("access_token");
}

// Export logout function
export function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    window.location.href = "/login";
}
