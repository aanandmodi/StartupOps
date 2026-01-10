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
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Goal Input", icon: Target },
  { href: "/plan", label: "Execution Plan", icon: ListTodo },
  { href: "/graph", label: "Dependencies", icon: GitBranch },
  { href: "/metrics", label: "KPI & Metrics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border z-50 flex flex-col"
    >
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="p-2 rounded-xl gradient-primary glow-sm">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">
              StartupOps
            </h1>
            <p className="text-xs text-sidebar-foreground/60">AI Co-Founder</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg glow-sm"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Quick Stats */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="glass-subtle rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sidebar-foreground/80">
            <Activity className="w-4 h-4 text-status-healthy" />
            <span className="text-sm">Health: 87%</span>
          </div>
          <div className="flex items-center gap-2 text-sidebar-foreground/80">
            <Bell className="w-4 h-4 text-status-warning" />
            <span className="text-sm">3 Alerts</span>
          </div>
        </div>
      </div>

      {/* Version */}
      <div className="p-4 text-center">
        <span className="text-xs text-sidebar-foreground/40">v1.0.0 Beta</span>
      </div>
    </motion.aside>
  );
}
