import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/core/utils/cn";

interface NeonButtonProps extends HTMLMotionProps<"button"> {
    children: ReactNode;
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    glow?: boolean;
}

export function NeonButton({
    children,
    className,
    variant = "primary",
    size = "md",
    glow = true,
    ...props
}: NeonButtonProps) {

    const variants = {
        primary: "bg-linear-to-r from-neon-violet to-indigo-600 text-white border-transparent hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]",
        secondary: "bg-midnight-800 text-white border-white/10 hover:bg-midnight-700",
        ghost: "bg-transparent text-gray-300 hover:text-white hover:bg-white/5",
        danger: "bg-linear-to-r from-red-500 to-pink-600 text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-8 py-3 text-base font-medium"
    };

    return (
        <motion.button
            className={cn(
                "relative rounded-xl border flex items-center justify-center transition-all duration-300",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                variants[variant],
                sizes[size],
                className
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            {...props}
        >
            {/* Inner Glow for Primary */}
            {glow && variant === 'primary' && (
                <div className="absolute inset-0 rounded-xl bg-neon-violet/20 blur-md -z-10 group-hover:blur-lg transition-all" />
            )}
            <span className="relative z-10 flex items-center gap-2 font-semibold tracking-wide">
                {children}
            </span>
        </motion.button>
    );
}
