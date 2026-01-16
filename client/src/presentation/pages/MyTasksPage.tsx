import { motion } from "framer-motion";
import { ClipboardList, RefreshCw } from "lucide-react";
import { SpatialCard } from "../components/ui/SpatialCard";
import { AnimatedSection, FloatingElement } from "../components/effects/AnimatedSection";
import { MagneticButton } from "../components/effects/MagneticButton";
import {
    useMyTasks,
    MyTaskFilters,
    MyTaskStats,
    UrgentTasksSection,
    ProgressOverview,
    EnhancedTaskCard,
    TaskCalendarView,
    TaskTimelineView,
    TaskSearchBar,
    WeeklyChart,
    ViewModeToggle,
    TodayRoutineSection,
} from "@/features/my-tasks";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";

export function MyTasksPage() {
    const { user: member } = useAuthStore();
    const { openEditTaskModal, openCreateRoutineModal } = useUIStore();
    const {
        tasks,
        filteredTasks,
        loading,
        stats,
        filter,
        sort,
        sortDirection,
        searchQuery,
        viewMode,
        todayTasks,
        thisWeekTasks,
        overdueTasks,
        setFilter,
        setSort,
        toggleSortDirection,
        setSearchQuery,
        setViewMode,
        updateTaskStatus,
        quickComplete,
        refetch,
    } = useMyTasks();

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <FloatingElement floatIntensity={15} rotateIntensity={5}>
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 animate-spin rounded-full border-4 border-neon-violet border-t-transparent" />
                        <p className="text-gray-400 animate-pulse">
                            업무를 불러오는 중...
                        </p>
                    </div>
                </FloatingElement>
            </div>
        );
    }

    return (
        <motion.div
            className="p-8 w-full h-full overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <AnimatedSection animation="fadeInDown" className="mb-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <FloatingElement floatIntensity={3} rotateIntensity={1} duration={6}>
                            <motion.h1
                                className="text-4xl font-bold text-white mb-2 tracking-tight flex items-center gap-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <ClipboardList className="w-10 h-10 text-neon-violet" />
                                <span>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-violet to-neon-teal">
                                        {member?.name || "사용자"}
                                    </span>
                                    님의 업무
                                </span>
                            </motion.h1>
                        </FloatingElement>
                        <p className="text-gray-400">
                            총 {stats.total}개의 업무 중 {stats.done}개 완료
                            {stats.overdue > 0 && (
                                <span className="text-red-400 ml-2">
                                    · {stats.overdue}개 지연
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
                        <MagneticButton
                            variant="ghost"
                            size="md"
                            magneticStrength={0.3}
                            onClick={refetch}
                        >
                            <RefreshCw className="w-4 h-4" />
                        </MagneticButton>
                    </div>
                </header>
            </AnimatedSection>

            {/* Today's Routine Section */}
            <AnimatedSection animation="fadeIn" delay={0.03} className="mb-6">
                <TodayRoutineSection onCreateRoutine={() => openCreateRoutineModal()} />
            </AnimatedSection>

            {/* Urgent Tasks Section */}
            <AnimatedSection animation="fadeIn" delay={0.05} className="mb-6">
                <UrgentTasksSection
                    todayTasks={todayTasks}
                    thisWeekTasks={thisWeekTasks}
                    overdueTasks={overdueTasks}
                    onTaskClick={openEditTaskModal}
                />
            </AnimatedSection>

            {/* Progress & Weekly Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <AnimatedSection animation="fadeInLeft" delay={0.1}>
                    <ProgressOverview stats={stats} />
                </AnimatedSection>
                <AnimatedSection animation="fadeInRight" delay={0.15}>
                    <WeeklyChart tasks={tasks} />
                </AnimatedSection>
            </div>

            {/* Stats - 클릭하여 필터링 가능 */}
            <AnimatedSection animation="fadeIn" delay={0.2} className="mb-6">
                <MyTaskStats
                    stats={stats}
                    currentFilter={filter}
                    onFilterChange={setFilter}
                />
            </AnimatedSection>

            {/* Search & Filters */}
            <AnimatedSection animation="fadeIn" delay={0.25} className="mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <TaskSearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                        />
                    </div>
                    <MyTaskFilters
                        filter={filter}
                        sort={sort}
                        sortDirection={sortDirection}
                        onFilterChange={setFilter}
                        onSortChange={setSort}
                        onToggleSortDirection={toggleSortDirection}
                    />
                </div>
            </AnimatedSection>

            {/* Task Views */}
            <AnimatedSection animation="fadeInUp" delay={0.3}>
                {viewMode === "list" && (
                    <SpatialCard className="p-6">
                        {filteredTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16">
                                <FloatingElement floatIntensity={8}>
                                    <ClipboardList className="w-16 h-16 text-gray-600 mb-4" />
                                </FloatingElement>
                                <p className="text-gray-500 text-lg mb-2">
                                    {searchQuery
                                        ? `"${searchQuery}"에 대한 검색 결과가 없습니다`
                                        : filter === "all"
                                            ? "할당된 업무가 없습니다"
                                            : `'${filter === "TODO" ? "예정" : filter === "IN_PROGRESS" ? "진행중" : filter === "REVIEW" ? "검토" : "완료"}' 상태의 업무가 없습니다`}
                                </p>
                                <p className="text-gray-600 text-sm">
                                    {searchQuery
                                        ? "다른 검색어를 입력해보세요"
                                        : "새 업무를 추가하거나 다른 필터를 선택해보세요"}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredTasks.map((task, index) => (
                                    <EnhancedTaskCard
                                        key={task.id}
                                        task={task}
                                        index={index}
                                        onClick={() => openEditTaskModal(task)}
                                        onStatusChange={updateTaskStatus}
                                        onQuickComplete={quickComplete}
                                    />
                                ))}
                            </div>
                        )}
                    </SpatialCard>
                )}

                {viewMode === "calendar" && (
                    <TaskCalendarView
                        tasks={filteredTasks}
                        onTaskClick={openEditTaskModal}
                    />
                )}

                {viewMode === "timeline" && (
                    <TaskTimelineView
                        tasks={filteredTasks}
                        onTaskClick={openEditTaskModal}
                    />
                )}
            </AnimatedSection>
        </motion.div>
    );
}
