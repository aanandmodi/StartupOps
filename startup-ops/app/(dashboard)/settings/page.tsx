"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, CreditCard, BarChart2, Shield, LogOut, Code, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";
import { useAuth } from "@/components/auth/AuthProvider";
import { app } from "@/lib/firebase";

export default function SettingsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const auth = getAuth(app);

    // Mock data for now - real data would come from the backend/auth context
    const [userData, setUserData] = useState({
        name: user?.displayName || "User",
        email: user?.email || "user@example.com",
        plan: "Free", // Default to Free
        usage: 1250,
        limit: 15000,
    });

    const [activeTab, setActiveTab] = useState("profile");

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/login");
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const tabs = [
        { id: "profile", label: "Profile", icon: User },
        { id: "billing", label: "Plan & Billing", icon: CreditCard },
        { id: "usage", label: "Usage", icon: BarChart2 },
        { id: "legal", label: "Legal & Privacy", icon: Shield },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">
                        Settings & Preferences
                    </h1>
                    <p className="text-gray-400">Manage your account, subscription, and usage.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Sidebar Navigation */}
                    <div className="md:col-span-3 space-y-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === tab.id
                                    ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}

                        <div className="pt-8 border-t border-white/10 mt-8">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">Sign Out</span>
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="md:col-span-9">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#12121a] border border-white/5 rounded-2xl p-6 md:p-8 min-h-[500px]"
                        >
                            {activeTab === "profile" && (
                                <div className="space-y-8">
                                    <h2 className="text-xl font-semibold border-b border-white/10 pb-4">Profile Information</h2>
                                    <div className="flex items-center gap-6">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-4xl font-bold">
                                            {userData.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-medium">{userData.name}</h3>
                                            <p className="text-gray-400">{userData.email}</p>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 mt-2">
                                                Verified Account
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid gap-6 max-w-xl">
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-400">Full Name</label>
                                            <input
                                                type="text"
                                                value={userData.name}
                                                readOnly
                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-gray-300 focus:outline-none cursor-not-allowed opacity-70"
                                            />
                                            <p className="text-xs text-gray-500">Contact support to change your name.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-400">Email Address</label>
                                            <input
                                                type="text"
                                                value={userData.email}
                                                readOnly
                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-gray-300 focus:outline-none cursor-not-allowed opacity-70"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "billing" && (
                                <div className="space-y-8">
                                    <h2 className="text-xl font-semibold border-b border-white/10 pb-4">Subscription Plan</h2>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Current Plan Card */}
                                        <div className="p-6 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                                <Code className="w-24 h-24" />
                                            </div>
                                            <div className="relative z-10">
                                                <p className="text-sm text-gray-400 mb-1">Current Plan</p>
                                                <h3 className="text-2xl font-bold text-white mb-4">{userData.plan} Tier</h3>
                                                <ul className="space-y-2 text-sm text-gray-400 mb-6">
                                                    <li className="flex items-center gap-2">✓ Llama 3.1 8B Model</li>
                                                    <li className="flex items-center gap-2">✓ 15,000 Tokens / day</li>
                                                    <li className="flex items-center gap-2">✓ Basic Support</li>
                                                </ul>
                                                <button className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 cursor-default">
                                                    Active
                                                </button>
                                            </div>
                                        </div>

                                        {/* Upgrade Card */}
                                        <div className="p-6 rounded-xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 relative overflow-hidden group hover:border-violet-500/50 transition-all">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <Shield className="w-24 h-24 text-violet-400" />
                                            </div>
                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-sm text-violet-300">Recommended</p>
                                                    <span className="px-2 py-0.5 rounded text-xs bg-violet-500 text-white font-bold">PRO</span>
                                                </div>
                                                <h3 className="text-2xl font-bold text-white mb-1">Premium Tier</h3>
                                                <p className="text-sm text-gray-400 mb-4">$19 / month</p>

                                                <ul className="space-y-2 text-sm text-gray-300 mb-6">
                                                    <li className="flex items-center gap-2 text-white">✓ Llama 3.3 70B (GPT-4 Class)</li>
                                                    <li className="flex items-center gap-2 text-white">✓ 100,000 Tokens / day</li>
                                                    <li className="flex items-center gap-2 text-white">✓ Priority Queueing</li>
                                                    <li className="flex items-center gap-2 text-white">✓ Early Access Features</li>
                                                </ul>

                                                <button className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold shadow-lg shadow-violet-500/20 transition-all">
                                                    Upgrade to Premium
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "usage" && (
                                <div className="space-y-8">
                                    <h2 className="text-xl font-semibold border-b border-white/10 pb-4">Usage Statistics</h2>

                                    <div className="p-6 rounded-xl bg-black/20 border border-white/10">
                                        <div className="flex justify-between items-end mb-4">
                                            <div>
                                                <p className="text-gray-400 text-sm mb-1">Daily Token Usage</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-3xl font-bold text-white">{userData.usage.toLocaleString()}</span>
                                                    <span className="text-gray-500">/ {userData.limit.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-medium text-green-400">{(userData.usage / userData.limit * 100).toFixed(1)}%</span>
                                            </div>
                                        </div>

                                        <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(userData.usage / userData.limit) * 100}%` }}
                                                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">Resets daily at 00:00 UTC</p>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Total Startups</p>
                                            <p className="text-2xl font-bold">3</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Messages Sent</p>
                                            <p className="text-2xl font-bold">142</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Saved Hours</p>
                                            <p className="text-2xl font-bold text-violet-400">~12h</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "legal" && (
                                <div className="space-y-8">
                                    <h2 className="text-xl font-semibold border-b border-white/10 pb-4">Legal & Privacy</h2>

                                    <div className="grid gap-4">
                                        <a href="/legal/terms" className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-white">Terms of Service</h4>
                                                    <p className="text-sm text-gray-400">Read our terms and conditions</p>
                                                </div>
                                            </div>
                                            <span className="text-gray-500 group-hover:text-white transition-colors">→</span>
                                        </a>

                                        <a href="/legal/privacy" className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                                    <Shield className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-white">Privacy Policy</h4>
                                                    <p className="text-sm text-gray-400">How we handle your data</p>
                                                </div>
                                            </div>
                                            <span className="text-gray-500 group-hover:text-white transition-colors">→</span>
                                        </a>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
