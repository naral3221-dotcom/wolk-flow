import { useMotionValue, useSpring, useTransform } from "framer-motion";
import type { MouseEvent as ReactMouseEvent } from "react";

export function useTilt(stiffness = 150, damping = 15) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [4, -4]), {
        stiffness,
        damping,
    });
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-4, 4]), {
        stiffness,
        damping,
    });

    const onMouseMove = (e: ReactMouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const onMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return { rotateX, rotateY, onMouseMove, onMouseLeave };
}
