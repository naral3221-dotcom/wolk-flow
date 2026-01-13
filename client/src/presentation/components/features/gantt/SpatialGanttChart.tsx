import { useRef } from "react";
import { motion } from "framer-motion";
import type { Task } from "@/domain/entities/Task";
import { SpatialCard } from "../../ui/SpatialCard";
import { cn } from "@/core/utils/cn";
// @ts-ignore
import { addDays, format, differenceInDays } from "date-fns";

interface SpatialGanttChartProps {
    tasks: Task[];
}

export function SpatialGanttChart({ tasks }: SpatialGanttChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Generate Timeline Data (Next 30 Days)
    const today = new Date();
    const timelineStart = addDays(today, -5);
    const timelineEnd = addDays(today, 30);
    const totalDays = differenceInDays(timelineEnd, timelineStart);

    const days = Array.from({ length: totalDays }, (_, i) => addDays(timelineStart, i));
    const DAY_WIDTH = 60; // px per day

    // Calculate Bar Position
    const getBarPosition = (start?: Date, end?: Date) => {
        if (!start || !end) return { left: 0, width: 0 };

        // Simple clamp for demo
        const effectiveStart = start < timelineStart ? timelineStart : start;
        const offsetDays = differenceInDays(effectiveStart, timelineStart);
        const durationDays = differenceInDays(end, effectiveStart) + 1; // Include end day

        return {
            left: offsetDays * DAY_WIDTH,
            width: durationDays * DAY_WIDTH
        };
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-midnight-800/30 rounded-3xl border border-white/5 backdrop-blur-sm">
            {/* Timeline Header */}
            <div className="flex border-b border-white/10 overflow-hidden shrink-0">
                <div className="w-60 shrink-0 p-4 border-r border-white/10 bg-midnight-900/50 backdrop-blur font-bold text-white">
                    업무명
                </div>
                <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar" ref={containerRef}>
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
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
                <div className="flex flex-col relative">
                    {/* Grid Lines Background */}
                    <div className="absolute inset-0 flex left-60" style={{ width: totalDays * DAY_WIDTH, height: '100%' }}>
                        {days.map((day) => (
                            <div key={`grid-${day.toISOString()}`} className="w-[60px] shrink-0 border-r border-white/5 h-full" />
                        ))}
                        {/* Current Time Indicator */}
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-neon-violet z-10 shadow-[0_0_10px_rgba(139,92,246,0.8)]"
                            style={{ left: differenceInDays(today, timelineStart) * DAY_WIDTH + (DAY_WIDTH / 2) }}
                        />
                    </div>

                    {/* Task Rows */}
                    {tasks.map((task) => {
                        const { left, width } = getBarPosition(task.startDate, task.dueDate);

                        return (
                            <div key={task.id} className="flex h-16 border-b border-white/5 group hover:bg-white/5 transition-colors relative">
                                {/* Task Label */}
                                <div className="w-60 shrink-0 p-4 border-r border-white/10 flex items-center gap-2 z-20 bg-inherit">
                                    <span className={cn(
                                        "w-2 h-2 rounded-full",
                                        task.status === 'done' ? "bg-neon-teal" : "bg-neon-violet"
                                    )} />
                                    <span className="text-sm text-gray-300 truncate">{task.title}</span>
                                </div>

                                {/* Task Bar Area */}
                                <div className="flex-1 relative overflow-visible">
                                    {width > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, scaleX: 0 }}
                                            animate={{ opacity: 1, scaleX: 1 }}
                                            transition={{ delay: 0.2, type: "spring" }}
                                            className="absolute top-3 h-10 rounded-lg cursor-pointer group/bar"
                                            style={{ left: left + 20, width: width - 10 }} // Adjusting padding
                                        >
                                            <SpatialCard
                                                className={cn(
                                                    "w-full h-full flex items-center px-3 border-0",
                                                    task.status === 'done'
                                                        ? "bg-linear-to-r from-teal-500/80 to-emerald-500/80 shadow-teal-500/20"
                                                        : "bg-linear-to-r from-violet-600/80 to-indigo-600/80 shadow-violet-500/20"
                                                )}
                                                hoverEffect={true}
                                            >
                                                <span className="text-xs font-bold text-white drop-shadow-md truncate">
                                                    {task.title}
                                                </span>
                                            </SpatialCard>

                                            {/* Tooltip on Hover */}
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 rounded bg-black/80 text-xs text-white opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                                {format(task.startDate!, 'MM/dd')} - {format(task.dueDate!, 'MM/dd')}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
