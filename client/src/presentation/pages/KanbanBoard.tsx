import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
    DndContext,
    DragOverlay,
    type DragStartEvent,
    type DragEndEvent,
    type DragOverEvent,
    useSensor,
    useSensors,
    PointerSensor,
    closestCorners
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";

import { KanbanColumn } from "@/presentation/components/features/kanban/KanbanColumn";
import { KanbanTaskCard } from "@/presentation/components/features/kanban/KanbanTaskCard";
import type { Column } from "@/domain/entities/Column";
import type { Task as SpatialTask } from "@/domain/entities/Task";
import { Plus, Sparkles } from "lucide-react";
import type { Task as ApiTask, TaskStatus } from "@/types";
import { AnimatedSection, FloatingElement } from "@/presentation/components/effects/AnimatedSection";
import { MagneticButton } from "@/presentation/components/effects/MagneticButton";
import { useTaskStore } from "@/stores/taskStore";
import { useProjectStore } from "@/stores/projectStore";
import { useUIStore } from "@/stores/uiStore";

// Status 매핑 함수
const statusToSpatial = (status: TaskStatus): SpatialTask['status'] => {
    const map: Record<TaskStatus, SpatialTask['status']> = {
        'TODO': 'todo',
        'IN_PROGRESS': 'in-progress',
        'REVIEW': 'review',
        'DONE': 'done'
    };
    return map[status];
};

const spatialToStatus = (status: SpatialTask['status']): TaskStatus => {
    const map: Record<SpatialTask['status'], TaskStatus> = {
        'todo': 'TODO',
        'in-progress': 'IN_PROGRESS',
        'review': 'REVIEW',
        'done': 'DONE'
    };
    return map[status];
};

// API Task를 Spatial Task로 변환
const convertToSpatialTask = (task: ApiTask): SpatialTask => ({
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    content: task.description,
    status: statusToSpatial(task.status),
    priority: task.priority.toLowerCase() as SpatialTask['priority'],
    assigneeId: task.assignee?.id,
    assigneeIds: task.assignees?.map(a => a.id) || (task.assignee ? [task.assignee.id] : undefined),
    startDate: task.startDate ? new Date(task.startDate) : undefined,
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    tags: task.labels?.map(l => l.label.name) || [],
    createdAt: new Date(task.createdAt),
});

// 기본 컬럼 정의
const DEFAULT_COLUMNS: Column[] = [
    { id: "TODO", projectId: "", title: "할 일", order: 0 },
    { id: "IN_PROGRESS", projectId: "", title: "진행 중", order: 1 },
    { id: "REVIEW", projectId: "", title: "검토", order: 2 },
    { id: "DONE", projectId: "", title: "완료", order: 3 },
];

