import { useMemo } from "react";
import { motion } from "framer-motion";
import { SpatialGanttChart } from "../components/features/gantt/SpatialGanttChart";
import { Plus, Calendar, Sparkles } from "lucide-react";
import type { Task as SpatialTask } from "@/domain/entities/Task";
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

export function GanttPage() {
    const { tasks: storeTasks, loading } = useTaskStore();
    const { projects } = useProjectStore();
    const { openCreateTaskModal } = useUIStore();

    // Store의 tasks를 SpatialTask로 변환하고 날짜가 있는 것만 필터링
    const tasks = useMemo(() => {
        return storeTasks
            .map(convertToSpatialTask)
            .filter(t => t.startDate && t.dueDate);
    }, [storeTasks]);

    const projectName = projects[0] ? `${projects[0].name} 일정` : "프로젝트 일정";

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <FloatingElement floatIntensity={15} rotateIntensity={5}>
                    <div className="flex flex-col items-center gap-4">
                        <motion.div
                            className="h-16 w-16 rounded-full border-4 border-neon-teal border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-neon-teal animate-pulse" />
                            <p className="text-gray-400 animate-pulse">타임라인을 구성하는 중...</p>
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
            <AnimatedSection animation="fadeInDown" className="shrink-0 mb-6">
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
                        <p className="text-gray-400 text-sm">타임라인에서 전체 흐름을 파악하세요.</p>
                    </div>
                    <div className="flex gap-3">
                        <MagneticButton
                            variant="secondary"
                            size="md"
                            magneticStrength={0.3}
                        >
                            <Calendar className="w-4 h-4" /> 오늘
                        </MagneticButton>
                        <MagneticButton
                            variant="neon"
                            size="md"
                            magneticStrength={0.4}
                            glowColor="#00FFFF"
                            onClick={() => openCreateTaskModal(projects[0]?.id)}
                        >
                            <Plus className="w-4 h-4" /> 일정 추가
                        </MagneticButton>
                    </div>
                </header>
            </AnimatedSection>

            <AnimatedSection animation="fadeInUp" delay={0.2} className="flex-1 overflow-hidden">
                {tasks.length === 0 ? (
                    <motion.div
                        className="flex flex-col items-center justify-center h-full"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <FloatingElement floatIntensity={10} rotateIntensity={3}>
                            <motion.div
                                whileHover={{ scale: 1.1, rotate: 10 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <Calendar className="w-20 h-20 text-gray-600 mb-4" />
                            </motion.div>
                        </FloatingElement>
                        <motion.p
                            className="text-gray-500 text-lg"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            일정이 등록된 업무가 없습니다
                        </motion.p>
                        <motion.p
                            className="text-gray-600 text-sm mt-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            업무에 시작일과 마감일을 설정해주세요
                        </motion.p>
                    </motion.div>
                ) : (
                    <motion.div
                        className="h-full"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
                    >
                        <SpatialGanttChart tasks={tasks} />
                    </motion.div>
                )}
            </AnimatedSection>
        </motion.div>
    );
}
