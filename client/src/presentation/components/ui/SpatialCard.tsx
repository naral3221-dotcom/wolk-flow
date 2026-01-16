import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/core/utils/cn";
import { useTilt } from "./useTilt";

interface SpatialCardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    hoverEffect?: boolean;
}

export function SpatialCard({ children, className, onClick, hoverEffect = true }: SpatialCardProps) {
    // 3D tilt 효과 비활성화 (텍스트 흐림 방지)
    const { onMouseMove, onMouseLeave } = useTilt();

    return (
        <motion.div
            className={cn(
                "relative rounded-2xl bg-midnight-700/40 backdrop-blur-xl border border-white/10 overflow-hidden",
                "shadow-lg shadow-black/20 group cursor-default",
                hoverEffect && "cursor-pointer hover:shadow-neon-violet/20",
                className
            )}
            onMouseMove={hoverEffect ? onMouseMove : undefined}
            onMouseLeave={hoverEffect ? onMouseLeave : undefined}
            onClick={onClick}
            whileHover={hoverEffect ? { scale: 1.01 } : undefined}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            {/* Glossy Reflection Gradient */}
            <div
                className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            />

            {/* Content Layer */}
            <div className="relative z-10">
                {children}
            </div>

            {/* Border Glow */}
            <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10 group-hover:ring-neon-violet/50 transition-all duration-300 pointer-events-none" />
        </motion.div>
    );
}
