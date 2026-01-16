import { motion } from "framer-motion";
import { FolderKanban, Plus } from "lucide-react";
import { FloatingElement } from "@/presentation/components/effects/AnimatedSection";
import { MagneticButton } from "@/presentation/components/effects/MagneticButton";
import { SpatialCard } from "@/presentation/components/ui/SpatialCard";

interface ProjectEmptyStateProps {
    onCreateProject: () => void;
}

export function ProjectEmptyState({ onCreateProject }: ProjectEmptyStateProps) {
    return (
        <SpatialCard className="py-16 text-center">
            <FloatingElement floatIntensity={10}>
                <motion.div
                    className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                >
                    <FolderKanban className="h-10 w-10 text-gray-500" />
                </motion.div>
            </FloatingElement>
            <p className="text-gray-400 mb-2 font-medium">프로젝트가 없습니다</p>
            <p className="text-sm text-gray-500 mb-6">첫 프로젝트를 생성하여 시작하세요</p>
            <MagneticButton
                variant="neon"
                size="md"
                magneticStrength={0.4}
                glowColor="#E040FB"
                onClick={onCreateProject}
            >
                <Plus className="w-4 h-4" /> 첫 프로젝트 만들기
            </MagneticButton>
        </SpatialCard>
    );
}
