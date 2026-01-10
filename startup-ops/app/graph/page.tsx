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

const nodeTypes = {
    taskNode: TaskNode,
};

// Position nodes based on dependencies
function generateGraphLayout(tasks: Task[]): { nodes: Node[]; edges: Edge[] } {
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const levels: Map<string, number> = new Map();

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

    // Group tasks by level
    const levelGroups: Map<number, Task[]> = new Map();
    tasks.forEach((task) => {
        const level = levels.get(task.id) || 0;
        if (!levelGroups.has(level)) {
            levelGroups.set(level, []);
        }
        levelGroups.get(level)!.push(task);
    });

    // Create nodes
    const nodes: Node[] = [];
    const xSpacing = 280;
    const ySpacing = 140;

    levelGroups.forEach((tasksInLevel, level) => {
        const startX = -(tasksInLevel.length - 1) * xSpacing / 2;
        tasksInLevel.forEach((task, index) => {
            nodes.push({
                id: task.id,
                type: "taskNode",
                position: { x: startX + index * xSpacing, y: level * ySpacing },
                data: { task },
            });
        });
    });

    // Create edges
    const edges: Edge[] = [];
    tasks.forEach((task) => {
        task.dependencies.forEach((depId) => {
            edges.push({
                id: `${depId}-${task.id}`,
                source: depId,
                target: task.id,
                type: "smoothstep",
                animated: task.status === "in-progress",
                style: {
                    stroke: task.status === "blocked"
                        ? "oklch(0.65 0.22 25)"
                        : "oklch(0.55 0.25 260)",
                    strokeWidth: 2,
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: task.status === "blocked"
                        ? "oklch(0.65 0.22 25)"
                        : "oklch(0.55 0.25 260)",
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
                className="glass-card p-4 mb-6 flex items-center gap-6 flex-wrap"
            >
                <span className="text-sm font-medium text-muted-foreground">Legend:</span>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-status-healthy" />
                    <span className="text-sm text-foreground">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-sm text-foreground">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                    <span className="text-sm text-foreground">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-status-critical" />
                    <span className="text-sm text-foreground">Blocked</span>
                </div>
                <div className="flex items-center gap-3 ml-auto text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <ZoomIn className="w-4 h-4" /> Scroll to zoom
                    </span>
                    <span className="flex items-center gap-1">
                        <Maximize2 className="w-4 h-4" /> Drag to pan
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
