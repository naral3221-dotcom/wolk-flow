import { motion } from "framer-motion";
import { SpatialCard } from "../ui/SpatialCard";
import { ClipboardList, Home, Layout, Kanban, Settings, Users, LogOut, Shield } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/core/utils/cn";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/services/api";

const NAV_ITEMS = [
    { icon: Home, label: "대시보드", path: "/" },
    { icon: ClipboardList, label: "내 업무", path: "/my-tasks" },
    { icon: Kanban, label: "칸반 보드", path: "/tasks" },
    { icon: Layout, label: "프로젝트", path: "/projects" },
    { icon: Users, label: "팀", path: "/team" },
    { icon: Settings, label: "설정", path: "/settings" },
];

const ADMIN_NAV_ITEMS = [
    { icon: Shield, label: "사용자 관리", path: "/admin" },
];

export function LevitatingSidebar() {
    const { user, logout, isAdmin } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch {
            // 로그아웃 API 실패해도 로컬 상태는 클리어
        }
        logout();
        navigate('/login');
    };

    return (
        <motion.aside
            className="w-20 lg:w-64 h-[96%] my-auto ml-4 z-50"
            initial={{ x: -100, opacity: 0, rotateY: 15 }}
            animate={{ x: 0, opacity: 1, rotateY: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
        >
            <SpatialCard className="h-full flex flex-col items-center lg:items-start py-8 px-4" hoverEffect={false}>
                {/* Logo Area */}
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-neon-violet to-indigo-600 shadow-[0_0_15px_rgba(139,92,246,0.5)] flex items-center justify-center text-white font-bold text-xl">
                        W
                    </div>
                    <span className="hidden lg:block text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-gray-400">
                        WolkFlow
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 w-full space-y-2">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => cn(
                                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative group overflow-hidden",
                                isActive
                                    ? "text-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={cn("w-6 h-6 transition-transform group-hover:scale-110", isActive && "text-neon-violet drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]")} />
                                    <span className="hidden lg:block font-medium">{item.label}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNav"
                                            className="absolute left-0 w-1 h-6 bg-neon-violet rounded-r-full blur-[2px]"
                                        />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}

                    {/* Admin Menu - 관리자에게만 표시 */}
                    {isAdmin() && (
                        <>
                            <div className="pt-4 pb-2">
                                <div className="border-t border-white/10" />
                                <p className="hidden lg:block text-xs text-gray-500 mt-4 px-4">관리자</p>
                            </div>
                            {ADMIN_NAV_ITEMS.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative group overflow-hidden",
                                        isActive
                                            ? "text-white bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                                            : "text-amber-500/70 hover:text-amber-400 hover:bg-amber-500/5"
                                    )}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <item.icon className={cn("w-6 h-6 transition-transform group-hover:scale-110", isActive && "text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]")} />
                                            <span className="hidden lg:block font-medium">{item.label}</span>
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeNavAdmin"
                                                    className="absolute left-0 w-1 h-6 bg-amber-400 rounded-r-full blur-[2px]"
                                                />
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </>
                    )}
                </nav>

                {/* Bottom Profile */}
                <div className="mt-auto pt-6 border-t border-white/10 w-full space-y-3">
                    <div className="flex items-center gap-3 px-2 cursor-pointer hover:bg-white/5 rounded-xl transition-colors py-2">
                        <div className="w-10 h-10 rounded-full bg-linear-to-tr from-purple-500 to-indigo-500 border border-white/20 flex items-center justify-center text-white font-bold">
                            {user?.name?.charAt(0) || 'G'}
                        </div>
                        <div className="hidden lg:block flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-white truncate">{user?.name || '게스트'}</p>
                                {isAdmin() && (
                                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-400">
                                        관리자
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{user?.department || user?.email || '-'}</p>
                        </div>
                    </div>

                    {user && (
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-4 px-4 py-2 w-full rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="hidden lg:block text-sm font-medium">로그아웃</span>
                        </button>
                    )}
                </div>
            </SpatialCard>
        </motion.aside>
    );
}
