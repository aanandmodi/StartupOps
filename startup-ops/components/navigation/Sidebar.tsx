"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  // { href: "/", label: "New Plan", icon: Target }, // Maybe keep a link back to home to create new?
  { href: "/plan", label: "Execution Plan", icon: ListTodo },
  { href: "/graph", label: "Dependencies", icon: GitBranch },
  { href: "/metrics", label: "KPI & Metrics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

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

      {/* Quick Stats - Compact */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex flex-col gap-3 p-3 rounded-lg bg-sidebar-accent/50 border border-sidebar-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Health</span>
            <span className="text-emerald-500 font-medium">87%</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-[87%]" />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Activity className="w-3 h-3" />
            <span>On Track</span>
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
