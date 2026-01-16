import { useMemo, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Sparkles, ChevronRight, ChevronDown, GitBranch, Check, Circle, Loader2, Eye, Plus } from "lucide-react";
import type { Task as SpatialTask } from "@/domain/entities/Task";
import type { Task as ApiTask, TaskStatus } from "@/types";
import { AnimatedSection, FloatingElement } from "@/presentation/components/effects/AnimatedSection";
import { MagneticButton } from "@/presentation/components/effects/MagneticButton";
import { useTaskStore } from "@/stores/taskStore";
import { useProjectStore } from "@/stores/projectStore";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/core/utils/cn";
// @ts-ignore
import { addDays, format, differenceInDays } from "date-fns";

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
    priority: (task.priority?.toLowerCase() || 'medium') as SpatialTask['priority'],
    assigneeId: task.assignee?.id,
    assigneeIds: task.assignees?.map(a => a.id) || (task.assignee ? [task.assignee.id] : undefined),
    startDate: task.startDate ? new Date(task.startDate) : undefined,
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    tags: task.labels?.map(l => l.label.name) || [],
    createdAt: new Date(task.createdAt),
});

// 하위 업무 상태 변경 순환 (TODO -> IN_PROGRESS -> DONE -> TODO)
const getNextStatus = (currentStatus: TaskStatus): TaskStatus => {
    const statusCycle: Record<TaskStatus, TaskStatus> = {
        'TODO': 'IN_PROGRESS',
        'IN_PROGRESS': 'DONE',
        'REVIEW': 'DONE',
        'DONE': 'TODO'
    };
    return statusCycle[currentStatus];
};

// 상태별 아이콘 컴포넌트
const StatusIcon = ({ status }: { status: TaskStatus }) => {
    switch (status) {
        case 'DONE':
            return <Check className="w-3 h-3" />;
        case 'IN_PROGRESS':
            return <Loader2 className="w-3 h-3 animate-spin" />;
        case 'REVIEW':
            return <Eye className="w-3 h-3" />;
        default:
            return <Circle className="w-3 h-3" />;
    }
};

// 상태별 바 색상
const getStatusBarColor = (status: TaskStatus) => {
    switch (status) {
        case 'DONE':
            return 'from-emerald-500/80 to-teal-500/80';
        case 'IN_PROGRESS':
            return 'from-blue-500/80 to-cyan-500/80';
        case 'REVIEW':
            return 'from-amber-500/80 to-orange-500/80';
        default: // TODO
            return 'from-gray-500/80 to-slate-500/80';
    }
};

// 우선순위별 테두리/강조 색상
const getPriorityStyle = (priority: string) => {
    switch (priority?.toUpperCase()) {
        case 'URGENT':
            return {
                border: 'border-2 border-red-500',
                indicator: 'bg-red-500',
                shadow: 'shadow-lg shadow-red-500/30'
            };
        case 'HIGH':
            return {
                border: 'border-2 border-orange-400',
                indicator: 'bg-orange-400',
                shadow: 'shadow-lg shadow-orange-400/30'
            };
        case 'MEDIUM':
            return {
                border: 'border border-yellow-400/50',
                indicator: 'bg-yellow-400',
                shadow: ''
            };
        default: // LOW
            return {
                border: 'border border-transparent',
                indicator: 'bg-green-400',
                shadow: ''
            };
    }
};

