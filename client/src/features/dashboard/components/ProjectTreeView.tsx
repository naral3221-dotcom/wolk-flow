import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
    FolderKanban,
    ChevronRight,
    FileText,
    ArrowRight,
    Users,
    Calendar,
    CheckCircle2,
    Clock,
    Zap,
    AlertCircle,
} from "lucide-react";
import { SpatialCard } from "@/presentation/components/ui/SpatialCard";
import { AnimatedSection, FloatingElement } from "@/presentation/components/effects/AnimatedSection";
import type { Project, Task } from "@/types";
import { cn } from "@/core/utils/cn";
import { useUIStore } from "@/stores/uiStore";

interface ProjectTreeViewProps {
    projects: Project[];
    tasks: Task[];
    onTaskClick: (task: Task) => void;
    onProjectClick?: (project: Project) => void;
}

interface ProjectNode {
    project: Project;
    tasks: Task[];
    taskStats: {
        todo: number;
        inProgress: number;
        review: number;
        done: number;
        total: number;
    };
}

const statusConfig = {
    TODO: { icon: Clock, color: "text-gray-400", bg: "bg-gray-500/20", label: "대기" },
    IN_PROGRESS: { icon: Zap, color: "text-blue-400", bg: "bg-blue-500/20", label: "진행" },
    REVIEW: { icon: AlertCircle, color: "text-yellow-400", bg: "bg-yellow-500/20", label: "검토" },
    DONE: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/20", label: "완료" },
};

const priorityColors = {
    URGENT: "bg-red-500",
    HIGH: "bg-orange-500",
    MEDIUM: "bg-yellow-500",
    LOW: "bg-gray-500",
};

