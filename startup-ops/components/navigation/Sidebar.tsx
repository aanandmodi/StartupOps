"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Target,
  ListTodo,
  GitBranch,
  Activity,
  Bell,
  BarChart3,
  Sparkles,
  ChevronRight,
  LayoutDashboard,
  Plus,
  MessageSquare,
  Zap

} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlanStore } from "@/store/usePlanStore";
import { useGoalStore } from "@/store/useGoalStore";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

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
  const { reset: resetGoal } = useGoalStore();
  const { reset: resetPlan } = usePlanStore();

  // Determine health status based on score
  const healthStatus = healthScore >= 70 ? "healthy" : healthScore >= 40 ? "at_risk" : "critical";
  const healthColor = healthScore >= 70 ? "text-emerald-500" : healthScore >= 40 ? "text-yellow-500" : "text-red-500";
  const healthBgColor = healthScore >= 70 ? "bg-emerald-500" : healthScore >= 40 ? "bg-yellow-500" : "bg-red-500";
  const statusText = healthScore >= 70 ? "On Track" : healthScore >= 40 ? "At Risk" : "Critical";

  const handleNewStartup = () => {
    resetGoal();
    resetPlan();
    router.push("/");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border z-50 flex flex-col">
      {/* Logo */}
      <div className="p-6 h-16 flex items-center border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-1.5 rounded-lg bg-sidebar-primary/10 group-hover:bg-sidebar-primary/20 transition-colors">
            <Sparkles className="w-5 h-5 text-sidebar-primary" />
          </div>
          <span className="font-bold text-sidebar-foreground tracking-tight">StartupOps</span>
        </Link>
      </div>

      {/* New Startup Button */}
      <div className="p-3">
        <Button
          onClick={handleNewStartup}
          className="w-full gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
          variant="ghost"
        >
          <Plus className="w-4 h-4" />
          New Startup
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/60")} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1 h-1 rounded-full bg-sidebar-primary" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Quick Stats - Dynamic Health Score */}

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex flex-col gap-3 p-3 rounded-lg bg-sidebar-accent/50 border border-sidebar-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Health</span>
            <span className={cn("font-medium", healthColor)}>{healthScore}%</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full", healthBgColor)}
              initial={{ width: 0 }}
              animate={{ width: `${healthScore}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Activity className="w-3 h-3" />
            <span>{statusText}</span>

          </div>
        </div>
      </div>

      {/* User / Settings */}
      <div className="p-4 border-t border-sidebar-border">
        <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors text-left">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs text-white font-bold">
            AI
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncated">My Startup</p>
            <p className="text-xs text-muted-foreground">Free Plan</p>
          </div>
        </button>
      </div>
    </aside>
  );
}
