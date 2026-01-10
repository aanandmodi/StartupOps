/**
 * StartupOps API Client
 * Connects the frontend to the FastAPI backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Types matching backend schemas
export interface StartupCreate {
    goal: string;
    domain: string;
    team_size: number;
}

export interface StartupResponse {
    id: number;
    goal: string;
    domain: string;
    team_size: number;
    created_at: string;
}

export interface TaskResponse {
    id: number;
    startup_id: number;
    title: string;
    description: string | null;
    category: "product" | "tech" | "marketing" | "finance";
    priority: number;
    estimated_days: number;
    status: "pending" | "in_progress" | "completed";
    dependencies: number[];
}

export interface KPIResponse {
    id: number;
    startup_id: number;
    type: "marketing" | "finance" | "execution";
    name: string;
    value: number;
    target: number | null;
    unit: string | null;
    timestamp: string;
}

export interface AlertResponse {
    id: number;
    startup_id: number;
    severity: "info" | "warning" | "critical";
    message: string;
    recommended_action: string | null;
    is_active: boolean;
    created_at: string;
}

export interface ExecutionHealth {
    score: number;
    status: "healthy" | "at_risk" | "critical";
    completed_tasks: number;
    total_tasks: number;
    blocked_tasks: number;
    overdue_tasks: number;
}

export interface DashboardResponse {
    startup: StartupResponse;
    tasks: TaskResponse[];
    kpis: KPIResponse[];
    alerts: AlertResponse[];
    execution_health: ExecutionHealth;
}

export interface CreateStartupResponse {
    startup_id: number;
    status: "success" | "partial";
    message: string;
    agent_summary?: {
        product: string;
        tech: string;
        marketing: string;
        finance: string;
        advisor: string;
    };
}

// API Functions

/**
 * Create a new startup and trigger AI agent orchestration
 */
export async function createStartup(data: StartupCreate): Promise<CreateStartupResponse> {
    const response = await fetch(`${API_BASE_URL}/startup/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`Failed to create startup: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Get full dashboard data for a startup
 */
export async function getDashboard(startupId: number): Promise<DashboardResponse> {
    const response = await fetch(`${API_BASE_URL}/startup/${startupId}/dashboard`);

    if (!response.ok) {
        throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Update a task's status
 */
export async function updateTaskStatus(
    taskId: number,
    status: "pending" | "in_progress" | "completed"
): Promise<{
    task: TaskResponse;
    status_changed: boolean;
    execution_health?: ExecutionHealth;
    new_recommendations?: unknown[];
}> {
    const response = await fetch(`${API_BASE_URL}/task/${taskId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });

    if (!response.ok) {
        throw new Error(`Failed to update task: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Get alerts for a startup
 */
export async function getAlerts(startupId: number): Promise<AlertResponse[]> {
    const response = await fetch(`${API_BASE_URL}/alerts/${startupId}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch alerts: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Dismiss an alert
 */
export async function dismissAlert(alertId: number): Promise<{ message: string; alert_id: number }> {
    const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/dismiss`, {
        method: "POST",
    });

    if (!response.ok) {
        throw new Error(`Failed to dismiss alert: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Get API health status
 */
export async function getApiHealth(): Promise<{ status: string; mock_mode: boolean }> {
    const response = await fetch(`${API_BASE_URL}/health`);

    if (!response.ok) {
        throw new Error(`API health check failed: ${response.statusText}`);
    }

    return response.json();
}

// Helper function to convert backend task to frontend task format
import { Task, Alert, Category, TaskStatus as FrontendTaskStatus, Priority } from "@/store/usePlanStore";

export function convertBackendTask(task: TaskResponse): Task {
    // Map backend category to frontend category
    const categoryMap: Record<string, Category> = {
        product: "product",
        tech: "operations", // tech maps to operations in frontend
        marketing: "marketing",
        finance: "finance",
    };

    // Map backend status to frontend status
    const statusMap: Record<string, FrontendTaskStatus> = {
        pending: "pending",
        in_progress: "in-progress",
        completed: "completed",
    };

    // Map priority number to priority string
    const priorityMap: Record<number, Priority> = {
        1: "low",
        2: "low",
        3: "medium",
        4: "high",
        5: "high",
    };

    return {
        id: `task-${task.id}`,
        title: task.title,
        description: task.description || "",
        priority: priorityMap[task.priority] || "medium",
        status: statusMap[task.status] || "pending",
        category: categoryMap[task.category] || "product",
        estimatedDays: task.estimated_days,
        dependencies: task.dependencies.map((d) => `task-${d}`),
    };
}

export function convertBackendAlert(alert: AlertResponse): Alert {
    const typeMap: Record<string, "urgent" | "warning" | "info"> = {
        critical: "urgent",
        warning: "warning",
        info: "info",
    };

    return {
        id: `alert-${alert.id}`,
        type: typeMap[alert.severity] || "info",
        title: alert.message.substring(0, 50),
        message: alert.recommended_action || alert.message,
        timestamp: new Date(alert.created_at),
    };
}

// Main function used by GoalInputForm
import { Goal } from "@/store/useGoalStore";

export async function generateExecutionPlan(goal: Goal): Promise<{
    tasks: Task[];
    alerts: Alert[];
    startupId: number;
    executionHealth: ExecutionHealth;
}> {
    // Create startup via backend API
    const createResponse = await createStartup({
        goal: goal.startupGoal,
        domain: goal.domain,
        team_size: goal.teamSize,
    });

    // Fetch the dashboard to get all generated data
    const dashboard = await getDashboard(createResponse.startup_id);

    // Convert backend data to frontend format
    const tasks = dashboard.tasks.map(convertBackendTask);
    const alerts = dashboard.alerts.map(convertBackendAlert);

    return {
        tasks,
        alerts,
        startupId: createResponse.startup_id,
        executionHealth: dashboard.execution_health,
    };
}
