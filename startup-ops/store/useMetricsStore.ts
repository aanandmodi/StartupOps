import { create } from "zustand";

export interface MetricPoint {
    date: string;
    value: number;
}

export interface MarketingMetrics {
    websiteVisitors: MetricPoint[];
    signups: MetricPoint[];
    conversionRate: MetricPoint[];
    socialFollowers: MetricPoint[];
}

export interface FinanceMetrics {
    revenue: MetricPoint[];
    expenses: MetricPoint[];
    runway: number;
    mrr: number;
    arr: number;
    burnRate: number;
}

interface MetricsState {
    marketing: MarketingMetrics;
    finance: FinanceMetrics;
    isLoading: boolean;
    setMarketingMetrics: (metrics: MarketingMetrics) => void;
    setFinanceMetrics: (metrics: FinanceMetrics) => void;
    setIsLoading: (loading: boolean) => void;
}

const defaultMarketingMetrics: MarketingMetrics = {
    websiteVisitors: [],
    signups: [],
    conversionRate: [],
    socialFollowers: [],
};

const defaultFinanceMetrics: FinanceMetrics = {
    revenue: [],
    expenses: [],
    runway: 0,
    mrr: 0,
    arr: 0,
    burnRate: 0,
};

export const useMetricsStore = create<MetricsState>((set) => ({
    marketing: defaultMarketingMetrics,
    finance: defaultFinanceMetrics,
    isLoading: false,
    setMarketingMetrics: (metrics) => set({ marketing: metrics }),
    setFinanceMetrics: (metrics) => set({ finance: metrics }),
    setIsLoading: (loading) => set({ isLoading: loading }),
}));
