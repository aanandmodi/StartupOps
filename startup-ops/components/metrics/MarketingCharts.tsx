"use client";

import { motion } from "framer-motion";
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { GlassCard } from "@/components/common/GlassCard";
import { MarketingMetrics } from "@/store/useMetricsStore";
import { TrendingUp, Users, MousePointer, Share2 } from "lucide-react";

interface MarketingChartsProps {
    metrics: MarketingMetrics;
}

export function MarketingCharts({ metrics }: MarketingChartsProps) {
    // Combine data for charts
    const visitorData = metrics.websiteVisitors.map((v, i) => ({
        date: v.date.slice(5), // MM-DD format
        visitors: v.value,
        signups: metrics.signups[i]?.value || 0,
    }));

    const conversionData = metrics.conversionRate.map((c) => ({
        date: c.date.slice(5),
        rate: c.value,
    }));

    const socialData = metrics.socialFollowers.map((s) => ({
        date: s.date.slice(5),
        followers: s.value,
    }));

    // Calculate totals
    const totalVisitors = metrics.websiteVisitors.reduce((sum, v) => sum + v.value, 0);
    const totalSignups = metrics.signups.reduce((sum, s) => sum + s.value, 0);
    const avgConversion = (metrics.conversionRate.reduce((sum, c) => sum + c.value, 0) / metrics.conversionRate.length).toFixed(2);
    const latestFollowers = metrics.socialFollowers[metrics.socialFollowers.length - 1]?.value || 0;

    const stats = [
        { label: "Total Visitors", value: totalVisitors.toLocaleString(), icon: MousePointer, color: "text-chart-1" },
        { label: "Total Signups", value: totalSignups.toLocaleString(), icon: Users, color: "text-chart-2" },
        { label: "Avg Conversion", value: `${avgConversion}%`, icon: TrendingUp, color: "text-chart-3" },
        { label: "Followers", value: latestFollowers.toLocaleString(), icon: Share2, color: "text-chart-4" },
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

            {/* Visitors & Signups Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <GlassCard className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">Website Traffic & Signups</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={visitorData}>
                                <defs>
                                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="oklch(0.65 0.25 260)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="oklch(0.65 0.25 260)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="oklch(0.70 0.20 180)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="oklch(0.70 0.20 180)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0.02 260 / 20%)" />
                                <XAxis dataKey="date" stroke="oklch(0.5 0.02 260)" fontSize={12} />
                                <YAxis stroke="oklch(0.5 0.02 260)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "oklch(0.15 0.02 260 / 90%)",
                                        border: "1px solid oklch(0.3 0.02 260)",
                                        borderRadius: "8px",
                                        color: "oklch(0.95 0.01 260)",
                                    }}
                                />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="visitors"
                                    stroke="oklch(0.65 0.25 260)"
                                    fillOpacity={1}
                                    fill="url(#colorVisitors)"
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="signups"
                                    stroke="oklch(0.70 0.20 180)"
                                    fillOpacity={1}
                                    fill="url(#colorSignups)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            </motion.div>

            {/* Conversion Rate & Followers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <GlassCard className="p-6">
                        <h3 className="font-semibold text-foreground mb-4">Conversion Rate</h3>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={conversionData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0.02 260 / 20%)" />
                                    <XAxis dataKey="date" stroke="oklch(0.5 0.02 260)" fontSize={11} />
                                    <YAxis stroke="oklch(0.5 0.02 260)" fontSize={11} unit="%" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "oklch(0.15 0.02 260 / 90%)",
                                            border: "1px solid oklch(0.3 0.02 260)",
                                            borderRadius: "8px",
                                            color: "oklch(0.95 0.01 260)",
                                        }}
                                        formatter={(value: any) => [`${value}%`, "Rate"]}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="rate"
                                        stroke="oklch(0.75 0.18 140)"
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
                        <h3 className="font-semibold text-foreground mb-4">Social Followers</h3>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={socialData}>
                                    <defs>
                                        <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="oklch(0.80 0.20 80)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="oklch(0.80 0.20 80)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0.02 260 / 20%)" />
                                    <XAxis dataKey="date" stroke="oklch(0.5 0.02 260)" fontSize={11} />
                                    <YAxis stroke="oklch(0.5 0.02 260)" fontSize={11} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "oklch(0.15 0.02 260 / 90%)",
                                            border: "1px solid oklch(0.3 0.02 260)",
                                            borderRadius: "8px",
                                            color: "oklch(0.95 0.01 260)",
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="followers"
                                        stroke="oklch(0.80 0.20 80)"
                                        fillOpacity={1}
                                        fill="url(#colorFollowers)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>
        </div>
    );
}
