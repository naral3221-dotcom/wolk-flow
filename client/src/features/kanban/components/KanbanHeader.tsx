import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronDown, Layers, FolderOpen, Check } from "lucide-react";
import { AnimatedSection, FloatingElement } from "@/presentation/components/effects/AnimatedSection";
import { MagneticButton } from "@/presentation/components/effects/MagneticButton";
import type { Project } from "@/types";

interface KanbanHeaderProps {
    projects: Project[];
    selectedProjectId: string | null;
    showAllProjects: boolean;
    onProjectSelect: (projectId: string | null) => void;
    onShowAllToggle: (showAll: boolean) => void;
    onAddTask: () => void;
    taskCount: number;
}

export function KanbanHeader({
    projects,
    selectedProjectId,
    showAllProjects,
    onProjectSelect,
    onShowAllToggle,
    onAddTask,
    taskCount,
}: KanbanHeaderProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedProject = projects.find(p => p.id === selectedProjectId);
    const displayName = showAllProjects
        ? "전체 프로젝트"
        : selectedProject?.name || "프로젝트 선택";

    // 활성 프로젝트만 필터링
    const activeProjects = projects.filter(p => p.status === 'ACTIVE');

    return (
        <AnimatedSection animation="fadeInDown" className="shrink-0 mb-8">
            <header className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    {/* 프로젝트 선택 드롭다운 */}
                    <div className="relative" ref={dropdownRef}>
                        <motion.button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl
                                       bg-glass-medium backdrop-blur-xl border border-glass-border
                                       hover:border-neon-cyan/50 transition-all duration-300
                                       group min-w-[200px]"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="p-2 rounded-lg bg-neon-cyan/20 text-neon-cyan">
                                {showAllProjects ? (
                                    <Layers className="w-5 h-5" />
                                ) : (
                                    <FolderOpen className="w-5 h-5" />
                                )}
                            </div>
                            <div className="flex-1 text-left">
                                <FloatingElement floatIntensity={2} rotateIntensity={0.5} duration={6}>
                                    <span className="text-lg font-bold text-white block">
                                        {displayName}
                                    </span>
                                </FloatingElement>
                                <span className="text-xs text-gray-400">
                                    {taskCount}개의 업무
                                </span>
                            </div>
                            <motion.div
                                animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-neon-cyan transition-colors" />
                            </motion.div>
                        </motion.button>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute top-full left-0 mt-2 w-full min-w-[280px]
                                               bg-glass-heavy backdrop-blur-xl border border-glass-border
                                               rounded-xl shadow-2xl overflow-hidden z-50"
                                >
                                    {/* 전체 프로젝트 옵션 */}
                                    <motion.button
                                        onClick={() => {
                                            onShowAllToggle(true);
                                            setIsDropdownOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left
                                                   transition-all duration-200
                                                   ${showAllProjects
                                                       ? 'bg-neon-cyan/20 text-neon-cyan'
                                                       : 'text-gray-300 hover:bg-white/5'
                                                   }`}
                                        whileHover={{ x: 4 }}
                                    >
                                        <Layers className="w-5 h-5" />
                                        <span className="flex-1 font-medium">전체 프로젝트</span>
                                        {showAllProjects && <Check className="w-4 h-4" />}
                                    </motion.button>

                                    <div className="border-t border-glass-border" />

                                    {/* 프로젝트 목록 */}
                                    <div className="max-h-[300px] overflow-y-auto py-1">
                                        {activeProjects.length === 0 ? (
                                            <div className="px-4 py-6 text-center text-gray-400">
                                                <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">활성 프로젝트가 없습니다</p>
                                            </div>
                                        ) : (
                                            activeProjects.map((project, index) => (
                                                <motion.button
                                                    key={project.id}
                                                    onClick={() => {
                                                        onShowAllToggle(false);
                                                        onProjectSelect(project.id);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left
                                                               transition-all duration-200
                                                               ${!showAllProjects && selectedProjectId === project.id
                                                                   ? 'bg-neon-violet/20 text-neon-violet'
                                                                   : 'text-gray-300 hover:bg-white/5'
                                                               }`}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    whileHover={{ x: 4 }}
                                                >
                                                    <FolderOpen className="w-5 h-5" />
                                                    <div className="flex-1 min-w-0">
                                                        <span className="font-medium block truncate">
                                                            {project.name}
                                                        </span>
                                                        {project.description && (
                                                            <span className="text-xs text-gray-500 block truncate">
                                                                {project.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-500 shrink-0">
                                                        {project._count?.tasks || 0}개
                                                    </span>
                                                    {!showAllProjects && selectedProjectId === project.id && (
                                                        <Check className="w-4 h-4 shrink-0" />
                                                    )}
                                                </motion.button>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <p className="text-gray-400 text-sm hidden md:block">
                        드래그하여 업무 상태를 변경하세요
                    </p>
                </div>

                <MagneticButton
                    variant="neon"
                    size="md"
                    magneticStrength={0.4}
                    glowColor="#00FFFF"
                    onClick={onAddTask}
                    disabled={!showAllProjects && !selectedProjectId}
                >
                    <Plus className="w-4 h-4" /> 새 업무 추가
                </MagneticButton>
            </header>
        </AnimatedSection>
    );
}
