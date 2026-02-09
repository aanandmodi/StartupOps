import { Task, Alert, Category } from "@/store/usePlanStore";
import { MarketingMetrics, FinanceMetrics } from "@/store/useMetricsStore";

// Mock Tasks - Comprehensive execution plan for a SaaS startup
export const mockTasks: Task[] = [
    // Product Tasks
    {
        id: "task-1",
        title: "Define MVP Features",
        description: "Identify core features for the minimum viable product based on user research and market analysis.",
        priority: "high",
        status: "completed",
        category: "product",
        estimatedDays: 5,
        dependencies: [],
    },
    {
        id: "task-2",
        title: "Design System & UI Kit",
        description: "Create comprehensive design system with components, colors, typography, and spacing guidelines.",
        priority: "high",
        status: "completed",
        category: "product",
        estimatedDays: 7,
        dependencies: ["task-1"],
    },
    {
        id: "task-3",
        title: "Backend API Development",
        description: "Build RESTful API endpoints for core functionality including auth, data CRUD, and integrations.",
        priority: "high",
        status: "in-progress",
        category: "product",
        estimatedDays: 14,
        dependencies: ["task-1"],
    },
    {
        id: "task-4",
        title: "Frontend Implementation",
        description: "Develop responsive web application using React with the design system components.",
        priority: "high",
        status: "in-progress",
        category: "product",
        estimatedDays: 12,
        dependencies: ["task-2", "task-3"],
    },
    {
        id: "task-5",
        title: "User Testing & Feedback",
        description: "Conduct usability testing with beta users and gather feedback for improvements.",
        priority: "medium",
        status: "pending",
        category: "product",
        estimatedDays: 5,
        dependencies: ["task-4"],
    },

    // Marketing Tasks
    {
        id: "task-6",
        title: "Brand Identity Development",
        description: "Create brand guidelines including logo variations, voice, and messaging framework.",
        priority: "high",
        status: "completed",
        category: "marketing",
        estimatedDays: 7,
        dependencies: [],
    },
    {
        id: "task-7",
        title: "Launch Website",
        description: "Design and deploy marketing website with landing pages, pricing, and blog.",
        priority: "high",
        status: "in-progress",
        category: "marketing",
        estimatedDays: 10,
        dependencies: ["task-6"],
    },
    {
        id: "task-8",
        title: "Content Marketing Strategy",
        description: "Develop content calendar, blog posts, and SEO strategy for organic growth.",
        priority: "medium",
        status: "pending",
        category: "marketing",
        estimatedDays: 14,
        dependencies: ["task-7"],
    },
    {
        id: "task-9",
        title: "Social Media Setup",
        description: "Create and optimize social media profiles across LinkedIn, Twitter, and Product Hunt.",
        priority: "medium",
        status: "in-progress",
        category: "marketing",
        estimatedDays: 3,
        dependencies: ["task-6"],
    },
    {
        id: "task-10",
        title: "Launch Campaign",
        description: "Plan and execute product launch across all channels with PR outreach.",
        priority: "high",
        status: "pending",
        category: "marketing",
        estimatedDays: 7,
        dependencies: ["task-7", "task-8", "task-9"],
    },

    // Finance Tasks
    {
        id: "task-11",
        title: "Financial Model Creation",
        description: "Build detailed 3-year financial projections with multiple scenarios.",
        priority: "high",
        status: "completed",
        category: "finance",
        estimatedDays: 5,
        dependencies: [],
    },
    {
        id: "task-12",
        title: "Pricing Strategy",
        description: "Define pricing tiers, packaging, and competitive positioning analysis.",
        priority: "high",
        status: "completed",
        category: "finance",
        estimatedDays: 4,
        dependencies: ["task-11"],
    },
    {
        id: "task-13",
        title: "Payment Infrastructure",
        description: "Integrate Stripe for subscriptions, invoicing, and payment processing.",
        priority: "high",
        status: "in-progress",
        category: "finance",
        estimatedDays: 5,
        dependencies: ["task-3"],
    },
    {
        id: "task-14",
        title: "Investor Pitch Deck",
        description: "Create compelling pitch deck for seed round fundraising.",
        priority: "medium",
        status: "pending",
        category: "finance",
        estimatedDays: 7,
        dependencies: ["task-11"],
    },

    // Operations Tasks
    {
        id: "task-15",
        title: "Cloud Infrastructure Setup",
        description: "Configure AWS/GCP with auto-scaling, monitoring, and disaster recovery.",
        priority: "high",
        status: "completed",
        category: "operations",
        estimatedDays: 5,
        dependencies: [],
    },
    {
        id: "task-16",
        title: "CI/CD Pipeline",
        description: "Set up automated testing, deployment, and code quality checks.",
        priority: "high",
        status: "completed",
        category: "operations",
        estimatedDays: 3,
        dependencies: ["task-15"],
    },
    {
        id: "task-17",
        title: "Customer Support System",
        description: "Implement helpdesk, knowledge base, and live chat for customer support.",
        priority: "medium",
        status: "pending",
        category: "operations",
        estimatedDays: 4,
        dependencies: ["task-4"],
    },
    {
        id: "task-18",
        title: "Analytics & Monitoring",
        description: "Set up product analytics, error tracking, and performance monitoring.",
        priority: "medium",
        status: "in-progress",
        category: "operations",
        estimatedDays: 3,
        dependencies: ["task-16"],
    },

    // Hiring Tasks
    {
        id: "task-19",
        title: "Define Team Structure",
        description: "Create org chart and identify key roles needed for next 12 months.",
        priority: "medium",
        status: "completed",
        category: "hiring",
        estimatedDays: 2,
        dependencies: [],
    },
    {
        id: "task-20",
        title: "Hire Frontend Developer",
        description: "Recruit senior frontend developer with React and TypeScript experience.",
        priority: "high",
        status: "in-progress",
        category: "hiring",
        estimatedDays: 21,
        dependencies: ["task-19"],
    },
    {
        id: "task-21",
        title: "Hire Growth Marketer",
        description: "Find growth-focused marketer with B2B SaaS experience.",
        priority: "medium",
        status: "pending",
        category: "hiring",
        estimatedDays: 28,
        dependencies: ["task-19"],
    },

    // Legal Tasks
    {
        id: "task-22",
        title: "Terms of Service & Privacy Policy",
        description: "Draft and review legal documents with attorney.",
        priority: "high",
        status: "completed",
        category: "legal",
        estimatedDays: 5,
        dependencies: [],
    },
    {
        id: "task-23",
        title: "Trademark Registration",
        description: "File trademark application for brand name and logo.",
        priority: "low",
        status: "in-progress",
        category: "legal",
        estimatedDays: 7,
        dependencies: ["task-6"],
    },
    {
        id: "task-24",
        title: "GDPR Compliance",
        description: "Implement data protection measures and documentation for GDPR.",
        priority: "medium",
        status: "pending",
        category: "legal",
        estimatedDays: 7,
        dependencies: ["task-22", "task-3"],
    },
];

