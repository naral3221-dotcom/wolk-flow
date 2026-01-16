import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, FolderTree, Calendar } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { AnimatedSection } from "../components/effects/AnimatedSection";
import { MagneticButton } from "../components/effects/MagneticButton";
import {
    useProjects,
    ProjectHeader,
    ProjectStats,
    ProjectEmptyState,
    ProjectLoading,
    ProjectTreeView,
    ProjectTimelineView,
} from "@/features/projects";
import { cn } from "@/core/utils/cn";
import { RoutineStatusBar } from "@/presentation/components/ui/RoutineStatusBar";

type ViewMode = 'tree' | 'timeline';

export function ProjectsPage() {
    const { openCreateProjectModal, openEditTaskModal, openProjectProgressModal } = useUIStore();
    const { projects, loading, stats } = useProjects();
    const [viewMode, setViewMode] = useState<ViewMode>('tree');

    if (loading) {
        return <ProjectLoading />;
    }

    return (
        <motion.div
            className="p-8 w-full h-full overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <ProjectHeader />

            <ProjectStats
                total={stats.total}
                active={stats.active}
                totalTasks={stats.totalTasks}
            />

            {/* 루틴 현황 바 */}
            <RoutineStatusBar />

            {/* Action Bar with View Toggle */}
            <AnimatedSection animation="fadeIn" delay={0.2} className="mb-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <p className="text-gray-400 font-medium">
                            프로젝트 목록 ({projects.length}개)
                        </p>

                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-midnight-800/50 rounded-xl p-1 border border-white/10">
                            <button
                                onClick={() => setViewMode('tree')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                    viewMode === 'tree'
                                        ? "bg-gradient-to-r from-neon-violet/30 to-neon-teal/30 text-white shadow-lg"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <FolderTree className="w-4 h-4" />
                                트리뷰
                            </button>
                            <button
                                onClick={() => setViewMode('timeline')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                    viewMode === 'timeline'
                                        ? "bg-gradient-to-r from-neon-violet/30 to-neon-teal/30 text-white shadow-lg"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <Calendar className="w-4 h-4" />
                                타임라인
                            </button>
                        </div>
                    </div>

                    <MagneticButton
                        variant="neon"
                        size="md"
                        magneticStrength={0.4}
                        glowColor="#E040FB"
                        onClick={openCreateProjectModal}
                    >
                        <Plus className="w-4 h-4" /> 새 프로젝트
                    </MagneticButton>
                </div>
            </AnimatedSection>

            {/* Content */}
            <AnimatedSection animation="fadeInUp" delay={0.3}>
                {projects.length === 0 ? (
                    <ProjectEmptyState onCreateProject={openCreateProjectModal} />
                ) : viewMode === 'tree' ? (
                    <ProjectTreeView
                        projects={projects}
                        onProjectClick={(project) => openProjectProgressModal(project)}
                        onTaskClick={(task) => openEditTaskModal(task)}
                    />
                ) : (
                    <ProjectTimelineView
                        projects={projects}
                        onProjectClick={(project) => openProjectProgressModal(project)}
                    />
                )}
            </AnimatedSection>
        </motion.div>
    );
}