export function GanttPage() {
    const { tasks: storeTasks, loading, updateTaskStatus } = useTaskStore();
    const { projects } = useProjectStore();
    const { openEditTaskModal, openCreateSubtaskModal } = useUIStore();
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

    // 드래그 스크롤 상태
    const headerScrollRef = useRef<HTMLDivElement>(null);
    const bodyScrollRef = useRef<HTMLDivElement>(null);
    const leftPanelRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    // 가로 스크롤 동기화 (헤더 <-> 바디)
    const syncHorizontalScroll = useCallback((source: 'header' | 'body', scrollValue: number) => {
        if (source === 'header' && bodyScrollRef.current) {
            bodyScrollRef.current.scrollLeft = scrollValue;
        } else if (source === 'body' && headerScrollRef.current) {
            headerScrollRef.current.scrollLeft = scrollValue;
        }
    }, []);

    // 세로 스크롤 동기화 (왼쪽 패널 <-> 오른쪽 바디)
    const syncVerticalScroll = useCallback((source: 'left' | 'right', scrollValue: number) => {
        if (source === 'left' && bodyScrollRef.current) {
            bodyScrollRef.current.scrollTop = scrollValue;
        } else if (source === 'right' && leftPanelRef.current) {
            leftPanelRef.current.scrollTop = scrollValue;
        }
    }, []);

    // 드래그 시작
    const handleMouseDown = useCallback((e: React.MouseEvent, ref: React.RefObject<HTMLDivElement | null>) => {
        if (!ref.current) return;
        setIsDragging(true);
        setStartX(e.pageX - ref.current.offsetLeft);
        setScrollLeft(ref.current.scrollLeft);
        ref.current.style.cursor = 'grabbing';
    }, []);

    // 드래그 중
    const handleMouseMove = useCallback((e: React.MouseEvent, ref: React.RefObject<HTMLDivElement | null>, source: 'header' | 'body') => {
        if (!isDragging || !ref.current) return;
        e.preventDefault();
        const x = e.pageX - ref.current.offsetLeft;
        const walk = (x - startX) * 1.5; // 스크롤 속도 조절
        const newScrollLeft = scrollLeft - walk;
        ref.current.scrollLeft = newScrollLeft;
        syncHorizontalScroll(source, newScrollLeft);
    }, [isDragging, startX, scrollLeft, syncHorizontalScroll]);

    // 드래그 종료
    const handleMouseUp = useCallback((ref: React.RefObject<HTMLDivElement | null>) => {
        setIsDragging(false);
        if (ref.current) {
            ref.current.style.cursor = 'grab';
        }
    }, []);

    // 마우스가 영역을 벗어났을 때
    const handleMouseLeave = useCallback((ref: React.RefObject<HTMLDivElement | null>) => {
        if (isDragging) {
            setIsDragging(false);
            if (ref.current) {
                ref.current.style.cursor = 'grab';
            }
        }
    }, [isDragging]);

    const toggleExpand = (taskId: string) => {
        setExpandedTasks(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            return next;
        });
    };

    // Store의 tasks를 SpatialTask로 변환하고 날짜가 있는 것만 필터링
    const tasks = useMemo(() => {
        return storeTasks
            .map(convertToSpatialTask)
            .filter(t => t.startDate && t.dueDate);
    }, [storeTasks]);

    // 원본 tasks (subtasks 포함)
    const tasksWithSubtasks = storeTasks.filter(t => t.startDate && t.dueDate);

    const projectName = projects[0] ? `${projects[0].name} 일정` : "프로젝트 일정";

    // Timeline calculations
    const today = new Date();
    const timelineStart = addDays(today, -5);
    const timelineEnd = addDays(today, 30);
    const totalDays = differenceInDays(timelineEnd, timelineStart);
    const days = Array.from({ length: totalDays }, (_, i) => addDays(timelineStart, i));
    const DAY_WIDTH = 60;

    const getBarPosition = (start?: string | Date, end?: string | Date) => {
        if (!start || !end) return { left: 0, width: 0 };
        const startDate = typeof start === 'string' ? new Date(start) : start;
        const endDate = typeof end === 'string' ? new Date(end) : end;
        const effectiveStart = startDate < timelineStart ? timelineStart : startDate;
        const offsetDays = differenceInDays(effectiveStart, timelineStart);
        const durationDays = differenceInDays(endDate, effectiveStart) + 1;
        return {
            left: offsetDays * DAY_WIDTH,
            width: durationDays * DAY_WIDTH
        };
    };

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
                        {/* 범례 (Legend) */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <div className="flex items-center gap-3">
                                <span className="font-medium text-gray-400">상태:</span>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                                    <span>대기</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                                    <span>진행중</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                                    <span>검토</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span>완료</span>
                                </div>
                            </div>
                            <div className="w-px h-4 bg-gray-600" />
                            <div className="flex items-center gap-3">
                                <span className="font-medium text-gray-400">우선순위:</span>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-400" />
                                    <span>낮음</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                                    <span>보통</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                                    <span>높음</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                    <span>긴급</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <MagneticButton
                        variant="secondary"
                        size="md"
                        magneticStrength={0.3}
                    >
                        <Calendar className="w-4 h-4" /> 오늘
                    </MagneticButton>
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
                        {/* Custom Gantt with Subtasks */}
                        <div className="flex flex-col h-full overflow-hidden bg-midnight-800/30 rounded-3xl border border-white/5 backdrop-blur-sm">
                            {/* Timeline Header */}
                            <div className="flex border-b border-white/10 overflow-hidden shrink-0">
                                <div className="w-96 shrink-0 p-4 border-r border-white/10 bg-midnight-900/50 backdrop-blur font-bold text-white">
                                    업무
                                </div>
                                <div
                                    ref={headerScrollRef}
                                    className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar cursor-grab select-none"
                                    onMouseDown={(e) => handleMouseDown(e, headerScrollRef)}
                                    onMouseMove={(e) => handleMouseMove(e, headerScrollRef, 'header')}
                                    onMouseUp={() => handleMouseUp(headerScrollRef)}
                                    onMouseLeave={() => handleMouseLeave(headerScrollRef)}
                                    onScroll={(e) => syncHorizontalScroll('header', e.currentTarget.scrollLeft)}
                                >
                                    <div className="flex" style={{ width: totalDays * DAY_WIDTH }}>
                                        {days.map((day) => (
                                            <div key={day.toISOString()} className="w-[60px] shrink-0 border-r border-white/5 p-2 text-center">
                                                <div className="text-xs text-gray-500">{format(day, 'E')}</div>
                                                <div className={cn("text-sm font-bold",
                                                    format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') ? "text-neon-violet" : "text-gray-300"
                                                )}>
                                                    {format(day, 'd')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Gantt Body */}
                            <div className="flex-1 flex overflow-hidden">
                                {/* 왼쪽 고정 영역 - 업무명 */}
                                <div
                                    ref={leftPanelRef}
                                    className="w-96 shrink-0 overflow-y-auto border-r border-white/10 bg-midnight-900/30"
                                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                    onScroll={(e) => syncVerticalScroll('left', e.currentTarget.scrollTop)}
                                >
                                    {tasksWithSubtasks.map((task) => {
                                        const hasSubtasks = task.subtasks && task.subtasks.length > 0;
                                        const isExpanded = expandedTasks.has(task.id);
                                        const completedSubtasks = task.subtasks?.filter(st => st.status === 'DONE').length || 0;
                                        const totalSubtasks = task.subtasks?.length || 0;

                                        return (
                                            <div key={task.id}>
                                                {/* Main Task Label: [상태] [우선순위] [업무명] [담당자] */}
                                                <div className="h-14 px-2 py-2 border-b border-white/5 flex items-center gap-1.5 group hover:bg-white/5 transition-colors">
                                                    {hasSubtasks ? (
                                                        <button
                                                            onClick={() => toggleExpand(task.id)}
                                                            className="p-0.5 rounded hover:bg-white/10 transition-colors shrink-0"
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                                            ) : (
                                                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <div className="w-5 shrink-0" />
                                                    )}
                                                    {/* 상태 배지 */}
                                                    <span className={cn(
                                                        "px-1.5 py-0.5 rounded text-[9px] font-medium border shrink-0",
                                                        task.status === 'DONE' && "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
                                                        task.status === 'IN_PROGRESS' && "text-blue-400 bg-blue-500/10 border-blue-500/30",
                                                        task.status === 'REVIEW' && "text-amber-400 bg-amber-500/10 border-amber-500/30",
                                                        task.status === 'TODO' && "text-gray-400 bg-gray-500/10 border-gray-500/30"
                                                    )}>
                                                        {task.status === 'DONE' ? '완료' : task.status === 'IN_PROGRESS' ? '진행중' : task.status === 'REVIEW' ? '검토' : '할일'}
                                                    </span>
                                                    {/* 우선순위 배지 */}
                                                    <span className={cn(
                                                        "px-1.5 py-0.5 rounded text-[9px] font-medium border shrink-0",
                                                        task.priority === 'URGENT' && "text-red-400 bg-red-500/10 border-red-500/30",
                                                        task.priority === 'HIGH' && "text-orange-400 bg-orange-500/10 border-orange-500/30",
                                                        task.priority === 'MEDIUM' && "text-blue-400 bg-blue-500/10 border-blue-500/30",
                                                        task.priority === 'LOW' && "text-gray-400 bg-gray-500/10 border-gray-500/30"
                                                    )}>
                                                        {task.priority === 'URGENT' ? '긴급' : task.priority === 'HIGH' ? '높음' : task.priority === 'MEDIUM' ? '보통' : '낮음'}
                                                    </span>
                                                    {/* 업무명 */}
                                                    <span
                                                        className="text-sm text-gray-300 truncate flex-1 min-w-0 cursor-pointer hover:text-white transition-colors"
                                                        onClick={() => openEditTaskModal(task)}
                                                    >
                                                        {task.title}
                                                    </span>
                                                    {/* 담당자 배지 */}
                                                    {task.assignees && task.assignees.length > 0 ? (
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            {task.assignees.slice(0, 2).map((assignee) => (
                                                                <span
                                                                    key={assignee.id}
                                                                    className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30"
                                                                >
                                                                    {assignee.name}
                                                                </span>
                                                            ))}
                                                            {task.assignees.length > 2 && (
                                                                <span className="text-[9px] text-gray-500">+{task.assignees.length - 2}</span>
                                                            )}
                                                        </div>
                                                    ) : task.assignee ? (
                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30 shrink-0">
                                                            {task.assignee.name}
                                                        </span>
                                                    ) : null}
                                                    {/* 하위 업무 카운터 */}
                                                    {hasSubtasks && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-500/20 text-violet-300 shrink-0">
                                                            <GitBranch className="w-3 h-3" />
                                                            {completedSubtasks}/{totalSubtasks}
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openCreateSubtaskModal(task);
                                                        }}
                                                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-violet-500/20 transition-all shrink-0"
                                                        title="하위 업무 추가"
                                                    >
                                                        <Plus className="w-3.5 h-3.5 text-violet-400" />
                                                    </button>
                                                </div>

                                                {/* Subtask Labels */}
                                                <AnimatePresence>
                                                    {isExpanded && task.subtasks?.map((subtask, idx) => (
                                                        <motion.div
                                                            key={subtask.id}
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 48 }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            transition={{ duration: 0.2, delay: idx * 0.05 }}
                                                            className="px-3 py-2 border-b border-white/5 bg-white/[0.02] hover:bg-white/5 transition-colors flex items-center gap-2"
                                                        >
                                                            <div className="w-6" />
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    updateTaskStatus(subtask.id, getNextStatus(subtask.status));
                                                                }}
                                                                className={cn(
                                                                    "w-5 h-5 rounded flex items-center justify-center transition-all hover:scale-110",
                                                                    subtask.status === 'DONE' && "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30",
                                                                    subtask.status === 'IN_PROGRESS' && "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30",
                                                                    subtask.status === 'REVIEW' && "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30",
                                                                    subtask.status === 'TODO' && "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30",
                                                                )}
                                                                title={`상태 변경: ${subtask.status} → ${getNextStatus(subtask.status)}`}
                                                            >
                                                                <StatusIcon status={subtask.status} />
                                                            </button>
                                                            <span
                                                                className={cn(
                                                                    "text-xs truncate flex-1 cursor-pointer hover:text-white transition-colors",
                                                                    subtask.status === 'DONE' ? "text-gray-500 line-through hover:text-gray-300" : "text-gray-400"
                                                                )}
                                                                onClick={() => openEditTaskModal(subtask as ApiTask)}
                                                                title="클릭하여 수정"
                                                            >
                                                                {subtask.title}
                                                            </span>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* 오른쪽 스크롤 영역 - 타임라인 바 */}
                                <div
                                    ref={bodyScrollRef}
                                    className="flex-1 overflow-x-auto overflow-y-auto cursor-grab select-none"
                                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                    onMouseDown={(e) => handleMouseDown(e, bodyScrollRef)}
                                    onMouseMove={(e) => handleMouseMove(e, bodyScrollRef, 'body')}
                                    onMouseUp={() => handleMouseUp(bodyScrollRef)}
                                    onMouseLeave={() => handleMouseLeave(bodyScrollRef)}
                                    onScroll={(e) => {
                                        syncHorizontalScroll('body', e.currentTarget.scrollLeft);
                                        syncVerticalScroll('right', e.currentTarget.scrollTop);
                                    }}
                                >
                                    <div className="relative" style={{ width: totalDays * DAY_WIDTH, minHeight: '100%' }}>
                                        {/* Grid Lines */}
                                        <div className="absolute inset-0 flex">
                                            {days.map((day) => (
                                                <div key={`grid-${day.toISOString()}`} className="w-[60px] shrink-0 border-r border-white/5 h-full" />
                                            ))}
                                        </div>

                                        {/* Current Time Indicator */}
                                        <div
                                            className="absolute top-0 bottom-0 w-0.5 bg-neon-violet z-0 shadow-[0_0_10px_rgba(139,92,246,0.8)]"
                                            style={{ left: differenceInDays(today, timelineStart) * DAY_WIDTH + (DAY_WIDTH / 2) }}
                                        />

                                        {/* Task Bars */}
                                        {tasksWithSubtasks.map((task) => {
                                            const { left, width } = getBarPosition(task.startDate, task.dueDate);
                                            const isExpanded = expandedTasks.has(task.id);
                                            const statusColor = getStatusBarColor(task.status);
                                            const priorityStyle = getPriorityStyle(task.priority);

                                            return (
                                                <div key={task.id}>
                                                    {/* Main Task Bar */}
                                                    <div className="h-14 relative border-b border-white/5">
                                                        {width > 0 && (
                                                            <motion.div
                                                                initial={{ opacity: 0, scaleX: 0 }}
                                                                animate={{ opacity: 1, scaleX: 1 }}
                                                                transition={{ delay: 0.2, type: "spring" }}
                                                                className={cn(
                                                                    "absolute top-2 h-10 rounded-lg cursor-pointer group/bar flex items-center px-3 bg-gradient-to-r hover:brightness-110 transition-all",
                                                                    statusColor,
                                                                    priorityStyle.border,
                                                                    priorityStyle.shadow
                                                                )}
                                                                style={{ left: left + 4, width: width - 8 }}
                                                                onClick={() => openEditTaskModal(task)}
                                                            >
                                                                {/* 우선순위 인디케이터 */}
                                                                <span className={cn(
                                                                    "w-2 h-2 rounded-full mr-2 shrink-0",
                                                                    priorityStyle.indicator
                                                                )} />
                                                                <span className="text-xs font-bold text-white drop-shadow-md truncate">
                                                                    {task.title}
                                                                </span>
                                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-2 rounded bg-black/90 text-xs text-white opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className={cn("w-2 h-2 rounded-full", priorityStyle.indicator)} />
                                                                        <span className="font-medium">{task.priority}</span>
                                                                        <span className="text-gray-400">·</span>
                                                                        <span>{task.status}</span>
                                                                    </div>
                                                                    <div className="text-gray-300">
                                                                        {task.startDate && format(new Date(task.startDate), 'MM/dd')} - {task.dueDate && format(new Date(task.dueDate), 'MM/dd')}
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </div>

                                                    {/* Subtask Bars */}
                                                    <AnimatePresence>
                                                        {isExpanded && task.subtasks?.map((subtask, idx) => {
                                                            const subtaskPos = getBarPosition(subtask.startDate, subtask.dueDate);
                                                            const subtaskStatusColor = getStatusBarColor(subtask.status);
                                                            const subtaskPriorityStyle = getPriorityStyle(subtask.priority);
                                                            return (
                                                                <motion.div
                                                                    key={subtask.id}
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: 48 }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                                                                    className="relative border-b border-white/5 bg-white/[0.02]"
                                                                >
                                                                    {subtaskPos.width > 0 && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, scaleX: 0 }}
                                                                            animate={{ opacity: 1, scaleX: 1 }}
                                                                            className={cn(
                                                                                "absolute top-2 h-7 rounded cursor-pointer group/subbar hover:scale-105 transition-transform",
                                                                                subtaskPriorityStyle.border,
                                                                                subtaskPriorityStyle.shadow
                                                                            )}
                                                                            style={{ left: subtaskPos.left + 4, width: subtaskPos.width - 8 }}
                                                                            onClick={() => openEditTaskModal(subtask as ApiTask)}
                                                                        >
                                                                            <div className={cn(
                                                                                "w-full h-full rounded flex items-center px-2 transition-all bg-gradient-to-r",
                                                                                subtaskStatusColor
                                                                            )}>
                                                                                {/* 우선순위 인디케이터 */}
                                                                                <span className={cn(
                                                                                    "w-1.5 h-1.5 rounded-full mr-1.5 shrink-0",
                                                                                    subtaskPriorityStyle.indicator
                                                                                )} />
                                                                                <span className="text-[10px] text-white/90 truncate font-medium">
                                                                                    {subtask.title}
                                                                                </span>
                                                                            </div>
                                                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1.5 rounded bg-black/90 text-[10px] text-white opacity-0 group-hover/subbar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                                                    <span className={cn("w-1.5 h-1.5 rounded-full", subtaskPriorityStyle.indicator)} />
                                                                                    <span>{subtask.priority}</span>
                                                                                    <span className="text-gray-400">·</span>
                                                                                    <span>{subtask.status}</span>
                                                                                </div>
                                                                                <div className="text-gray-300">
                                                                                    {subtask.startDate && format(new Date(subtask.startDate), 'MM/dd')} - {subtask.dueDate && format(new Date(subtask.dueDate), 'MM/dd')}
                                                                                </div>
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatedSection>
        </motion.div>
    );
}