export function KanbanBoard() {
    const [columns] = useState<Column[]>(DEFAULT_COLUMNS);
    const { tasks: storeTasks, loading, updateTaskStatus } = useTaskStore();
    const { projects } = useProjectStore();
    const { openCreateTaskModal } = useUIStore();

    // Store의 tasks를 SpatialTask로 변환 (useMemo로 파생)
    const tasks = useMemo(() => {
        return storeTasks.map(convertToSpatialTask);
    }, [storeTasks]);

    // 드래그 중 로컬 상태 (UI용)
    const [localTasks, setLocalTasks] = useState<SpatialTask[]>([]);

    // Store tasks가 변경될 때 localTasks 동기화
    useMemo(() => {
        setLocalTasks(tasks);
    }, [tasks]);

    const projectName = projects[0]?.name || "프로젝트";

    const [activeColumn, setActiveColumn] = useState<Column | null>(null);
    const [activeTask, setActiveTask] = useState<SpatialTask | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10,
            },
        })
    );

    const columnIds = useMemo(() => columns.map((col) => col.id), [columns]);

    // Status별 태스크 매핑
    const getTasksByStatus = (status: string): SpatialTask[] => {
        const statusMap: Record<string, SpatialTask['status']> = {
            'TODO': 'todo',
            'IN_PROGRESS': 'in-progress',
            'REVIEW': 'review',
            'DONE': 'done'
        };
        return localTasks.filter((t: SpatialTask) => t.status === statusMap[status]);
    };

    // 드래그 핸들러
    const onDragStart = (event: DragStartEvent) => {
        if (event.active.data.current?.type === "Column") {
            setActiveColumn(event.active.data.current.column);
            return;
        }
        if (event.active.data.current?.type === "Task") {
            setActiveTask(event.active.data.current.task);
            return;
        }
    };

    const onDragEnd = async (event: DragEndEvent) => {
        setActiveColumn(null);
        setActiveTask(null);

        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        // 태스크 드래그 완료 시 Store 업데이트
        if (active.data.current?.type === "Task") {
            const task = localTasks.find((t: SpatialTask) => t.id === activeId);
            if (task) {
                const newStatus = spatialToStatus(task.status);
                try {
                    await updateTaskStatus(task.id, newStatus);
                } catch (error) {
                    console.error('Failed to update task status:', error);
                }
            }
        }
    };

    const onDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveTask = active.data.current?.type === "Task";
        const isOverTask = over.data.current?.type === "Task";
        const isOverColumn = over.data.current?.type === "Column";

        if (!isActiveTask) return;

        // 다른 태스크 위로 드롭
        if (isActiveTask && isOverTask) {
            setLocalTasks((ts: SpatialTask[]) => {
                const activeIndex = ts.findIndex((t: SpatialTask) => t.id === activeId);
                const overIndex = ts.findIndex((t: SpatialTask) => t.id === overId);

                if (ts[activeIndex].status !== ts[overIndex].status) {
                    const newTasks = [...ts];
                    newTasks[activeIndex] = {
                        ...newTasks[activeIndex],
                        status: ts[overIndex].status
                    };
                    return arrayMove(newTasks, activeIndex, overIndex);
                }

                return arrayMove(ts, activeIndex, overIndex);
            });
        }

        // 컬럼 위로 드롭
        if (isActiveTask && isOverColumn) {
            setLocalTasks((ts: SpatialTask[]) => {
                const activeIndex = ts.findIndex((t: SpatialTask) => t.id === activeId);
                const columnId = overId as string;
                const statusMap: Record<string, SpatialTask['status']> = {
                    'TODO': 'todo',
                    'IN_PROGRESS': 'in-progress',
                    'REVIEW': 'review',
                    'DONE': 'done'
                };

                const newTasks = [...ts];
                newTasks[activeIndex] = {
                    ...newTasks[activeIndex],
                    status: statusMap[columnId] || newTasks[activeIndex].status
                };
                return newTasks;
            });
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <FloatingElement floatIntensity={15} rotateIntensity={5}>
                    <div className="flex flex-col items-center gap-4">
                        <motion.div
                            className="h-16 w-16 rounded-full border-4 border-neon-violet border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-neon-violet animate-pulse" />
                            <p className="text-gray-400 animate-pulse">칸반 보드를 준비하는 중...</p>
                        </div>
                    </div>
                </FloatingElement>
            </div>
        );
    }

    return (
        <motion.div
            className="h-full flex flex-col p-8 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <AnimatedSection animation="fadeInDown" className="shrink-0 mb-8">
                <header className="flex justify-between items-center">
                    <div>
                        <FloatingElement floatIntensity={3} rotateIntensity={1} duration={6}>
                            <motion.h1
                                className="text-3xl font-bold text-white mb-1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                {projectName}
                            </motion.h1>
                        </FloatingElement>
                        <p className="text-gray-400 text-sm">드래그하여 업무 상태를 변경하세요.</p>
                    </div>
                    <MagneticButton
                        variant="neon"
                        size="md"
                        magneticStrength={0.4}
                        glowColor="#00FFFF"
                        onClick={() => openCreateTaskModal(projects[0]?.id)}
                    >
                        <Plus className="w-4 h-4" /> 새 업무 추가
                    </MagneticButton>
                </header>
            </AnimatedSection>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
            >
                <motion.div
                    className="flex gap-6 overflow-x-auto pb-4 h-full items-start"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <SortableContext items={columnIds}>
                        {columns.map((col, index) => (
                            <motion.div
                                key={col.id}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                    delay: index * 0.1,
                                    type: "spring",
                                    stiffness: 100,
                                }}
                            >
                                <KanbanColumn
                                    column={col}
                                    tasks={getTasksByStatus(col.id)}
                                />
                            </motion.div>
                        ))}
                    </SortableContext>
                </motion.div>

                {createPortal(
                    <DragOverlay dropAnimation={{
                        duration: 300,
                        easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
                    }}>
                        {activeColumn && (
                            <motion.div
                                initial={{ scale: 1, rotate: 0 }}
                                animate={{ scale: 1.05, rotate: 3 }}
                                style={{
                                    boxShadow: "0 25px 50px -12px rgba(224, 64, 251, 0.5)",
                                }}
                            >
                                <KanbanColumn
                                    column={activeColumn}
                                    tasks={getTasksByStatus(activeColumn.id)}
                                />
                            </motion.div>
                        )}
                        {activeTask && (
                            <motion.div
                                initial={{ scale: 1, rotate: 0 }}
                                animate={{ scale: 1.1, rotate: 5 }}
                                style={{
                                    boxShadow: "0 25px 50px -12px rgba(0, 255, 255, 0.5)",
                                }}
                            >
                                <KanbanTaskCard task={activeTask} />
                            </motion.div>
                        )}
                    </DragOverlay>,
                    document.body
                )}
            </DndContext>
        </motion.div>
    );
}
