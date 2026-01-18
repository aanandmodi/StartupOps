"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface User {
    id: number;
    email: string;
    name: string;
    avatar_url: string | null;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (provider: "google" | "github", credential: string) => Promise<void>;
    logout: () => void;
    refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing token on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem("access_token");
            if (token) {
                try {
                    const response = await fetch(`${API_URL}/auth/me`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    if (response.ok) {
                        const userData = await response.json();
                        setUser(userData);
                    } else {
                        // Try to refresh
                        const refreshed = await refreshToken();
                        if (!refreshed) {
                            localStorage.removeItem("access_token");
                            localStorage.removeItem("refresh_token");
                        }
                    }
                } catch (error) {
                    console.error("Auth check failed:", error);
                }
            }
            setIsLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (provider: "google" | "github", credential: string) => {
        const endpoint = provider === "google" ? "/auth/google" : "/auth/github";
        const body = provider === "google"
            ? { credential }
            : { code: credential };

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || "Login failed");
        }

        const data = await response.json();

        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        setUser(data.user);
    };

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
    };

    const refreshToken = async (): Promise<boolean> => {
        const refresh = localStorage.getItem("refresh_token");
        if (!refresh) return false;

        try {
            const response = await fetch(`${API_URL}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token: refresh }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("refresh_token", data.refresh_token);
                setUser(data.user);
                return true;
            }
        } catch (error) {
            console.error("Token refresh failed:", error);
        }
        return false;
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                logout,
                refreshToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// Helper to get auth headers
export function getAuthHeaders(): Record<string, string> {
    const token = typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;

    if (token) {
        return { Authorization: `Bearer ${token}` };
    }
    return {};
}
