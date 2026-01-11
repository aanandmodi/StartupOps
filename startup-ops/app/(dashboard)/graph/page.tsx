"use client";

import { useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    MarkerType,
    BackgroundVariant,
    NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion } from "framer-motion";
import { usePlanStore, Task } from "@/store/usePlanStore";
import { useGoalStore } from "@/store/useGoalStore";
import { getDashboard, convertBackendTask } from "@/lib/api";
import { TaskNode } from "@/components/graph/TaskNode";
import { GitBranch, ZoomIn, Maximize2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingGrid } from "@/components/common/LoadingSkeleton";

const nodeTypes: NodeTypes = {
    taskNode: TaskNode,
};

// Position nodes based on dependencies and categories
function generateGraphLayout(tasks: Task[]): { nodes: Node[]; edges: Edge[] } {
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const levels: Map<string, number> = new Map();

    // Category order for horizontal positioning
    const categoryOrder: Record<string, number> = {
        product: 0,
        tech: 1,
        marketing: 2,
        finance: 3,
        operations: 4,
        hiring: 5,
        legal: 6,
    };

    // Calculate level for each task based on dependencies
    function getLevel(taskId: string, visited: Set<string> = new Set()): number {
        if (visited.has(taskId)) return 0;
        visited.add(taskId);

        const task = taskMap.get(taskId);
        if (!task) return 0;

        if (levels.has(taskId)) return levels.get(taskId)!;

        if (task.dependencies.length === 0) {
            levels.set(taskId, 0);
            return 0;
        }

        const maxDepLevel = Math.max(
            ...task.dependencies.map((depId) => getLevel(depId, visited))
        );
        const level = maxDepLevel + 1;
        levels.set(taskId, level);
        return level;
    }

    tasks.forEach((task) => getLevel(task.id));

    // Group tasks by level and category
    const levelGroups: Map<number, Task[]> = new Map();
    tasks.forEach((task) => {
        const level = levels.get(task.id) || 0;
        if (!levelGroups.has(level)) {
            levelGroups.set(level, []);
        }
        levelGroups.get(level)!.push(task);
    });

    // Sort tasks within each level by category
    levelGroups.forEach((tasksInLevel, level) => {
        tasksInLevel.sort((a, b) =>
            (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99)
        );
    });

    // Create nodes with improved spacing
    const nodes: Node[] = [];
    const xSpacing = 320;  // Increased for wider nodes
    const ySpacing = 180;  // Increased for better vertical separation

    levelGroups.forEach((tasksInLevel, level) => {
        const totalWidth = (tasksInLevel.length - 1) * xSpacing;
        const startX = -totalWidth / 2;

        tasksInLevel.forEach((task, index) => {
            // Add slight offset based on category for visual grouping
            const categoryOffset = (categoryOrder[task.category] || 0) * 10;

            nodes.push({
                id: task.id,
                type: "taskNode",
                position: {
                    x: startX + index * xSpacing,
                    y: level * ySpacing + categoryOffset
                },
                data: { task },
            });
        });
    });

    // Category color mapping for edges
    const categoryEdgeColors: Record<string, string> = {
        product: "#8b5cf6",  // violet
        tech: "#3b82f6",     // blue
        marketing: "#ec4899", // pink
        finance: "#10b981",  // emerald
        operations: "#f97316", // orange
        hiring: "#6366f1",   // indigo
        legal: "#64748b",    // slate
    };

    // Create edges with enhanced styling
    const edges: Edge[] = [];
    tasks.forEach((task) => {
        task.dependencies.forEach((depId) => {
            const sourceTask = taskMap.get(depId);
            const edgeColor = categoryEdgeColors[task.category] || "#8b5cf6";

            edges.push({
                id: `${depId}-${task.id}`,
                source: depId,
                target: task.id,
                type: "smoothstep",
                animated: true, // Always animate for visual appeal
                style: {
                    stroke: task.status === "blocked"
                        ? "#ef4444"  // red for blocked
                        : edgeColor,
                    strokeWidth: 3,
                    strokeLinecap: "round",
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: task.status === "blocked"
                        ? "#ef4444"
                        : edgeColor,
                    width: 20,
                    height: 20,
                },
            });
        });
    });

    return { nodes, edges };
}

