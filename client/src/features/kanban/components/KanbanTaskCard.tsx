import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { SpatialCard } from "@/presentation/components/ui/SpatialCard";
import type { Task } from "@/domain/entities/Task";
import { cn } from "@/core/utils/cn";
import { Clock, MoreHorizontal, Sparkles, Folder, Users } from "lucide-react";
import { useContextMenu } from "@/presentation/components/context-menu";
import { useMemo } from "react";

interface KanbanTaskCardProps {
    task: Task;
}

export function KanbanTaskCard({ task }: KanbanTaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: { type: "Task", task } });

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    // 우클릭 컨텍스트 메뉴 - 드래그 중에는 비활성화
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { handleContextMenu } = useContextMenu({
        type: 'task',
        data: { task: task as any },
        disabled: isDragging,
    });

    const priorityColors: Record<string, string> = {
        low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        urgent: "bg-red-500/10 text-red-400 border-red-500/20",
    };

    const priorityGlow: Record<string, string> = {
        low: "rgba(59, 130, 246, 0.3)",
        medium: "rgba(234, 179, 8, 0.3)",
        high: "rgba(249, 115, 22, 0.3)",
        urgent: "rgba(239, 68, 68, 0.4)",
    };

    const priorityLabels: Record<string, string> = {
        low: "낮음",
        medium: "보통",
        high: "높음",
        urgent: "긴급",
    };

    // D-day 계산
    const dDay = useMemo(() => {
        if (!task.dueDate) return null;
        const due = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { text: `D+${Math.abs(diffDays)}`, isOverdue: true };
        if (diffDays === 0) return { text: 'D-Day', isOverdue: false };
        return { text: `D-${diffDays}`, isOverdue: false };
    }, [task.dueDate]);

    // 팀 정보 추출
    const team = useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const taskAny = task as any;
        if (taskAny.team) return taskAny.team;
        if (taskAny.project?.team) return taskAny.project.team;
        return null;
    }, [task]);

    if (isDragging) {
        return (
            <motion.div
                ref={setNodeRef}
                style={style}
                className="h-[120px] rounded-2xl border-2 border-neon-violet bg-midnight-800/80 backdrop-blur-xl"
                animate={{
                    scale: 1.05,
                    rotateZ: 3,
                    boxShadow: "0 25px 50px -12px rgba(224, 64, 251, 0.5), 0 0 30px rgba(0, 255, 255, 0.3)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
                <div className="absolute inset-0 bg-linear-to-br from-neon-violet/20 to-neon-teal/20 rounded-2xl" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-neon-violet animate-pulse" />
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="touch-none"
            onContextMenu={handleContextMenu}
            whileHover={{
                scale: 1.02,
                y: -3,
            }}
            whileTap={{
                scale: 1.05,
                rotateZ: 2,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
            <SpatialCard
                className="p-4 group/card hover:ring-neon-violet/30 relative overflow-hidden"
                hoverEffect={true}
            >
                {/* Animated gradient background on hover */}
                <motion.div
                    className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity"
                    style={{
                        background: `radial-gradient(circle at 50% 0%, ${priorityGlow[task.priority]} 0%, transparent 70%)`,
                    }}
                />

                {/* Priority pulse indicator */}
                {task.priority === 'urgent' && (
                    <motion.div
                        className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500"
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                )}

                <div className="relative z-10">
                    {/* 프로젝트 이름 & 팀 배지 */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {task.project?.name && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                <Folder className="w-3 h-3" />
                                <span className="truncate max-w-[80px]">{task.project.name}</span>
                            </div>
                        )}
                        {team && (
                            <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium"
                                style={{
                                    backgroundColor: `${team.color || '#8b5cf6'}20`,
                                    color: team.color || '#8b5cf6',
                                    border: `1px solid ${team.color || '#8b5cf6'}40`
                                }}
                            >
                                <Users className="w-2.5 h-2.5" />
                                {team.name}
                            </span>
                        )}
                    </div>

                    <div className="flex justify-between items-start mb-2">
                        <motion.span
                            className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold border",
                                priorityColors[task.priority]
                            )}
                            whileHover={{ scale: 1.1 }}
                        >
                            {priorityLabels[task.priority]}
                        </motion.span>
                        <motion.button
                            className="text-gray-500 hover:text-white opacity-0 group-hover/card:opacity-100 transition-opacity"
                            whileHover={{ rotate: 90 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </motion.button>
                    </div>

                    <h4 className="font-semibold text-white mb-3 line-clamp-2 group-hover/card:text-neon-teal transition-colors">
                        {task.title}
                    </h4>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                        {dDay ? (
                            <motion.div
                                className={cn(
                                    "flex items-center gap-1 px-1.5 py-0.5 rounded",
                                    dDay.isOverdue
                                        ? "bg-red-500/20 text-red-400"
                                        : dDay.text === 'D-Day'
                                            ? "bg-amber-500/20 text-amber-400"
                                            : "bg-gray-500/20 text-gray-400"
                                )}
                                whileHover={{ scale: 1.05 }}
                            >
                                <Clock className="w-3 h-3" />
                                <span className="font-medium">{dDay.text}</span>
                            </motion.div>
                        ) : (
                            <div />
                        )}
                        {/* 다중 담당자 이름 배지 */}
                        {task.assignees && task.assignees.length > 0 ? (
                            <div className="flex items-center gap-1 flex-wrap justify-end">
                                {task.assignees.slice(0, 2).map((assignee) => (
                                    <motion.span
                                        key={assignee.id}
                                        className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        {assignee.name}
                                    </motion.span>
                                ))}
                                {task.assignees.length > 2 && (
                                    <span className="text-[9px] text-gray-500">
                                        +{task.assignees.length - 2}
                                    </span>
                                )}
                            </div>
                        ) : task.assignee ? (
                            <motion.span
                                className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30"
                                whileHover={{ scale: 1.05 }}
                            >
                                {task.assignee.name}
                            </motion.span>
                        ) : null}
                    </div>
                </div>

                {/* Shimmer effect on hover */}
                <motion.div
                    className="absolute inset-0 opacity-0 group-hover/card:opacity-100"
                    style={{
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
                        transform: "translateX(-100%)",
                    }}
                    whileHover={{
                        transform: "translateX(100%)",
                        transition: { duration: 0.8, ease: "easeInOut" },
                    }}
                />
            </SpatialCard>
        </motion.div>
    );
}
