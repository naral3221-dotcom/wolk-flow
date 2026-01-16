import { motion } from "framer-motion";
import { useMemo } from "react";
import { FloatingElement } from "../components/effects/AnimatedSection";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import {
    useDashboard,
    DashboardHeader,
    StatsCards,
    ProjectStatsCards,
    ProjectTreeView,
    TeamProgress,
    ActivityFeed,
    WELCOME_MESSAGES,
} from "@/features/dashboard";

export function Dashboard() {
    const { user: member } = useAuthStore();
    const { openEditTaskModal } = useUIStore();
    const { data, loading } = useDashboard();
    const { stats, projectStats, projects, allTasks, memberProgress, activities } = data;

    const welcomeMessage = useMemo(() => {
        return WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
    }, []);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <FloatingElement floatIntensity={15} rotateIntensity={5}>
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 animate-spin rounded-full border-4 border-neon-violet border-t-transparent" />
                        <p className="text-gray-400 animate-pulse">3D 공간을 준비하는 중...</p>
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
            {/* Header with 3D floating effect */}
            <DashboardHeader
                userName={member?.name || "사용자"}
                welcomeMessage={welcomeMessage}
            />

            {/* Project Stats Cards */}
            <ProjectStatsCards stats={projectStats} />

            {/* Task Stats Cards */}
            <StatsCards stats={stats} />

            {/* Main Content Grid - 프로젝트 트리뷰 & 최근 활동 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                {/* Project Tree View - 프로젝트별 업무 트리뷰 (2칸) */}
                <div className="lg:col-span-2">
                    <ProjectTreeView
                        projects={projects}
                        tasks={allTasks}
                        onTaskClick={openEditTaskModal}
                    />
                </div>

                {/* Recent Activity - 사이드바 (1칸) */}
                <div className="lg:col-span-1">
                    <ActivityFeed activities={activities} />
                </div>
            </div>

            {/* Team Progress - 멤버별 업무 현황 (하단으로 이동) */}
            <TeamProgress members={memberProgress} onTaskClick={openEditTaskModal} />
        </motion.div>
    );
}
