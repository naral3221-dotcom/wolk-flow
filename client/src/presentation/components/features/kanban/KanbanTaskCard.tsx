import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { SpatialCard } from "@/presentation/components/ui/SpatialCard";
import type { Task } from "@/domain/entities/Task";
import { cn } from "@/core/utils/cn";
import { Clock, MoreHorizontal, Sparkles } from "lucide-react";

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

    const priorityColors = {
        low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        urgent: "bg-red-500/10 text-red-400 border-red-500/20",
    };

    const priorityGlow = {
        low: "rgba(59, 130, 246, 0.3)",
        medium: "rgba(234, 179, 8, 0.3)",
        high: "rgba(249, 115, 22, 0.3)",
        urgent: "rgba(239, 68, 68, 0.4)",
    };

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
            whileHover={{
                scale: 1.02,
                y: -5,
                rotateY: 5,
                rotateX: -2,
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
                    <div className="flex justify-between items-start mb-2">
                        <motion.span
                            className={cn(
                                "px-2 py-0.5 rounded text-[10px] uppercase font-bold border",
                                priorityColors[task.priority]
                            )}
                            whileHover={{ scale: 1.1 }}
                        >
                            {task.priority}
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
                        <motion.div
                            className="flex items-center gap-1"
                            whileHover={{ x: 3 }}
                        >
                            <Clock className="w-3 h-3" />
                            <span>D-2</span>
                        </motion.div>
                        {/* 다중 담당자 아바타 */}
                        {(task.assigneeIds && task.assigneeIds.length > 0) || task.assigneeId ? (
                            <div className="flex -space-x-2">
                                {(task.assigneeIds || [task.assigneeId]).slice(0, 3).map((id, index) => (
                                    <motion.div
                                        key={id || index}
                                        className="w-6 h-6 rounded-full bg-linear-to-tr from-purple-500 to-indigo-500 border-2 border-midnight-800 flex items-center justify-center text-[8px] font-bold text-white"
                                        style={{ zIndex: 10 - index }}
                                        whileHover={{ scale: 1.2, zIndex: 20 }}
                                    />
                                ))}
                                {(task.assigneeIds?.length || 0) > 3 && (
                                    <motion.div
                                        className="w-6 h-6 rounded-full bg-gray-600 border-2 border-midnight-800 flex items-center justify-center text-[9px] font-medium text-gray-300"
                                        whileHover={{ scale: 1.1 }}
                                    >
                                        +{(task.assigneeIds?.length || 0) - 3}
                                    </motion.div>
                                )}
                            </div>
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