export function ProjectTreeView({ projects, tasks, onTaskClick }: ProjectTreeViewProps) {
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const { openContextMenu } = useUIStore();

    // 프로젝트 우클릭 핸들러
    const handleProjectContextMenu = useCallback((e: React.MouseEvent, project: Project) => {
        e.preventDefault();
        e.stopPropagation();
        openContextMenu('project', { x: e.clientX, y: e.clientY }, { project });
    }, [openContextMenu]);

    // 태스크 우클릭 핸들러
    const handleTaskContextMenu = useCallback((e: React.MouseEvent, task: Task) => {
        e.preventDefault();
        e.stopPropagation();
        openContextMenu('task', { x: e.clientX, y: e.clientY }, { task });
    }, [openContextMenu]);

    // 프로젝트별로 태스크 그룹화
    const projectNodes = useMemo<ProjectNode[]>(() => {
        return projects.map((project) => {
            const projectTasks = tasks.filter((t) => t.projectId === project.id);
            return {
                project,
                tasks: projectTasks,
                taskStats: {
                    todo: projectTasks.filter((t) => t.status === "TODO").length,
                    inProgress: projectTasks.filter((t) => t.status === "IN_PROGRESS").length,
                    review: projectTasks.filter((t) => t.status === "REVIEW").length,
                    done: projectTasks.filter((t) => t.status === "DONE").length,
                    total: projectTasks.length,
                },
            };
        }).sort((a, b) => {
            // 활성 프로젝트 우선, 그 다음 태스크 수 기준
            if (a.project.status === "ACTIVE" && b.project.status !== "ACTIVE") return -1;
            if (a.project.status !== "ACTIVE" && b.project.status === "ACTIVE") return 1;
            return b.taskStats.total - a.taskStats.total;
        });
    }, [projects, tasks]);

    const toggleProject = (projectId: string) => {
        setExpandedProjects((prev) => {
            const next = new Set(prev);
            if (next.has(projectId)) {
                next.delete(projectId);
            } else {
                next.add(projectId);
            }
            return next;
        });
    };

    const getProjectProgress = (node: ProjectNode) => {
        if (node.taskStats.total === 0) return 0;
        return Math.round((node.taskStats.done / node.taskStats.total) * 100);
    };

    return (
        <AnimatedSection animation="fadeInLeft" delay={0.2} className="lg:col-span-2">
            <SpatialCard className="p-6 h-full">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <FloatingElement floatIntensity={2} duration={3}>
                            <FolderKanban className="w-5 h-5 text-neon-violet" />
                        </FloatingElement>
                        프로젝트 현황
                        <span className="ml-2 text-sm font-normal text-gray-400">
                            {projects.length}개 프로젝트
                        </span>
                    </h3>
                    <Link
                        to="/projects"
                        className="flex items-center gap-1 text-sm text-gray-400 hover:text-neon-violet transition-colors"
                    >
                        전체 보기 <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {projectNodes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <FloatingElement floatIntensity={8}>
                            <FolderKanban className="w-12 h-12 text-gray-600 mb-4" />
                        </FloatingElement>
                        <p className="text-gray-500">등록된 프로젝트가 없습니다</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {projectNodes.map((node, idx) => {
                            const isExpanded = expandedProjects.has(node.project.id);
                            const progress = getProjectProgress(node);

                            return (
                                <motion.div
                                    key={node.project.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="rounded-xl bg-white/5 overflow-hidden"
                                >
                                    {/* Project Header */}
                                    <div
                                        className={cn(
                                            "flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition-colors",
                                            isExpanded && "bg-white/5"
                                        )}
                                        onClick={() => toggleProject(node.project.id)}
                                        onContextMenu={(e) => handleProjectContextMenu(e, node.project)}
                                    >
                                        <motion.div
                                            animate={{ rotate: isExpanded ? 90 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        </motion.div>

                                        {/* Project Color & Name */}
                                        <div
                                            className="w-3 h-3 rounded-full shrink-0"
                                            style={{ backgroundColor: node.project.team?.color || "#6366f1" }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-medium truncate">
                                                    {node.project.name}
                                                </span>
                                                {node.project.status === "COMPLETED" && (
                                                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                                                )}
                                                {node.project.status === "ON_HOLD" && (
                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                                                        보류
                                                    </span>
                                                )}
                                            </div>
                                            {/* Progress Bar */}
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-gradient-to-r from-neon-violet to-neon-blue"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-400 w-10 text-right">
                                                    {progress}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Task Stats Mini */}
                                        <div className="flex items-center gap-1 text-xs">
                                            <span className="px-2 py-1 rounded bg-gray-500/20 text-gray-400">
                                                {node.taskStats.todo}
                                            </span>
                                            <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                                                {node.taskStats.inProgress}
                                            </span>
                                            <span className="px-2 py-1 rounded bg-green-500/20 text-green-400">
                                                {node.taskStats.done}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Task List */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 pb-4 space-y-1.5">
                                                    {/* Project Meta */}
                                                    <div className="flex flex-wrap items-center gap-4 px-3 py-2 text-xs text-gray-500 border-b border-white/5 mb-2">
                                                        {node.project.team && (
                                                            <div className="flex items-center gap-1">
                                                                <Users className="w-3 h-3" />
                                                                <span>{node.project.team.name}</span>
                                                            </div>
                                                        )}
                                                        {node.project.endDate && (
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                <span>마감: {new Date(node.project.endDate).toLocaleDateString()}</span>
                                                            </div>
                                                        )}
                                                        {/* 담당 팀원 표시 */}
                                                        {node.project.teamAssignments && node.project.teamAssignments.length > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-gray-400">담당:</span>
                                                                <div className="flex -space-x-1">
                                                                    {node.project.teamAssignments
                                                                        .flatMap(ta => ta.assignees || [])
                                                                        .slice(0, 3)
                                                                        .map((member) => (
                                                                            <div
                                                                                key={member.id}
                                                                                className="w-5 h-5 rounded-full bg-gradient-to-br from-neon-violet to-neon-blue flex items-center justify-center text-[10px] font-bold text-white border border-midnight-800"
                                                                                title={member.name}
                                                                            >
                                                                                {member.name.charAt(0)}
                                                                            </div>
                                                                        ))}
                                                                    {node.project.teamAssignments
                                                                        .flatMap(ta => ta.assignees || []).length > 3 && (
                                                                            <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center text-[10px] font-bold text-white border border-midnight-800">
                                                                                +{node.project.teamAssignments.flatMap(ta => ta.assignees || []).length - 3}
                                                                            </div>
                                                                        )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {node.tasks.length === 0 ? (
                                                        <div className="text-center py-4 text-gray-500 text-sm">
                                                            등록된 업무가 없습니다
                                                        </div>
                                                    ) : (
                                                        node.tasks.slice(0, 10).map((task, taskIdx) => {
                                                            const statusCfg = statusConfig[task.status];
                                                            return (
                                                                <motion.div
                                                                    key={task.id}
                                                                    initial={{ opacity: 0, x: -10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{ delay: taskIdx * 0.03 }}
                                                                    className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors group"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onTaskClick(task);
                                                                    }}
                                                                    onContextMenu={(e) => handleTaskContextMenu(e, task)}
                                                                >
                                                                    {/* 아이콘 영역 */}
                                                                    <div className="mt-0.5 shrink-0">
                                                                        <FileText className="w-4 h-4 text-gray-500" />
                                                                    </div>

                                                                    {/* 내용 영역 (2줄 레이아웃) */}
                                                                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                                                        {/* 1행: 우선순위 + 제목 */}
                                                                        <div className="flex items-start gap-2">
                                                                            <div
                                                                                className={cn(
                                                                                    "w-2 h-2 rounded-full shrink-0 mt-1.5",
                                                                                    priorityColors[task.priority]
                                                                                )}
                                                                            />
                                                                            <span
                                                                                className="text-sm text-gray-300 group-hover:text-white transition-colors line-clamp-2 break-all"
                                                                                title={task.title}
                                                                            >
                                                                                {task.title}
                                                                            </span>
                                                                        </div>

                                                                        {/* 2행: 메타데이터 (상태, 담당자) */}
                                                                        <div className="flex items-center gap-2">
                                                                            <span
                                                                                className={cn(
                                                                                    "px-2 py-0.5 rounded text-[10px] shrink-0",
                                                                                    statusCfg.bg,
                                                                                    statusCfg.color
                                                                                )}
                                                                            >
                                                                                {statusCfg.label}
                                                                            </span>

                                                                            {/* 담당자 표시 */}
                                                                            {(task.assignees && task.assignees.length > 0) ? (
                                                                                <div className="flex -space-x-1 shrink-0">
                                                                                    {task.assignees.slice(0, 3).map((assignee) => (
                                                                                        <div
                                                                                            key={assignee.id}
                                                                                            className="w-5 h-5 rounded-full bg-gradient-to-br from-neon-violet to-neon-blue flex items-center justify-center text-white text-[9px] border border-midnight-800"
                                                                                            title={assignee.name}
                                                                                        >
                                                                                            {assignee.name.charAt(0)}
                                                                                        </div>
                                                                                    ))}
                                                                                    {task.assignees.length > 3 && (
                                                                                        <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center text-white text-[9px] border border-midnight-800">
                                                                                            +{task.assignees.length - 3}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ) : task.assignee && (
                                                                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-neon-violet to-neon-blue flex items-center justify-center text-white text-[9px] shrink-0" title={task.assignee.name}>
                                                                                    {task.assignee.name.charAt(0)}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            );
                                                        })
                                                    )}

                                                    {node.tasks.length > 10 && (
                                                        <Link
                                                            to={`/kanban?project=${node.project.id}`}
                                                            className="block text-center py-2 text-sm text-gray-400 hover:text-neon-violet transition-colors"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            +{node.tasks.length - 10}개 더보기
                                                        </Link>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </SpatialCard>
        </AnimatedSection>
    );
}
