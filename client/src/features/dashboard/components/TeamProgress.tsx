import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, ChevronDown, Briefcase, FileText, Clock, CheckCircle2 } from "lucide-react";
import { SpatialCard } from "@/presentation/components/ui/SpatialCard";
import { AnimatedSection, FloatingElement } from "@/presentation/components/effects/AnimatedSection";
import type { Task } from "@/types";
import { cn } from "@/core/utils/cn";

interface MemberWithTasks {
    id: string;
    name: string;
    avatarUrl?: string;
    tasks: Task[];
    taskStats: {
        todo: number;
        inProgress: number;
        review: number;
        done: number;
    };
}

interface TeamProgressProps {
    members: MemberWithTasks[];
    onTaskClick?: (task: Task) => void;
}

const statusConfig = {
    TODO: { label: "대기", color: "bg-gray-500", textColor: "text-gray-400" },
    IN_PROGRESS: { label: "진행", color: "bg-blue-500", textColor: "text-blue-400" },
    REVIEW: { label: "검토", color: "bg-yellow-500", textColor: "text-yellow-400" },
    DONE: { label: "완료", color: "bg-green-500", textColor: "text-green-400" },
};

export function TeamProgress({ members, onTaskClick }: TeamProgressProps) {
    const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());

    const toggleMember = (memberId: string) => {
        setExpandedMembers((prev) => {
            const next = new Set(prev);
            if (next.has(memberId)) {
                next.delete(memberId);
            } else {
                next.add(memberId);
            }
            return next;
        });
    };

    return (
        <AnimatedSection animation="fadeInUp" delay={0.4} className="mt-8">
            <SpatialCard className="p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <FloatingElement floatIntensity={2} duration={3.5}>
                        <Users className="w-5 h-5 text-pink-500" />
                    </FloatingElement>
                    팀 현황
                    <span className="ml-2 text-sm font-normal text-gray-400">
                        {members.length}명
                    </span>
                </h3>

                {members.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <FloatingElement floatIntensity={8}>
                            <Users className="w-12 h-12 text-gray-600 mb-4" />
                        </FloatingElement>
                        <p className="text-gray-500">팀원이 없습니다</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {members.map((member, i) => {
                            const isExpanded = expandedMembers.has(member.id);
                            const total = member.taskStats.todo + member.taskStats.inProgress + member.taskStats.review + member.taskStats.done;
                            const activeTaskCount = member.taskStats.inProgress + member.taskStats.review;
                            const activeTasks = member.tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'REVIEW');
                            const uniqueProjects = [...new Set(member.tasks.map(t => t.projectId))].length;

                            return (
                                <motion.div
                                    key={member.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="rounded-xl bg-white/5 overflow-hidden"
                                >
                                    {/* Member Header - Clickable */}
                                    <motion.div
                                        className={cn(
                                            "flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition-colors",
                                            isExpanded && "bg-white/5"
                                        )}
                                        onClick={() => toggleMember(member.id)}
                                        whileHover={{ x: 2 }}
                                    >
                                        {/* Avatar */}
                                        <motion.div
                                            className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0"
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                        >
                                            {member.avatarUrl ? (
                                                <img src={member.avatarUrl} alt={member.name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                member.name.charAt(0)
                                            )}
                                        </motion.div>

                                        {/* Name & Stats */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-medium truncate">{member.name}</span>
                                                {activeTaskCount > 0 && (
                                                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-blue-500/20 text-blue-400">
                                                        {activeTaskCount}개 진행중
                                                    </span>
                                                )}
                                            </div>
                                            {/* Quick Stats */}
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Briefcase className="w-3 h-3" />
                                                    {uniqueProjects}개 프로젝트
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    {member.taskStats.done}/{total}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Expand Icon */}
                                        <motion.div
                                            animate={{ rotate: isExpanded ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        </motion.div>
                                    </motion.div>

                                    {/* Expanded Content - Tasks & Projects */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 pb-4 space-y-3">
                                                    {/* Active Tasks */}
                                                    {activeTasks.length > 0 ? (
                                                        <div>
                                                            <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                진행중인 업무
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                {activeTasks.slice(0, 5).map((task) => {
                                                                    const status = statusConfig[task.status];
                                                                    return (
                                                                        <motion.div
                                                                            key={task.id}
                                                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors group"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onTaskClick?.(task);
                                                                            }}
                                                                            whileHover={{ x: 3 }}
                                                                        >
                                                                            <div className={cn("w-2 h-2 rounded-full shrink-0", status.color)} />
                                                                            <FileText className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                                                            <span className="flex-1 text-sm text-gray-300 truncate group-hover:text-white">
                                                                                {task.title}
                                                                            </span>
                                                                            {task.project && (
                                                                                <span className="text-[10px] text-gray-500 truncate max-w-[80px]">
                                                                                    {task.project.name}
                                                                                </span>
                                                                            )}
                                                                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded", status.textColor, `${status.color}/20`)}>
                                                                                {status.label}
                                                                            </span>
                                                                        </motion.div>
                                                                    );
                                                                })}
                                                                {activeTasks.length > 5 && (
                                                                    <div className="text-center text-xs text-gray-500 py-1">
                                                                        +{activeTasks.length - 5}개 더
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-4 text-sm text-gray-500">
                                                            진행중인 업무가 없습니다
                                                        </div>
                                                    )}

                                                    {/* Progress Bar */}
                                                    <div className="pt-2">
                                                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                                            <span>업무 진행률</span>
                                                            <span className="text-neon-teal">
                                                                {total > 0 ? Math.round((member.taskStats.done / total) * 100) : 0}%
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden flex">
                                                            {total > 0 && (
                                                                <>
                                                                    <motion.div
                                                                        className="h-full bg-green-500"
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${(member.taskStats.done / total) * 100}%` }}
                                                                        transition={{ duration: 0.5 }}
                                                                    />
                                                                    <motion.div
                                                                        className="h-full bg-yellow-500"
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${(member.taskStats.review / total) * 100}%` }}
                                                                        transition={{ duration: 0.5, delay: 0.1 }}
                                                                    />
                                                                    <motion.div
                                                                        className="h-full bg-blue-500"
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${(member.taskStats.inProgress / total) * 100}%` }}
                                                                        transition={{ duration: 0.5, delay: 0.2 }}
                                                                    />
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
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
