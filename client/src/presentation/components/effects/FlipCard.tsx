import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useState, type ReactNode } from "react";

interface FlipCardProps {
    front: ReactNode;
    back: ReactNode;
    width?: number | string;
    height?: number | string;
    direction?: "horizontal" | "vertical";
    flipOnHover?: boolean;
    enableTilt?: boolean;
    className?: string;
    duration?: number;
}

export function FlipCard({
    front,
    back,
    width = "100%",
    height = 200,
    direction = "horizontal",
    flipOnHover = false,
    enableTilt = true,
    className = "",
    duration = 0.6,
}: FlipCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // tilt 효과 약하게 조정 (텍스트 흐림 방지)
    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [3, -3]), {
        stiffness: 150,
        damping: 15,
    });
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-3, 3]), {
        stiffness: 150,
        damping: 15,
    });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!enableTilt) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const xPct = (e.clientX - rect.left) / rect.width - 0.5;
        const yPct = (e.clientY - rect.top) / rect.height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const flipRotation = direction === "horizontal"
        ? { rotateY: isFlipped ? 180 : 0 }
        : { rotateX: isFlipped ? 180 : 0 };

    const backRotation = direction === "horizontal"
        ? { rotateY: 180 }
        : { rotateX: 180 };

    return (
        <motion.div
            className={`relative cursor-pointer ${className}`}
            style={{ width, height, perspective: 1000 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={() => flipOnHover && setIsFlipped(true)}
            onClick={() => !flipOnHover && setIsFlipped(!isFlipped)}
        >
            <motion.div
                className="relative w-full h-full"
                style={{
                    transformStyle: "preserve-3d",
                    rotateX: enableTilt ? rotateX : 0,
                    rotateY: enableTilt ? rotateY : 0,
                }}
                onMouseLeave={() => flipOnHover && setIsFlipped(false)}
            >
                <motion.div
                    className="absolute inset-0 w-full h-full"
                    style={{ transformStyle: "preserve-3d" }}
                    animate={flipRotation}
                    transition={{ type: "spring", stiffness: 100, damping: 20, duration }}
                >
                    <div
                        className="absolute inset-0 w-full h-full rounded-xl overflow-hidden"
                        style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                    >
                        {front}
                    </div>
                    <motion.div
                        className="absolute inset-0 w-full h-full rounded-xl overflow-hidden"
                        style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", ...backRotation }}
                    >
                        {back}
                    </motion.div>
                </motion.div>
            </motion.div>
            <motion.div
                className="absolute -inset-1 rounded-xl opacity-0 -z-10"
                style={{ background: "linear-gradient(135deg, #00FFFF40, #E040FB40)", filter: "blur(20px)" }}
                whileHover={{ opacity: 0.6 }}
                transition={{ duration: 0.3 }}
            />
        </motion.div>
    );
}

export function FlipCardFace({
    children,
    className = "",
    gradient = "from-slate-800/90 to-slate-900/90",
}: {
    children: ReactNode;
    className?: string;
    gradient?: string;
}) {
    return (
        <div className={`w-full h-full p-6 bg-linear-to-br ${gradient} backdrop-blur-xl border border-white/10 flex flex-col items-center justify-center ${className}`}>
            {children}
        </div>
    );
}
