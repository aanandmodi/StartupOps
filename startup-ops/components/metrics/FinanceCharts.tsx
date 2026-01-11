"use client";

import { motion } from "framer-motion";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
} from "recharts";
import { GlassCard } from "@/components/common/GlassCard";
import { FinanceMetrics } from "@/store/useMetricsStore";
import { DollarSign, TrendingUp, Calendar, Flame } from "lucide-react";

interface FinanceChartsProps {
    metrics: FinanceMetrics;
}

export function FinanceCharts({ metrics }: FinanceChartsProps) {
    // Combine revenue and expenses
    const revenueExpenseData = metrics.revenue.map((r, i) => ({
        date: r.date.slice(5),
        revenue: r.value,
        expenses: metrics.expenses[i]?.value || 0,
        profit: r.value - (metrics.expenses[i]?.value || 0),
    }));

    // Summary stats
    const totalRevenue = metrics.revenue.reduce((sum, r) => sum + r.value, 0);
    const totalExpenses = metrics.expenses.reduce((sum, e) => sum + e.value, 0);

    const stats = [
        { label: "MRR", value: `$${(metrics.mrr / 1000).toFixed(1)}K`, icon: DollarSign, color: "text-status-healthy" },
        { label: "ARR", value: `$${(metrics.arr / 1000).toFixed(0)}K`, icon: TrendingUp, color: "text-chart-1" },
        { label: "Runway", value: `${metrics.runway} mo`, icon: Calendar, color: "text-chart-2" },
        { label: "Burn Rate", value: `$${(metrics.burnRate / 1000).toFixed(1)}K/mo`, icon: Flame, color: "text-status-warning" },
    ];

    // Pie chart data for allocation
    const allocationData = [
        { name: "Product", value: 35, color: "oklch(0.65 0.25 260)" },
        { name: "Marketing", value: 25, color: "oklch(0.70 0.20 180)" },
        { name: "Operations", value: 20, color: "oklch(0.75 0.18 140)" },
        { name: "Team", value: 15, color: "oklch(0.80 0.20 80)" },
        { name: "Other", value: 5, color: "oklch(0.70 0.22 320)" },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <GlassCard className="p-4">
                            <div className="flex items-center gap-3">
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                <div>
                                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                ))}
            </div>

            {/* Revenue vs Expenses */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <GlassCard className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">Revenue vs Expenses</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueExpenseData} barCategoryGap="20%">
                                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0.02 260 / 20%)" />
                                <XAxis dataKey="date" stroke="oklch(0.5 0.02 260)" fontSize={12} />
                                <YAxis stroke="oklch(0.5 0.02 260)" fontSize={12} tickFormatter={(v) => `$${v / 1000}K`} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "oklch(0.15 0.02 260 / 90%)",
                                        border: "1px solid oklch(0.3 0.02 260)",
                                        borderRadius: "8px",
                                        color: "oklch(0.95 0.01 260)",
                                    }}
                                    formatter={(value: any) => [`$${value.toLocaleString()}`, ""]}
                                />
                                <Bar dataKey="revenue" fill="oklch(0.70 0.20 145)" radius={[4, 4, 0, 0]} name="Revenue" />
                                <Bar dataKey="expenses" fill="oklch(0.65 0.22 25)" radius={[4, 4, 0, 0]} name="Expenses" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            </motion.div>

            {/* Profit Trend & Budget Allocation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <GlassCard className="p-6">
                        <h3 className="font-semibold text-foreground mb-4">Profit Trend</h3>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={revenueExpenseData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0.02 260 / 20%)" />
                                    <XAxis dataKey="date" stroke="oklch(0.5 0.02 260)" fontSize={11} />
                                    <YAxis stroke="oklch(0.5 0.02 260)" fontSize={11} tickFormatter={(v) => `$${v / 1000}K`} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "oklch(0.15 0.02 260 / 90%)",
                                            border: "1px solid oklch(0.3 0.02 260)",
                                            borderRadius: "8px",
                                            color: "oklch(0.95 0.01 260)",
                                        }}
                                        formatter={(value: any) => [`$${value.toLocaleString()}`, "Profit"]}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="profit"
                                        stroke="oklch(0.65 0.25 260)"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <GlassCard className="p-6">
                        <h3 className="font-semibold text-foreground mb-4">Budget Allocation</h3>
                        <div className="h-48 flex items-center">
                            <ResponsiveContainer width="60%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={allocationData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={70}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {allocationData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "oklch(0.15 0.02 260 / 90%)",
                                            border: "1px solid oklch(0.3 0.02 260)",
                                            borderRadius: "8px",
                                            color: "oklch(0.95 0.01 260)",
                                        }}
                                        formatter={(value: any) => [`${value}%`, ""]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex-1 space-y-2">
                                {allocationData.map((item) => (
                                    <div key={item.name} className="flex items-center gap-2 text-sm">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-foreground">{item.name}</span>
                                        <span className="text-muted-foreground ml-auto">{item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <GlassCard className="p-6 bg-status-healthy/10 border-status-healthy/30">
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Total Revenue (30d)</h4>
                        <p className="text-3xl font-bold text-status-healthy">${(totalRevenue / 1000).toFixed(1)}K</p>
                    </GlassCard>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <GlassCard className="p-6 bg-status-warning/10 border-status-warning/30">
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Total Expenses (30d)</h4>
                        <p className="text-3xl font-bold text-status-warning">${(totalExpenses / 1000).toFixed(1)}K</p>
                    </GlassCard>
                </motion.div>
            </div>
        </div>
    );
}
