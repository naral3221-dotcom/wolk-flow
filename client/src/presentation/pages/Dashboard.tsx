import { motion } from "framer-motion";
import { SpatialCard } from "../components/ui/SpatialCard";
import { Activity, CheckCircle, Clock, Plus, Zap, AlertTriangle, Users, TrendingUp } from "lucide-react";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { getRelativeTime } from "@/lib/utils";
import { FlipCard, FlipCardFace } from "../components/effects/FlipCard";
import { AnimatedSection, FloatingElement } from "../components/effects/AnimatedSection";
import { MagneticButton } from "../components/effects/MagneticButton";

export function Dashboard() {
    const { member } = useAuthStore();
    const { openCreateProjectModal, openEditTaskModal } = useUIStore();
    const { data, loading } = useDashboard();
    const { stats, myTasks, teamProgress, activities } = data;

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <FloatingElement floatIntensity={15} rotateIntensity={5}>
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 animate-spin rounded-full border-4 border-neon-violet border-t-transparent" />
                        <p className="text-gray-400 animate-pulse">3D 공간을 준비하는 중...</p>
                    </div>
                </FloatingElement>
            </div>
        );
    }

    const statCards = [
        {
            icon: Clock,
            label: "대기",
            value: stats?.todo || 0,
            description: "대기 중인 업무",
            color: "neon-violet",
            gradient: "from-neon-violet/20 to-purple-600/10",
            backInfo: "이번 주 새로 추가된 업무",
        },
        {
            icon: Zap,
            label: "진행",
            value: stats?.inProgress || 0,
            description: "진행 중인 업무",
            color: "blue-400",
            gradient: "from-blue-500/20 to-cyan-500/10",
            backInfo: "현재 활발히 진행 중",
        },
        {
            icon: CheckCircle,
            label: "완료",
            value: stats?.done || 0,
            description: "완료된 업무",
            color: "neon-teal",
            gradient: "from-neon-teal/20 to-emerald-500/10",
            backInfo: "이번 주 완료한 업무",
        },
        {
            icon: AlertTriangle,
            label: "지연",
            value: stats?.overdue || 0,
            description: "지연된 업무",
            color: "red-400",
            gradient: "from-red-500/20 to-orange-500/10",
            backInfo: "주의가 필요한 업무",
        },
    ];

    return (
        <motion.div
            className="p-8 w-full h-full overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header with 3D floating effect */}
            <AnimatedSection animation="fadeInDown" className="mb-10">
                <header className="flex justify-between items-end">
                    <div>
                        <FloatingElement floatIntensity={3} rotateIntensity={1} duration={6}>
                            <motion.h1
                                className="text-4xl font-bold text-white mb-2 tracking-tight"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                안녕하세요, <span className="text-transparent bg-clip-text bg-linear-to-r from-neon-violet to-neon-teal">{member?.name || '사용자'}님</span>
                            </motion.h1>
                        </FloatingElement>
                        <p className="text-gray-400">오늘도 즐거운 3D 작업 공간이 준비되었습니다.</p>
                    </div>
                    <MagneticButton
                        variant="neon"
                        size="lg"
                        magneticStrength={0.4}
                        glowColor="#E040FB"
                        onClick={openCreateProjectModal}
                    >
                        <Plus className="w-5 h-5" /> 새 프로젝트
                    </MagneticButton>
                </header>
            </AnimatedSection>

            {/* Stats Cards - FlipCard with 3D effect */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((card, index) => (
                    <AnimatedSection
                        key={card.label}
                        animation="scaleIn"
                        delay={index * 0.1}
                    >
                        <FlipCard
                            height={160}
                            flipOnHover
                            enableTilt
                            front={
                                <FlipCardFace gradient={card.gradient}>
                                    <div className="w-full h-full flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <div className={`p-3 bg-${card.color}/20 rounded-xl`}>
                                                <card.icon className={`w-6 h-6 text-${card.color}`} />
                                            </div>
                                            <span className={`text-xs font-mono text-${card.color} bg-${card.color}/10 px-2 py-1 rounded`}>
                                                {card.label}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-bold text-white mb-1">{card.value}개</h3>
                                            <p className="text-gray-400 text-sm">{card.description}</p>
                                        </div>
                                    </div>
                                </FlipCardFace>
                            }
                            back={
                                <FlipCardFace gradient="from-slate-900/95 to-slate-800/95">
                                    <div className="text-center">
                                        <TrendingUp className={`w-8 h-8 text-${card.color} mx-auto mb-3`} />
                                        <p className="text-white font-medium mb-2">{card.backInfo}</p>
                                        <div className={`text-2xl font-bold text-${card.color}`}>
                                            {card.value}개
                                        </div>
                                    </div>
                                </FlipCardFace>
                            }
                        />
                    </AnimatedSection>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* My Tasks */}
                <AnimatedSection animation="fadeInLeft" delay={0.2} className="lg:col-span-2">
                    <SpatialCard className="p-6 h-full">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <FloatingElement floatIntensity={2} duration={3}>
                                <Clock className="w-5 h-5 text-neon-violet" />
                            </FloatingElement>
                            내 업무
                            <span className="ml-2 text-sm font-normal text-gray-400">{myTasks.length}개</span>
                        </h3>
                        {myTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <FloatingElement floatIntensity={8}>
                                    <CheckCircle className="w-12 h-12 text-gray-600 mb-4" />
                                </FloatingElement>
                                <p className="text-gray-500">할당된 업무가 없습니다</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myTasks.slice(0, 5).map((task, i) => (
                                    <motion.div
                                        key={task.id}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                                        initial={{ opacity: 0, x: -20, rotateY: -10 }}
                                        animate={{ opacity: 1, x: 0, rotateY: 0 }}
                                        transition={{ delay: i * 0.08, type: "spring", stiffness: 100 }}
                                        whileHover={{
                                            scale: 1.02,
                                            x: 10,
                                            boxShadow: "0 0 20px rgba(0, 255, 255, 0.1)",
                                        }}
                                        style={{ transformStyle: "preserve-3d" }}
                                        onClick={() => openEditTaskModal(task)}
                                    >
                                        <motion.div
                                            className={`w-3 h-3 rounded-full ${
                                                task.priority === 'URGENT' ? 'bg-red-500' :
                                                task.priority === 'HIGH' ? 'bg-orange-500' :
                                                task.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-gray-500'
                                            }`}
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium truncate group-hover:text-neon-violet transition-colors">
                                                {task.title}
                                            </p>
                                            <p className="text-sm text-gray-500">{task.project?.name}</p>
                                        </div>
                                        <motion.span
                                            className={`px-3 py-1 rounded-lg text-xs font-medium ${
                                                task.status === 'TODO' ? 'bg-gray-500/20 text-gray-300' :
                                                task.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-300' :
                                                task.status === 'REVIEW' ? 'bg-yellow-500/20 text-yellow-300' :
                                                'bg-green-500/20 text-green-300'
                                            }`}
                                            whileHover={{ scale: 1.1 }}
                                        >
                                            {task.status === 'TODO' ? '예정' :
                                             task.status === 'IN_PROGRESS' ? '진행중' :
                                             task.status === 'REVIEW' ? '검토' : '완료'}
                                        </motion.span>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </SpatialCard>
                </AnimatedSection>

                {/* Team Progress */}
                <AnimatedSection animation="fadeInRight" delay={0.3}>
                    <SpatialCard className="p-6 h-full">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <FloatingElement floatIntensity={2} duration={3.5}>
                                <Users className="w-5 h-5 text-pink-500" />
                            </FloatingElement>
                            팀 현황
                        </h3>
                        {teamProgress.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <FloatingElement floatIntensity={8}>
                                    <Users className="w-12 h-12 text-gray-600 mb-4" />
                                </FloatingElement>
                                <p className="text-gray-500">팀원이 없습니다</p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {teamProgress.slice(0, 5).map((memberItem, i) => {
                                    const total = memberItem.taskStats.todo + memberItem.taskStats.inProgress + memberItem.taskStats.review + memberItem.taskStats.done;
                                    const donePercent = total > 0 ? (memberItem.taskStats.done / total) * 100 : 0;

                                    return (
                                        <motion.div
                                            key={memberItem.id}
                                            initial={{ opacity: 0, x: 20, rotateY: 10 }}
                                            animate={{ opacity: 1, x: 0, rotateY: 0 }}
                                            transition={{ delay: i * 0.08, type: "spring" }}
                                            whileHover={{ scale: 1.02, x: -5 }}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <motion.div
                                                        className="w-8 h-8 rounded-full bg-linear-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold"
                                                        whileHover={{ scale: 1.2, rotate: 10 }}
                                                    >
                                                        {memberItem.name.charAt(0)}
                                                    </motion.div>
                                                    <span className="text-sm font-medium text-white">{memberItem.name}</span>
                                                </div>
                                                <span className="text-sm text-neon-teal font-mono">{memberItem.taskStats.done}/{total}</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                                                <motion.div
                                                    className="h-full rounded-full bg-linear-to-r from-neon-teal to-emerald-500"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${donePercent}%` }}
                                                    transition={{ duration: 0.8, delay: i * 0.15, type: "spring" }}
                                                />
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </SpatialCard>
                </AnimatedSection>
            </div>

            {/* Recent Activity */}
            <AnimatedSection animation="fadeInUp" delay={0.4} className="mt-8">
                <SpatialCard className="p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <FloatingElement floatIntensity={2} duration={4}>
                            <Activity className="w-5 h-5 text-pink-500" />
                        </FloatingElement>
                        최근 활동
                        <span className="ml-2 text-sm font-normal text-gray-400">최근 7일</span>
                    </h3>
                    {activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <FloatingElement floatIntensity={8}>
                                <Activity className="w-12 h-12 text-gray-600 mb-4" />
                            </FloatingElement>
                            <p className="text-gray-500">최근 활동이 없습니다</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activities.slice(0, 6).map((activity, i) => (
                                <motion.div
                                    key={activity.id}
                                    className="flex gap-4 items-start p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                                    initial={{ opacity: 0, y: 20, rotateX: -10 }}
                                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                                    transition={{ delay: i * 0.08, type: "spring" }}
                                    whileHover={{
                                        scale: 1.02,
                                        y: -5,
                                        boxShadow: "0 10px 30px rgba(224, 64, 251, 0.1)",
                                    }}
                                    style={{ transformStyle: "preserve-3d" }}
                                >
                                    <motion.div
                                        className="w-10 h-10 rounded-full bg-linear-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0"
                                        whileHover={{ rotate: 360 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        {activity.member.name.charAt(0)}
                                    </motion.div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-white font-medium">{activity.member.name}</p>
                                            <span className="text-xs text-gray-500">{getRelativeTime(activity.createdAt)}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {activity.action === 'created' && '업무를 생성했습니다'}
                                            {activity.action === 'updated' && '업무를 수정했습니다'}
                                            {activity.action === 'moved' && '업무 상태를 변경했습니다'}
                                        </p>
                                        <motion.p
                                            className="text-sm text-gray-300 truncate mt-2 bg-white/5 px-3 py-1.5 rounded-lg"
                                            whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                                        >
                                            {activity.task?.title}
                                        </motion.p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </SpatialCard>
            </AnimatedSection>
        </motion.div>
    );
}
