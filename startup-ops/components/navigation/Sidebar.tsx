"use client";

import { Logo } from "@/components/common/Logo";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ListTodo,
  GitBranch,
  Activity,
  BarChart3,
  Plus,
  MessageSquare,
  Zap,
  LogOut,
  Home,
  Building2,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlanStore } from "@/store/usePlanStore";
import { useGoalStore } from "@/store/useGoalStore";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { isAuthenticated, getCurrentUser, logout } from "@/components/auth/AuthGuard";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { GoalInputForm } from "@/components/goal/GoalInputForm";

const navItems = [
  { href: "/startups", label: "My Startups", icon: Building2 },
  { href: "/plan", label: "Execution Plan", icon: ListTodo },
  { href: "/chat", label: "Agent Chat", icon: MessageSquare },
  { href: "/execute", label: "Auto-Execute", icon: Zap },
  { href: "/graph", label: "Dependencies", icon: GitBranch },
  { href: "/metrics", label: "KPI & Metrics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { healthScore } = usePlanStore();
  const { reset: resetGoal, setStartupId } = useGoalStore();
  const { reset: resetPlan } = usePlanStore();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [showCreateStartup, setShowCreateStartup] = useState(false);

  useEffect(() => {
    setLoggedIn(isAuthenticated());
    setUser(getCurrentUser());
  }, []);

  // Determine health status based on score
  const healthColor = healthScore >= 70 ? "text-emerald-500" : healthScore >= 40 ? "text-yellow-500" : "text-red-500";
  const healthBgColor = healthScore >= 70 ? "bg-emerald-500" : healthScore >= 40 ? "bg-yellow-500" : "bg-red-500";
  const statusText = healthScore >= 70 ? "On Track" : healthScore >= 40 ? "At Risk" : "Critical";

  const handleNewStartup = () => {
    // Open the modal instead of resetting immediately? 
    // Or maybe reset and show modal.
    // prompt said: "prompting them to create a new startup".
    // For "New Startup" button, opening the modal is perfect.
    resetGoal();
    resetPlan();
    setShowCreateStartup(true);
  };

  const handleNavigation = async (e: React.MouseEvent, href: string) => {
    if (href === "/plan") {
      e.preventDefault();

      try {
        const token = localStorage.getItem("access_token");
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
        // No startups found -> Show popup
        setShowCreateStartup(true);
      } catch (error) {
        console.error("Failed to check startups:", error);
        router.push("/plan");
      }
    }
  };

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border z-50 flex flex-col">
        {/* Logo - Hexagonal cube design from image */}
        <div className="p-4 h-16 flex items-center justify-between border-b border-sidebar-border">
          <Link href="/" className="block group">
            <Logo size="md" />
          </Link>
          <Link href="/" className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="Home">
            <Home className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>

        {/* New Startup Button - Frosted glass */}
        <div className="p-3">
          <Button
            onClick={handleNewStartup}
            variant="ghost"
            className="w-full gap-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-foreground backdrop-blur-sm"
          >
            <Plus className="w-4 h-4" />
            New Startup
          </Button>
        </div>

        {/* Navigation - Frosted glass style */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href} onClick={(e) => handleNavigation(e, item.href)}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative overflow-hidden",
                    isActive
                      ? "bg-[#2a2438] text-white font-medium border border-[#3d3450] shadow-[0_8px_16px_-4px_rgba(42,36,56,0.5)] backdrop-blur-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent opacity-50" />
                  )}
                  <Icon className={cn("w-4 h-4 relative z-10", isActive ? "text-violet-300" : "text-muted-foreground")} />
                  <span className="relative z-10">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-300 relative z-10 shadow-[0_0_8px_rgba(167,139,250,0.5)]" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Health Score */}
        <div className="p-3 border-t border-border">
          <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-accent/50 border border-border/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Execution Health</span>
              <span className={cn("font-semibold", healthColor)}>{healthScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", healthBgColor)}
                initial={{ width: 0 }}
                animate={{ width: `${healthScore}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="w-3.5 h-3.5" />
              <span>{statusText}</span>
            </div>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
        </div>

        {/* User Section */}
        <div className="p-3 border-t border-border">
          {loggedIn && user ? (
            <div className="flex items-center gap-3">
              <Link href="/settings" className="flex items-center gap-3 flex-1 min-w-0 group cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm text-white font-bold">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-violet-400 transition-colors">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </Link>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-2 rounded-xl bg-accent/30">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm text-white font-bold">
                AI
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Guest</p>
                <p className="text-xs text-muted-foreground">Free Plan</p>
              </div>
            </div>
          )}
        </div>
      </aside >

      <Modal isOpen={showCreateStartup} onClose={() => setShowCreateStartup(false)} title="Create New Startup">
        <GoalInputForm />
      </Modal>
    </>
  );
}
