"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Github,
    FileSpreadsheet,
    BookOpen,
    CheckCircle2,
    XCircle,
    Loader2,
    ExternalLink,
} from "lucide-react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";

interface IntegrationStatus {
    connected: boolean;
    connected_at: string | null;
    account_info: {
        username?: string;
        email?: string;
        name?: string;
        workspace_name?: string;
    } | null;
    scopes: string[] | null;
}

interface IntegrationsResponse {
    github: IntegrationStatus;
    google: IntegrationStatus;
    notion: IntegrationStatus;
    slack: IntegrationStatus;
}

const INTEGRATION_CONFIG = {
    github: {
        name: "GitHub",
        description: "Create issues, sync tasks, and manage repositories",
        icon: Github,
        color: "from-gray-700 to-gray-900",
        iconBg: "bg-gray-800",
    },
    google: {
        name: "Google Workspace",
        description: "Create Docs, Sheets, and manage Drive files",
        icon: FileSpreadsheet,
        color: "from-blue-500 to-blue-700",
        iconBg: "bg-blue-600",
    },
    notion: {
        name: "Notion",
        description: "Create pages, manage databases, and sync notes",
        icon: BookOpen,
        color: "from-gray-600 to-gray-800",
        iconBg: "bg-gray-700",
    },
};

export default function IntegrationsPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const { user, isLoading: authLoading } = useAuth();

    const startupId = params.id || "";

    const [integrations, setIntegrations] = useState<IntegrationsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Check for callback messages
    useEffect(() => {
        const connected = searchParams.get("connected");
        const error = searchParams.get("error");

        if (connected) {
            setSuccessMessage(`Successfully connected ${connected}!`);
            // Clear the URL params
            window.history.replaceState({}, "", window.location.pathname);
        }
        if (error) {
            setError(`Connection failed: ${error}`);
            window.history.replaceState({}, "", window.location.pathname);
        }
    }, [searchParams]);

    // Fetch integration status
    useEffect(() => {
        const fetchIntegrations = async () => {
            if (!user || !startupId) return;

            try {
                const token = await user.getIdToken();
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/integrations/${startupId}/status`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    setIntegrations(data);
                } else {
                    setError("Failed to load integrations");
                }
            } catch (err) {
                console.error("Error fetching integrations:", err);
                setError("Failed to connect to server");
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchIntegrations();
        }
    }, [user, startupId, authLoading]);

    const handleConnect = async (provider: string) => {
        if (!user) return;

        setConnectingProvider(provider);
        setError(null);

        try {
            const token = await user.getIdToken();

            // GitHub uses App installation flow, others use OAuth
            if (provider === "github") {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/integrations/${startupId}/github/install-url`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    window.location.href = data.install_url;
                } else {
                    setError("Failed to get GitHub install URL");
                    setConnectingProvider(null);
                }
            } else {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/integrations/${startupId}/${provider}/authorize`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    window.location.href = data.authorization_url;
                } else {
                    setError(`Failed to initiate ${provider} connection`);
                    setConnectingProvider(null);
                }
            }
        } catch (err) {
            console.error("Error connecting:", err);
            setError("Connection failed");
            setConnectingProvider(null);
        }
    };

    const handleDisconnect = async (provider: string) => {
        if (!user) return;

        if (!confirm(`Are you sure you want to disconnect ${provider}?`)) {
            return;
        }

        try {
            const token = await user.getIdToken();
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/integrations/${startupId}/${provider}/disconnect`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                setSuccessMessage(`Disconnected ${provider}`);
                // Refresh integrations
                setIntegrations((prev) => prev ? {
                    ...prev,
                    [provider]: { connected: false, connected_at: null, account_info: null, scopes: null },
                } : null);
            } else {
                setError(`Failed to disconnect ${provider}`);
            }
        } catch (err) {
            console.error("Error disconnecting:", err);
            setError("Disconnect failed");
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href={`/dashboard/${startupId}/settings`}
                        className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Settings
                    </Link>

                    <h1 className="text-3xl font-bold text-foreground">Integrations</h1>
                    <p className="text-muted-foreground mt-2">
                        Connect external services to automate your workflow
                    </p>
                </div>

                {/* Messages */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3"
                    >
                        <XCircle className="w-5 h-5 text-destructive" />
                        <p className="text-destructive">{error}</p>
                    </motion.div>
                )}

                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3"
                    >
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <p className="text-green-500">{successMessage}</p>
                    </motion.div>
                )}

                {/* Integration Cards */}
                <div className="grid gap-4">
                    {Object.entries(INTEGRATION_CONFIG).map(([key, config]) => {
                        const status = integrations?.[key as keyof IntegrationsResponse];
                        const isConnecting = connectingProvider === key;
                        const Icon = config.icon;

                        return (
                            <motion.div
                                key={key}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-lg ${config.iconBg}`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-foreground">{config.name}</h3>
                                            <p className="text-muted-foreground text-sm mt-1">{config.description}</p>

                                            {status?.connected && status.account_info && (
                                                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    <span>
                                                        Connected as{" "}
                                                        <span className="text-foreground font-medium">
                                                            {status.account_info.username ||
                                                                status.account_info.email ||
                                                                status.account_info.workspace_name ||
                                                                "Unknown"}
                                                        </span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {status?.connected ? (
                                            <button
                                                onClick={() => handleDisconnect(key)}
                                                className="px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                            >
                                                Disconnect
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleConnect(key)}
                                                disabled={isConnecting}
                                                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {isConnecting ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Connecting...
                                                    </>
                                                ) : (
                                                    <>
                                                        Connect
                                                        <ExternalLink className="w-4 h-4" />
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Info Section */}
                <div className="mt-8 p-6 bg-muted/30 rounded-xl border border-border">
                    <h4 className="font-semibold text-foreground mb-2">How it works</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>• Click "Connect" to authorize StartupOps to access your account</li>
                        <li>• You'll be redirected to the service to grant permissions</li>
                        <li>• Once connected, the Automation Agent can perform actions on your behalf</li>
                        <li>• You can disconnect at any time to revoke access</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