// Mock Alerts
export const mockAlerts: Alert[] = [
    {
        id: "alert-1",
        type: "urgent",
        title: "Backend API Delayed",
        message: "Task 'Backend API Development' is 2 days behind schedule. Consider reallocating resources.",
        taskId: "task-3",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
        id: "alert-2",
        type: "warning",
        title: "Dependency Risk",
        message: "Frontend implementation depends on delayed backend. May impact launch timeline.",
        taskId: "task-4",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
        id: "alert-3",
        type: "info",
        title: "Milestone Achieved",
        message: "Design system completed ahead of schedule. Team velocity is improving.",
        taskId: "task-2",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
];

// Generate date range for metrics
const generateDates = (days: number): string[] => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
};

const dates = generateDates(30);

// Mock Marketing Metrics
export const mockMarketingMetrics: MarketingMetrics = {
    websiteVisitors: dates.map((date, i) => ({
        date,
        value: Math.floor(500 + i * 50 + Math.random() * 200),
    })),
    signups: dates.map((date, i) => ({
        date,
        value: Math.floor(10 + i * 2 + Math.random() * 10),
    })),
    conversionRate: dates.map((date, i) => ({
        date,
        value: Math.round((2 + Math.random()) * 100) / 100,
    })),
    socialFollowers: dates.map((date, i) => ({
        date,
        value: Math.floor(1200 + i * 30 + Math.random() * 50),
    })),
};

// Mock Finance Metrics
export const mockFinanceMetrics: FinanceMetrics = {
    revenue: dates.map((date, i) => ({
        date,
        value: Math.floor(2000 + i * 150 + Math.random() * 500),
    })),
    expenses: dates.map((date, i) => ({
        date,
        value: Math.floor(8000 + Math.random() * 1000),
    })),
    runway: 18,
    mrr: 12500,
    arr: 150000,
    burnRate: 8500,
};

// Category labels
export const categoryLabels: Record<Category, string> = {
    product: "Product Development",
    tech: "Technology & Engineering",
    marketing: "Marketing & Growth",
    finance: "Finance & Fundraising",
    operations: "Operations & DevOps",
    hiring: "Team & Hiring",
    legal: "Legal & Compliance",
};

// Category colors
export const categoryColors: Record<Category, string> = {
    product: "bg-blue-500",
    tech: "bg-emerald-500",
    marketing: "bg-purple-500",
    finance: "bg-green-500",
    operations: "bg-orange-500",
    hiring: "bg-pink-500",
    legal: "bg-slate-500",
};

// Domain options for goal input
export const domainOptions = [
    { value: "saas", label: "SaaS / Software" },
    { value: "ecommerce", label: "E-commerce / Retail" },
    { value: "fintech", label: "Fintech / Financial Services" },
    { value: "healthtech", label: "Healthtech / Medical" },
    { value: "edtech", label: "Edtech / Education" },
    { value: "marketplace", label: "Marketplace / Platform" },
    { value: "ai-ml", label: "AI / Machine Learning" },
    { value: "devtools", label: "Developer Tools" },
    { value: "consumer", label: "Consumer App" },
    { value: "other", label: "Other" },
];
