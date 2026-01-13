import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState, useMemo, useCallback } from "react";

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
    opacity: number;
    color: string;
    type: "circle" | "star" | "hexagon" | "glow";
}

interface FloatingParticlesProps {
    count?: number;
    interactive?: boolean;
    colorScheme?: "cyan" | "purple" | "mixed" | "rainbow";
    types?: Particle["type"][];
    maxSize?: number;
    speed?: number;
    zIndex?: number;
    depth3D?: boolean;
}

const colorSchemes = {
    cyan: ["#00FFFF", "#00E5FF", "#18FFFF", "#84FFFF"],
    purple: ["#E040FB", "#D500F9", "#AA00FF", "#7C4DFF"],
    mixed: ["#00FFFF", "#E040FB", "#00E5FF", "#D500F9"],
    rainbow: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"],
};

const particleShapes = {
    circle: null,
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    hexagon: "M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z",
    glow: null,
};

export function FloatingParticles({
    count = 50,
    interactive = true,
    colorScheme = "mixed",
    types = ["circle", "glow"],
    maxSize = 6,
    speed = 1,
    zIndex = 0,
    depth3D = true,
}: FloatingParticlesProps) {
    const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });

    // Mouse position for interactive effects - all hooks at top level
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const smoothMouseX = useSpring(mouseX, { stiffness: 50, damping: 20 });
    const smoothMouseY = useSpring(mouseY, { stiffness: 50, damping: 20 });

    // Transform hooks must be called unconditionally at top level
    const glowX1 = useTransform(smoothMouseX, [0, dimensions.width], [-100, 100]);
    const glowY1 = useTransform(smoothMouseY, [0, dimensions.height], [-100, 100]);
    const glowX2 = useTransform(smoothMouseX, [0, dimensions.width], [50, -50]);
    const glowY2 = useTransform(smoothMouseY, [0, dimensions.height], [50, -50]);

    useEffect(() => {
        const updateDimensions = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    useEffect(() => {
        if (!interactive) return;

        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [interactive, mouseX, mouseY]);

    const particles = useMemo<Particle[]>(() => {
        const colors = colorSchemes[colorScheme];
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * maxSize + 2,
            duration: (Math.random() * 20 + 15) / speed,
            delay: Math.random() * -20,
            opacity: Math.random() * 0.5 + 0.1,
            color: colors[Math.floor(Math.random() * colors.length)],
            type: types[Math.floor(Math.random() * types.length)],
        }));
    }, [count, colorScheme, types, maxSize, speed]);

    const renderParticle = useCallback((particle: Particle) => {
        const depthFactor = depth3D ? (particle.size / maxSize) : 1;

        if (particle.type === "glow") {
            return (
                <motion.div
                    key={particle.id}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: particle.size * 3,
                        height: particle.size * 3,
                        background: `radial-gradient(circle, ${particle.color}40 0%, transparent 70%)`,
                        filter: `blur(${particle.size}px)`,
                        zIndex: Math.floor(depthFactor * 10),
                    }}
                    animate={{
                        y: [0, -30 * depthFactor, 0],
                        x: [0, Math.sin(particle.id) * 20 * depthFactor, 0],
                        scale: [1, 1.2, 1],
                        opacity: [particle.opacity, particle.opacity * 1.5, particle.opacity],
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: particle.delay,
                    }}
                />
            );
        }

        if (particle.type === "star" || particle.type === "hexagon") {
            return (
                <motion.svg
                    key={particle.id}
                    className="absolute pointer-events-none"
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: particle.size * 2,
                        height: particle.size * 2,
                        zIndex: Math.floor(depthFactor * 10),
                    }}
                    viewBox="0 0 24 24"
                    animate={{
                        y: [0, -40 * depthFactor, 0],
                        x: [0, Math.cos(particle.id) * 15 * depthFactor, 0],
                        rotate: [0, 360],
                        opacity: [particle.opacity, particle.opacity * 1.3, particle.opacity],
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: particle.delay,
                    }}
                >
                    <path
                        d={particleShapes[particle.type]!}
                        fill={particle.color}
                        fillOpacity={particle.opacity}
                    />
                </motion.svg>
            );
        }

        return (
            <motion.div
                key={particle.id}
                className="absolute rounded-full pointer-events-none"
                style={{
                    left: `${particle.x}%`,
                    top: `${particle.y}%`,
                    width: particle.size,
                    height: particle.size,
                    backgroundColor: particle.color,
                    boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
                    zIndex: Math.floor(depthFactor * 10),
                }}
                animate={{
                    y: [0, -50 * depthFactor, 0],
                    x: [0, Math.sin(particle.id * 0.5) * 25 * depthFactor, 0],
                    scale: [1, 1.1, 1],
                    opacity: [particle.opacity, particle.opacity * 1.2, particle.opacity],
                }}
                transition={{
                    duration: particle.duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: particle.delay,
                }}
            />
        );
    }, [depth3D, maxSize]);

    return (
        <div
            className="fixed inset-0 overflow-hidden pointer-events-none"
            style={{ zIndex }}
        >
            {/* Ambient glow layers */}
            <motion.div
                className="absolute w-[600px] h-[600px] rounded-full opacity-20"
                style={{
                    background: "radial-gradient(circle, #00FFFF20 0%, transparent 70%)",
                    filter: "blur(100px)",
                    x: glowX1,
                    y: glowY1,
                    left: "20%",
                    top: "30%",
                }}
            />
            <motion.div
                className="absolute w-[500px] h-[500px] rounded-full opacity-15"
                style={{
                    background: "radial-gradient(circle, #E040FB20 0%, transparent 70%)",
                    filter: "blur(80px)",
                    x: glowX2,
                    y: glowY2,
                    right: "10%",
                    bottom: "20%",
                }}
            />

            {/* Floating particles */}
            {particles.map(renderParticle)}

            {/* Grid overlay for depth */}
            {depth3D && (
                <div
                    className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
                        `,
                        backgroundSize: "50px 50px",
                    }}
                />
            )}
        </div>
    );
}

export function ParticleField({
    density = "medium",
}: {
    density?: "low" | "medium" | "high";
}) {
    const counts = { low: 30, medium: 60, high: 100 };

    return (
        <FloatingParticles
            count={counts[density]}
            interactive={true}
            colorScheme="mixed"
            types={["circle", "glow", "star"]}
            maxSize={8}
            speed={0.8}
            depth3D={true}
        />
    );
}
