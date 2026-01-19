/**
 * StartupOps API Client - Real Implementation
 */

import { Task, Alert, Category, Priority, TaskStatus } from "@/store/usePlanStore";
import { Goal } from "@/store/useGoalStore";
import { MarketingMetrics, FinanceMetrics, MetricPoint } from "@/store/useMetricsStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// --- Backend Types ---

export interface StartupCreate {
    goal: string;
    domain: string;
    team_size: number;
}

export interface BackendTask {
    id: number | string;
    startup_id: number | string;
    title: string;
    description: string | null;
    category: string;
    priority: number;
    estimated_days: number;
    status: string;
    dependencies: (number | string)[];
}

export interface BackendAlert {
    id: number | string;
    startup_id: number | string;
    severity: string;
    message: string;
    recommended_action: string | null;
    is_active: boolean;
    created_at: string;
}

export interface BackendKPI {
    id: number | string;
    startup_id: number | string;
    type: string;
    name: string;
    value: number;
    target: number | null;
    unit: string | null;
    timestamp: string;
}

export interface BackendExecutionHealth {
    score: number;
    status: string;
    completed_tasks: number;
    total_tasks: number;
    blocked_tasks: number;
    overdue_tasks: number;
}

export interface CreateStartupResponse {
    startup_id: number | string;
    status: string;
    message: string;
    agent_summary: Record<string, string>;
}

export interface DashboardResponse {
    startup: any;
    tasks: BackendTask[];
    kpis: BackendKPI[];
    alerts: BackendAlert[];
    execution_health: BackendExecutionHealth;
}

// --- API Functions ---

export async function createStartup(data: StartupCreate): Promise<CreateStartupResponse> {
    const response = await fetch(`${API_URL}/startup/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Failed to create startup");
    }

    return response.json();
}

export async function getDashboard(startupId: number | string): Promise<DashboardResponse> {
    const response = await fetch(`${API_URL}/startup/${startupId}/dashboard`);
    if (!response.ok) {
        throw new Error("Failed to fetch dashboard");
    }
    return response.json();
}

// --- Main Integration Function ---

export async function generateExecutionPlan(goal: Goal): Promise<{
    tasks: Task[];
    alerts: Alert[];
    startupId: number | string;
    executionHealth: BackendExecutionHealth;
    metrics: {
        marketing: MarketingMetrics;
        finance: FinanceMetrics;
    };
}> {
    // 1. Create Startup & Trigger Agents
    console.log("Triggering agents for goal:", goal);
    const createRes = await createStartup({
        goal: goal.startupGoal,
        domain: goal.domain,
        team_size: goal.teamSize,
    });

    if (createRes.status !== "success") {
        throw new Error(createRes.message || "Agent orchestration failed");
    }

    // 2. Fetch Resulting Dashboard
    console.log("Fetching dashboard for startup ID:", createRes.startup_id);
    const dashboard = await getDashboard(createRes.startup_id);

    // 3. Transform Data
    const tasks = dashboard.tasks.map(convertBackendTask);
    const alerts = dashboard.alerts.map(convertBackendAlert);
    const metrics = convertBackendMetrics(dashboard.kpis);

    return {
        tasks,
        alerts,
        startupId: createRes.startup_id,
        executionHealth: dashboard.execution_health,
        metrics,
    };
}

// --- Helpers & Converters ---

export function convertBackendTask(startTask: BackendTask): Task {
    return {
        id: startTask.id.toString(),
        title: startTask.title,
        description: startTask.description || "",
        priority: mapPriority(startTask.priority),
        status: mapStatus(startTask.status),
        category: (startTask.category.toLowerCase() as Category) || "operations",
        estimatedDays: startTask.estimated_days,
        dependencies: startTask.dependencies.map(d => d.toString()),
    };
}

export function convertBackendAlert(alert: BackendAlert): Alert {
    return {
        id: alert.id.toString(),
        type: mapSeverity(alert.severity),
        title: "Strategic Alert",
        message: alert.message,
        timestamp: new Date(alert.created_at),
    };
}

function mapPriority(p: number): Priority {
    if (p >= 5) return "high";
    if (p >= 3) return "medium";
    return "low";
}

function mapStatus(s: string): TaskStatus {
    const map: Record<string, TaskStatus> = {
        "pending": "pending",
        "in_progress": "in-progress",
        "completed": "completed",
        "blocked": "blocked"
    };
    return map[s.toLowerCase()] || "pending";
}

function mapSeverity(s: string): "urgent" | "warning" | "info" {
    const map: Record<string, any> = {
        "critical": "urgent",
        "high": "urgent",
        "warning": "warning",
        "medium": "warning",
        "low": "info",
        "info": "info"
    };
    return map[s.toLowerCase()] || "info";
}

// --- Synthetic Metrics Generation ---

function convertBackendMetrics(kpis: BackendKPI[]): { marketing: MarketingMetrics; finance: FinanceMetrics } {
    // Initialize empty structures
    const marketing: MarketingMetrics = {
        websiteVisitors: [],
        signups: [],
        conversionRate: [],
        socialFollowers: []
    };

    const finance: FinanceMetrics = {
        revenue: [],
        expenses: [],
        runway: 0,
        mrr: 0,
        arr: 0,
        burnRate: 0
    };

    // Helper to generate a ramp-up curve ending at the target value
    const generateCurve = (target: number, points = 12): MetricPoint[] => {
        const data: MetricPoint[] = [];
        const now = new Date();
        for (let i = points - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - (i * 7)); // Weekly points
            // Simple ease-out curve: y = target * (1 - (1-x)^3) where x is progress 0..1
            const progress = (points - 1 - i) / (points - 1); // 0 to 1
            // Random noise +/- 5%
            const noise = 1 + (Math.random() * 0.1 - 0.05);
            // Value ramps up to target
            let val = target * progress * noise;
            if (i === 0) val = target * 0.1; // Start low
            data.push({
                date: date.toISOString().split('T')[0],
                value: Math.round(val)
            });
        }
        return data;
    };

    kpis.forEach(kpi => {
        const name = kpi.name.toLowerCase();
        // If target is null, use value as target
        const target = kpi.target || kpi.value || 0;

        if (kpi.type === "marketing") {
            if (name.includes("visitor") || name.includes("traffic")) {
                marketing.websiteVisitors = generateCurve(target);
            } else if (name.includes("signup") || name.includes("user")) {
                marketing.signups = generateCurve(target);
            } else if (name.includes("conversion")) {
                marketing.conversionRate = generateCurve(target < 100 ? target : 5); // ensure plausible %
            } else if (name.includes("social") || name.includes("follower")) {
                marketing.socialFollowers = generateCurve(target);
            }
        } else if (kpi.type === "finance") {
            if (name.includes("revenue") || name.includes("mrr")) {
                finance.revenue = generateCurve(target);
                finance.mrr = target;
            } else if (name.includes("burn") || name.includes("expense")) {
                finance.expenses = generateCurve(target); // expenses usually flat or grow
                finance.burnRate = target;
            } else if (name.includes("runway")) {
                finance.runway = kpi.value; // Single value
            }
        }
    });

    // Fallback if no relevant KPIs found
    if (finance.expenses.length === 0) finance.expenses = generateCurve(5000);
    if (marketing.websiteVisitors.length === 0) marketing.websiteVisitors = generateCurve(1000);

    return { marketing, finance };
}
