import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { FloatingParticles } from "../effects/FloatingParticles";
import { QuickAddButton } from "../ui/QuickAddButton";
import { useSettingsStore } from "@/stores/settingsStore";
import { useEmptyContextMenu } from "../context-menu";

interface AppShellProps {
    children?: ReactNode;
    showParticles?: boolean;
}

export function AppShell({ children, showParticles = true }: AppShellProps) {
    const { appearance, effectiveTheme } = useSettingsStore();
    const shouldShowParticles = showParticles && appearance.particleEffects;
    const { handleContextMenu } = useEmptyContextMenu();

    return (
        <div
            className={`relative w-screen h-screen overflow-hidden perspective-deep text-foreground ${
                effectiveTheme === 'light' ? 'bg-gray-50' : 'bg-midnight-900'
            }`}
            onContextMenu={handleContextMenu}
        >
            {/* Floating Particles Background */}
            {shouldShowParticles && (
                <FloatingParticles
                    count={40}
                    colorScheme="mixed"
                    types={["circle", "glow"]}
                    maxSize={5}
                    speed={0.7}
                    interactive={true}
                    depth3D={true}
                    zIndex={1}
                />
            )}

            {/* Ambient Background Glow */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-neon-violet/20 blur-[120px] rounded-full pointer-events-none opacity-40 animate-pulse-slow" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-neon-teal/20 blur-[120px] rounded-full pointer-events-none opacity-40 animate-pulse-slow" />

            {/* Main Content Area in 3D Space */}
            <div className="relative w-full h-full flex transform-style-3d z-10">
                {children || <Outlet />}
            </div>

            {/* Quick Add FAB Button */}
            <QuickAddButton />
        </div>
    );
}