export default function GraphPage() {
    const router = useRouter();
    const { startupId, hasGeneratedPlan } = useGoalStore();
    const { tasks, setTasks, isLoading, setIsLoading } = usePlanStore();

    // Redirect if no startup created
    useEffect(() => {
        if (!startupId && !hasGeneratedPlan) {
            router.push("/");
        }
    }, [startupId, hasGeneratedPlan, router]);

    // Load tasks if not already loaded
    useEffect(() => {
        async function fetchTasks() {
            if (!startupId) return;

            setIsLoading(true);
            try {
                const dashboard = await getDashboard(startupId);
                setTasks(dashboard.tasks.map(convertBackendTask));
            } catch (error) {
                console.error("Failed to fetch tasks:", error);
            } finally {
                setIsLoading(false);
            }
        }

        if (tasks.length === 0 && startupId) {
            fetchTasks();
        }
    }, [startupId, tasks.length, setTasks, setIsLoading]);

    const { nodes: initialNodes, edges: initialEdges } = useMemo(
        () => generateGraphLayout(tasks),
        [tasks]
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Update nodes when tasks change
    useEffect(() => {
        const { nodes: newNodes, edges: newEdges } = generateGraphLayout(tasks);
        setNodes(newNodes);
        setEdges(newEdges);
    }, [tasks, setNodes, setEdges]);

    if (isLoading) {
        return (
            <div className="min-h-screen p-8">
                <LoadingGrid count={6} variant="card" />
            </div>
        );
    }

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
                            <GitBranch className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground">Dependency Graph</h1>
                    </div>
                </div>
                <p className="text-muted-foreground ml-14">
                    Visualize task dependencies and execution flow
                </p>
            </motion.div>

            {/* Legend */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-4 mb-6 space-y-4"
            >
                {/* Stats Row */}
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                        <div className="w-2 h-2 rounded-full bg-violet-500" />
                        <span className="text-xs font-medium text-violet-300">Product</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-xs font-medium text-blue-300">Tech</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20">
                        <div className="w-2 h-2 rounded-full bg-pink-500" />
                        <span className="text-xs font-medium text-pink-300">Marketing</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-medium text-emerald-300">Finance</span>
                    </div>

                    <div className="flex items-center gap-4 ml-auto">
                        <div className="text-center px-4 py-1 rounded-lg bg-white/5">
                            <span className="text-lg font-bold text-foreground">{tasks.length}</span>
                            <span className="text-xs text-muted-foreground ml-1">Tasks</span>
                        </div>
                        <div className="text-center px-4 py-1 rounded-lg bg-white/5">
                            <span className="text-lg font-bold text-emerald-400">
                                {tasks.filter(t => t.dependencies.length > 0).length}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">Connections</span>
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="flex items-center gap-6 text-xs text-muted-foreground border-t border-white/10 pt-3">
                    <span className="flex items-center gap-1">
                        <ZoomIn className="w-4 h-4" /> Scroll to zoom
                    </span>
                    <span className="flex items-center gap-1">
                        <Maximize2 className="w-4 h-4" /> Drag to pan
                    </span>
                    <span className="text-primary/70">
                        → Arrows show task dependencies (do A before B)
                    </span>
                </div>
            </motion.div>

            {/* Graph Container */}
            {tasks.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <p className="text-muted-foreground">No tasks to display.</p>
                    <Button
                        className="mt-4 gradient-primary text-white"
                        onClick={() => router.push("/")}
                    >
                        Create Execution Plan
                    </Button>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card rounded-2xl overflow-hidden"
                    style={{ height: "calc(100vh - 300px)", minHeight: "500px" }}
                >
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        nodeTypes={nodeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.3 }}
                        minZoom={0.3}
                        maxZoom={1.5}
                        className="bg-transparent"
                    >
                        <Background
                            variant={BackgroundVariant.Dots}
                            gap={20}
                            size={1}
                            color="oklch(0.5 0.02 260 / 20%)"
                        />
                        <Controls
                            className="glass rounded-xl border-white/20 overflow-hidden"
                            showInteractive={false}
                        />
                        <MiniMap
                            className="glass rounded-xl border-white/20 overflow-hidden"
                            nodeColor={(node) => {
                                const task = (node.data as { task: Task }).task;
                                switch (task.status) {
                                    case "completed": return "oklch(0.70 0.20 145)";
                                    case "in-progress": return "oklch(0.55 0.25 260)";
                                    case "blocked": return "oklch(0.65 0.22 25)";
                                    default: return "oklch(0.5 0.02 260)";
                                }
                            }}
                            maskColor="oklch(0.1 0.02 260 / 80%)"
                        />
                    </ReactFlow>
                </motion.div>
            )}
        </div>
    );
}
