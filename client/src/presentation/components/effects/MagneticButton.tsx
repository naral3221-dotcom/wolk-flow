import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useMagneticEffect } from "../../hooks/useMagneticEffect";

interface MagneticButtonProps {
    children: ReactNode;
    onClick?: () => void;
    variant?: "primary" | "secondary" | "ghost" | "neon";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    className?: string;
    magneticStrength?: number;
    glowColor?: string;
}

export function MagneticButton({
    children,
    onClick,
    variant = "primary",
    size = "md",
    disabled = false,
    className = "",
    magneticStrength = 0.3,
    glowColor,
}: MagneticButtonProps) {
    const { ref, x, y, scale, handlers } = useMagneticEffect({
        strength: magneticStrength,
        distance: 150,
    });

    const sizes = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
    };

    const variants = {
        primary: {
            bg: "bg-linear-to-r from-cyan-500 to-blue-500",
            text: "text-white",
            glow: glowColor || "#00FFFF",
            border: "border-transparent",
        },
        secondary: {
            bg: "bg-slate-800/50",
            text: "text-white",
            glow: glowColor || "#E040FB",
            border: "border-white/20",
        },
        ghost: {
            bg: "bg-transparent",
            text: "text-cyan-400",
            glow: glowColor || "#00FFFF",
            border: "border-cyan-400/50",
        },
        neon: {
            bg: "bg-transparent",
            text: "text-cyan-400",
            glow: glowColor || "#00FFFF",
            border: "border-cyan-400",
        },
    };

    const currentVariant = variants[variant];

    return (
        <motion.button
            ref={ref as React.RefObject<HTMLButtonElement>}
            className={`
                relative overflow-hidden rounded-xl font-medium
                ${sizes[size]}
                ${currentVariant.bg}
                ${currentVariant.text}
                border ${currentVariant.border}
                backdrop-blur-sm
                transition-colors duration-300
                disabled:opacity-50 disabled:cursor-not-allowed
                ${className}
            `}
            style={{ x, y, scale }}
            onClick={onClick}
            disabled={disabled}
            whileTap={{ scale: 0.95 }}
            {...handlers}
        >
            {/* Content */}
            <span className="relative z-10 flex items-center gap-2">
                {children}
            </span>

            {/* Hover glow effect */}
            <motion.div
                className="absolute inset-0 opacity-0"
                style={{
                    background: `radial-gradient(circle at center, ${currentVariant.glow}30 0%, transparent 70%)`,
                }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            />

            {/* Neon border glow */}
            {variant === "neon" && (
                <motion.div
                    className="absolute -inset-px rounded-xl opacity-50 -z-10"
                    style={{
                        background: `linear-gradient(135deg, ${currentVariant.glow}, transparent, ${currentVariant.glow})`,
                        filter: "blur(4px)",
                    }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                />
            )}

            {/* Shimmer effect */}
            <motion.div
                className="absolute inset-0 z-0"
                style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                    transform: "translateX(-100%)",
                }}
                whileHover={{
                    transform: "translateX(100%)",
                    transition: { duration: 0.6, ease: "easeInOut" },
                }}
            />
        </motion.button>
    );
}

export function MagneticIconButton({
    children,
    onClick,
    size = 48,
    glowColor = "#00FFFF",
    className = "",
}: {
    children: ReactNode;
    onClick?: () => void;
    size?: number;
    glowColor?: string;
    className?: string;
}) {
    const { ref, x, y, scale, handlers } = useMagneticEffect({
        strength: 0.4,
        distance: 100,
    });

    return (
        <motion.button
            ref={ref as React.RefObject<HTMLButtonElement>}
            className={`
                relative flex items-center justify-center
                rounded-full bg-slate-800/50 backdrop-blur-sm
                border border-white/10
                text-white hover:text-cyan-400
                transition-colors duration-300
                ${className}
            `}
            style={{ width: size, height: size, x, y, scale }}
            onClick={onClick}
            whileTap={{ scale: 0.9 }}
            {...handlers}
        >
            {children}
            <motion.div
                className="absolute inset-0 rounded-full opacity-0 -z-10"
                style={{
                    background: `radial-gradient(circle, ${glowColor}40 0%, transparent 70%)`,
                    filter: "blur(8px)",
                }}
                whileHover={{ opacity: 1, scale: 1.5 }}
                transition={{ duration: 0.3 }}
            />
        </motion.button>
    );
}
