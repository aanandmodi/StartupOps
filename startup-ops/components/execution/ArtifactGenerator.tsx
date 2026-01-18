"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getAuthHeaders } from "@/components/auth/AuthProvider";
import {
    Sparkles,
    Code,
    FileText,
    Mail,
    DollarSign,
    Calendar,
    Check,
    Copy,
    Download,
    Loader2,
    ChevronDown,
    Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Action {
    name: string;
    label: string;
    description: string;
}

interface AgentActions {
    [agentName: string]: Action[];
}

interface GeneratedArtifact {
    id: number;
    agent_name: string;
    artifact_type: string;
    title: string;
    content: string;
    created_at: string;
}

const AGENT_ICONS: Record<string, React.ReactNode> = {
    product: <Sparkles className="w-4 h-4" />,
    tech: <Code className="w-4 h-4" />,
    marketing: <Mail className="w-4 h-4" />,
    finance: <DollarSign className="w-4 h-4" />,
    advisor: <Calendar className="w-4 h-4" />,
};

const AGENT_COLORS: Record<string, string> = {
    product: "from-blue-500 to-cyan-500",
    tech: "from-purple-500 to-pink-500",
    marketing: "from-orange-500 to-yellow-500",
    finance: "from-emerald-500 to-teal-500",
    advisor: "from-indigo-500 to-violet-500",
};

interface ArtifactGeneratorProps {
    startupId: number | null;
}

export function ArtifactGenerator({ startupId }: ArtifactGeneratorProps) {
    const [actions, setActions] = useState<AgentActions>({});
    const [selectedAgent, setSelectedAgent] = useState<string>("product");
    const [selectedAction, setSelectedAction] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [generatedArtifact, setGeneratedArtifact] = useState<GeneratedArtifact | null>(null);
    const [copied, setCopied] = useState(false);
    const [recentArtifacts, setRecentArtifacts] = useState<GeneratedArtifact[]>([]);

    // Load available actions
    useEffect(() => {
        loadActions();
    }, []);

    // Load recent artifacts when startup changes
    useEffect(() => {
        if (startupId) {
            loadRecentArtifacts();
        }
    }, [startupId]);

    const loadActions = async () => {
        try {
            const response = await fetch(`${API_URL}/execute/actions`);
            if (response.ok) {
                const data = await response.json();
                setActions(data.agents || {});
            }
        } catch (error) {
            console.error("Failed to load actions:", error);
        }
    };

    const loadRecentArtifacts = async () => {
        if (!startupId) return;
        try {
            const response = await fetch(
                `${API_URL}/execute/${startupId}/artifacts?limit=5`,
                { headers: getAuthHeaders() }
            );
            if (response.ok) {
                const artifacts = await response.json();
                setRecentArtifacts(artifacts);
            }
        } catch (error) {
            console.error("Failed to load artifacts:", error);
        }
    };

    const generateArtifact = async () => {
        if (!startupId || !selectedAction) return;

        setIsLoading(true);
        setGeneratedArtifact(null);

        try {
            const response = await fetch(`${API_URL}/execute/${startupId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify({
                    agent_name: selectedAgent,
                    action_type: selectedAction,
                    context: {},
                }),
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.content) {
                    setGeneratedArtifact({
                        id: result.artifact_id,
                        agent_name: selectedAgent,
                        artifact_type: result.artifact_type,
                        title: selectedAction.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
                        content: result.content,
                        created_at: new Date().toISOString(),
                    });
                    loadRecentArtifacts();
                }
            }
        } catch (error) {
            console.error("Failed to generate artifact:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (generatedArtifact) {
            navigator.clipboard.writeText(generatedArtifact.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const downloadArtifact = () => {
        if (!generatedArtifact) return;

        const blob = new Blob([generatedArtifact.content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${generatedArtifact.title.toLowerCase().replace(/\s+/g, "_")}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!startupId) {
        return (
            <div className="glass-card p-8 text-center">
                <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No Startup Selected</h3>
                <p className="text-muted-foreground">
                    Create a startup first to generate artifacts.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Generator Panel */}
            <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Generate Artifacts
                </h3>

                {/* Agent Selection */}
                <div className="mb-4">
                    <label className="text-sm text-muted-foreground mb-2 block">
                        Select Agent
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {Object.keys(actions).map((agent) => (
                            <button
                                key={agent}
                                onClick={() => {
                                    setSelectedAgent(agent);
                                    setSelectedAction("");
                                }}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                                    selectedAgent === agent
                                        ? `bg-gradient-to-r ${AGENT_COLORS[agent]} text-white`
                                        : "bg-white/5 hover:bg-white/10 text-muted-foreground"
                                )}
                            >
                                {AGENT_ICONS[agent]}
                                {agent.charAt(0).toUpperCase() + agent.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action Selection */}
                <div className="mb-4">
                    <label className="text-sm text-muted-foreground mb-2 block">
                        Select Action
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(actions[selectedAgent] || []).map((action) => (
                            <button
                                key={action.name}
                                onClick={() => setSelectedAction(action.name)}
                                className={cn(
                                    "text-left p-3 rounded-lg border transition-all",
                                    selectedAction === action.name
                                        ? "border-primary bg-primary/10"
                                        : "border-white/10 hover:border-white/20 bg-white/5"
                                )}
                            >
                                <div className="font-medium text-sm">{action.label}</div>
                                <div className="text-xs text-muted-foreground">{action.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Generate Button */}
                <Button
                    onClick={generateArtifact}
                    disabled={!selectedAction || isLoading}
                    className="w-full"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate {selectedAction ? actions[selectedAgent]?.find(a => a.name === selectedAction)?.label : "Artifact"}
                        </>
                    )}
                </Button>
            </div>

            {/* Generated Artifact Display */}
            <AnimatePresence>
                {generatedArtifact && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass-card p-6 rounded-2xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500" />
                                {generatedArtifact.title}
                            </h3>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={copyToClipboard}
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={downloadArtifact}
                                >
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="bg-black/50 rounded-lg p-4 overflow-auto max-h-96">
                            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                                {generatedArtifact.content}
                            </pre>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Recent Artifacts */}
            {recentArtifacts.length > 0 && (
                <div className="glass-card p-6 rounded-2xl">
                    <h3 className="text-lg font-semibold mb-4">Recent Artifacts</h3>
                    <div className="space-y-2">
                        {recentArtifacts.map((artifact) => (
                            <button
                                key={artifact.id}
                                onClick={() => setGeneratedArtifact(artifact)}
                                className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br",
                                        AGENT_COLORS[artifact.agent_name] || "from-gray-500 to-gray-600"
                                    )}>
                                        {AGENT_ICONS[artifact.agent_name]}
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">{artifact.title}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {artifact.agent_name} • {artifact.artifact_type}
                                        </div>
                                    </div>
                                </div>
                                <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
