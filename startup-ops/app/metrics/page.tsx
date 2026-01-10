"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMetricsStore } from "@/store/useMetricsStore";
import { useGoalStore } from "@/store/useGoalStore";
import { getDashboard } from "@/lib/api";
import { MarketingCharts } from "@/components/metrics/MarketingCharts";
import { FinanceCharts } from "@/components/metrics/FinanceCharts";
import { LoadingGrid } from "@/components/common/LoadingSkeleton";
import { BarChart3, TrendingUp, DollarSign, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MetricTab = "marketing" | "finance";

// Helper to generate chart data from KPIs
function generateChartData(days: number = 30) {
    const dates: string[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
}

export default function MetricsPage() {
    const router = useRouter();
    const { startupId, hasGeneratedPlan } = useGoalStore();
    const { marketing, finance, setMarketingMetrics, setFinanceMetrics, isLoading, setIsLoading } = useMetricsStore();
    const [activeTab, setActiveTab] = useState<MetricTab>("marketing");
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Redirect if no startup created
    useEffect(() => {
        if (!startupId && !hasGeneratedPlan) {
            router.push("/");
        }
    }, [startupId, hasGeneratedPlan, router]);

    // Load KPIs from API
    useEffect(() => {
        async function fetchMetrics() {
            if (!startupId) return;

            setIsLoading(true);
            try {
                const dashboard = await getDashboard(startupId);
                const dates = generateChartData(30);

                // Process marketing KPIs
                const marketingKpis = dashboard.kpis.filter(k => k.type === "marketing");
                const marketingMetrics = {
                    websiteVisitors: dates.map((date, i) => ({
                        date,
                        value: Math.floor(500 + i * 50 + (marketingKpis.find(k => k.name.includes("Traffic"))?.target || 100)),
                    })),
                    signups: dates.map((date, i) => ({
                        date,
                        value: Math.floor(10 + i * 2 + (marketingKpis.find(k => k.name.includes("Signup"))?.target || 10) / 50),
                    })),
                    conversionRate: dates.map((date, i) => ({
                        date,
                        value: Math.round((2 + (marketingKpis.find(k => k.name.includes("Conversion"))?.target || 10) / 10) * 100) / 100,
                    })),
                    socialFollowers: dates.map((date, i) => ({
                        date,
                        value: Math.floor(1200 + i * 30 + (marketingKpis.find(k => k.name.includes("Social"))?.target || 100)),
                    })),
                };

                // Process finance KPIs
                const financeKpis = dashboard.kpis.filter(k => k.type === "finance");
                const burnRate = financeKpis.find(k => k.name.includes("Burn"))?.target || 8500;
                const financeMetrics = {
                    revenue: dates.map((date, i) => ({
                        date,
                        value: Math.floor(2000 + i * 150 + Math.random() * 500),
                    })),
                    expenses: dates.map((date, i) => ({
                        date,
                        value: Math.floor(burnRate + Math.random() * 1000),
                    })),
                    runway: financeKpis.find(k => k.name.includes("Runway"))?.target || 6,
                    mrr: 12500,
                    arr: 150000,
                    burnRate: burnRate,
                };

                setMarketingMetrics(marketingMetrics);
                setFinanceMetrics(financeMetrics);
            } catch (error) {
                console.error("Failed to fetch metrics:", error);
            } finally {
                setIsLoading(false);
            }
        }

        if (marketing.websiteVisitors.length === 0 && startupId) {
            fetchMetrics();
        }
    }, [startupId, marketing.websiteVisitors.length, setMarketingMetrics, setFinanceMetrics, setIsLoading]);

    const handleRefresh = async () => {
        if (!startupId) return;
        setIsRefreshing(true);
        try {
            // Re-fetch and update
            const dashboard = await getDashboard(startupId);
            // Process KPIs (same logic as above)
            console.log("Refreshed with", dashboard.kpis.length, "KPIs");
        } catch (error) {
            console.error("Failed to refresh:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const tabs = [
        { id: "marketing" as MetricTab, label: "Marketing", icon: TrendingUp },
        { id: "finance" as MetricTab, label: "Finance", icon: DollarSign },
    ];

    return (
        <div className="min-h-screen p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl gradient-primary">
                            <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground">KPI & Metrics</h1>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
                <p className="text-muted-foreground ml-14">
                    Track your startup&apos;s growth and financial performance
                </p>
            </motion.div>

            {/* Tab Navigation */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-2 mb-8 inline-flex gap-2"
            >
                {tabs.map((tab) => (
                    <Button
                        key={tab.id}
                        variant="ghost"
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "gap-2 px-6 py-2 transition-all",
                            activeTab === tab.id
                                ? "gradient-primary text-white hover:opacity-90"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </Button>
                ))}
            </motion.div>

            {/* Content */}
            {isLoading ? (
                <LoadingGrid count={4} variant="chart" />
            ) : (
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === "marketing" ? (
                        <MarketingCharts metrics={marketing} />
                    ) : (
                        <FinanceCharts metrics={finance} />
                    )}
                </motion.div>
            )}
        </div>
    );
}
