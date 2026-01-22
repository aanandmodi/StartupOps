"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider, githubProvider } from "@/lib/firebase";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (provider: "google" | "github") => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<string | null>;
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (providerName: "google" | "github") => {
        try {
            const provider = providerName === "google" ? googleProvider : githubProvider;
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const refreshToken = async (): Promise<string | null> => {
        if (!auth.currentUser) return null;
        try {
            return await auth.currentUser.getIdToken(true);
        } catch (error) {
            console.error("Token refresh failed:", error);
            return null;
        }
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

// Helper to get auth headers asynchronously - waits for Firebase auth state
export async function getAuthHeaders(): Promise<Record<string, string>> {
    try {
        // Wait for Firebase auth state to be determined
        const user = await new Promise<User | null>((resolve) => {
            // If already have a user, return immediately
            if (auth.currentUser) {
                resolve(auth.currentUser);
                return;
            }

            // Otherwise wait for auth state change (with timeout)
            const timeout = setTimeout(() => {
                unsubscribe();
                resolve(null);
            }, 3000); // 3 second timeout

            const unsubscribe = onAuthStateChanged(auth, (user) => {
                clearTimeout(timeout);
                unsubscribe();
                resolve(user);
            });
        });

        if (user) {
            const token = await user.getIdToken(true); // Force refresh
            // Also update localStorage for consistency
            localStorage.setItem("access_token", token);
            return { Authorization: `Bearer ${token}` };
        }

        // Fallback to localStorage token if no Firebase user
        const storedToken = localStorage.getItem("access_token");
        if (storedToken) {
            return { Authorization: `Bearer ${storedToken}` };
        }

        return {};
    } catch (error) {
        console.error("Error getting auth token:", error);
        // Final fallback to localStorage
        const storedToken = localStorage.getItem("access_token");
        if (storedToken) {
            return { Authorization: `Bearer ${storedToken}` };
        }
        return {};
    }
}
