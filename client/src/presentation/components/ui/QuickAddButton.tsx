import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FolderPlus, ClipboardPlus, X } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";

export function QuickAddButton() {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { openCreateProjectModal, openCreateTaskModal } = useUIStore();

    // 외부 클릭 시 메뉴 닫기
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    // ESC 키로 닫기
    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
        }
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen]);

    const handleCreateProject = () => {
        openCreateProjectModal();
        setIsOpen(false);
    };

    const handleCreateTask = () => {
        openCreateTaskModal();
        setIsOpen(false);
    };

    const menuItems = [
        {
            icon: FolderPlus,
            label: "새 프로젝트",
            description: "새로운 프로젝트를 시작합니다",
            onClick: handleCreateProject,
            color: "from-violet-500 to-purple-600",
            iconColor: "text-violet-400",
        },
        {
            icon: ClipboardPlus,
            label: "새 업무",
            description: "새로운 업무를 추가합니다",
            onClick: handleCreateTask,
            color: "from-teal-500 to-cyan-600",
            iconColor: "text-teal-400",
        },
    ];

    return (
        <div ref={menuRef} className="fixed bottom-8 right-8 z-50">
            {/* 메뉴 */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="absolute bottom-20 right-0 w-64 space-y-2"
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        {menuItems.map((item, index) => (
                            <motion.button
                                key={item.label}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-800/90 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all group"
                                onClick={item.onClick}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.02, x: -5 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div
                                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}
                                >
                                    <item.icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="text-white font-medium group-hover:text-neon-violet transition-colors">
                                        {item.label}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {item.description}
                                    </p>
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FAB 버튼 */}
            <motion.button
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all ${
                    isOpen
                        ? "bg-slate-700 shadow-slate-900/50"
                        : "bg-gradient-to-br from-neon-violet to-purple-600 shadow-neon-violet/30"
                }`}
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                    rotate: isOpen ? 45 : 0,
                    boxShadow: isOpen
                        ? "0 10px 40px rgba(0,0,0,0.3)"
                        : "0 10px 40px rgba(224, 64, 251, 0.4)",
                }}
                transition={{ type: "spring", damping: 20 }}
            >
                {isOpen ? (
                    <X className="w-7 h-7 text-white" />
                ) : (
                    <Plus className="w-7 h-7 text-white" />
                )}
            </motion.button>

            {/* 버튼 Glow 효과 */}
            {!isOpen && (
                <motion.div
                    className="absolute inset-0 rounded-full bg-neon-violet/20 blur-xl -z-10"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.3, 0.5],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            )}
        </div>
    );
}
