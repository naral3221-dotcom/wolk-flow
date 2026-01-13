import { useState } from "react";
import { motion } from "framer-motion";
import { SpatialCard } from "../components/ui/SpatialCard";
import { Users, UserPlus, Search, Filter, Briefcase, UserCheck, TrendingUp } from "lucide-react";
import { useTeam } from "@/features/team/hooks/useTeam";
import { TeamMemberCard } from "@/features/team/components/TeamMemberCard";
import { FlipCard, FlipCardFace } from "../components/effects/FlipCard";
import { AnimatedSection, FloatingElement, AnimatedList } from "../components/effects/AnimatedSection";
import { MagneticButton } from "../components/effects/MagneticButton";
import { useUIStore } from "@/stores/uiStore";

export function TeamPage() {
    const { openInviteMemberModal } = useUIStore();
    const { data, loading } = useTeam();
    const { members, totalMembers, activeMembers, roleDistribution } = data;
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<string | null>(null);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <FloatingElement floatIntensity={15} rotateIntensity={5}>
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 animate-spin rounded-full border-4 border-neon-violet border-t-transparent" />
                        <p className="text-gray-400 animate-pulse">팀 정보를 불러오는 중...</p>
                    </div>
                </FloatingElement>
            </div>
        );
    }

    // Filter members based on search and role
    const filteredMembers = members.filter((member) => {
        const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.department?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = !roleFilter || member.role?.name === roleFilter || member.position === roleFilter;
        return matchesSearch && matchesRole;
    });

    const statCards = [
        {
            icon: Users,
            label: "전체",
            value: totalMembers,
            description: "전체 팀원",
            color: "neon-violet",
            gradient: "from-neon-violet/20 to-purple-600/10",
        },
        {
            icon: UserCheck,
            label: "활성",
            value: activeMembers,
            description: "업무 진행 중",
            color: "neon-teal",
            gradient: "from-neon-teal/20 to-emerald-500/10",
        },
        {
            icon: Briefcase,
            label: "역할",
            value: roleDistribution.length,
            description: "등록된 역할",
            color: "blue-400",
            gradient: "from-blue-500/20 to-cyan-500/10",
        },
    ];

    return (
        <motion.div
            className="p-8 w-full h-full overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <AnimatedSection animation="fadeInDown" className="mb-10">
                <header className="flex justify-between items-end">
                    <div>
                        <FloatingElement floatIntensity={3} rotateIntensity={1} duration={6}>
                            <motion.h1
                                className="text-4xl font-bold text-white mb-2 tracking-tight"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <span className="text-transparent bg-clip-text bg-linear-to-r from-neon-violet to-pink-500">팀</span> 관리
                            </motion.h1>
                        </FloatingElement>
                        <p className="text-gray-400">팀원들의 현황과 업무 분배를 확인하세요.</p>
                    </div>
                    <MagneticButton
                        variant="neon"
                        size="lg"
                        magneticStrength={0.4}
                        glowColor="#E040FB"
                        onClick={openInviteMemberModal}
                    >
                        <UserPlus className="w-5 h-5" /> 팀원 초대
                    </MagneticButton>
                </header>
            </AnimatedSection>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {statCards.map((card, index) => (
                    <AnimatedSection
                        key={card.label}
                        animation="scaleIn"
                        delay={index * 0.1}
                    >
                        <FlipCard
                            height={140}
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
                                            <h3 className="text-3xl font-bold text-white mb-1">{card.value}</h3>
                                            <p className="text-gray-400 text-sm">{card.description}</p>
                                        </div>
                                    </div>
                                </FlipCardFace>
                            }
                            back={
                                <FlipCardFace gradient="from-slate-900/95 to-slate-800/95">
                                    <div className="text-center">
                                        <TrendingUp className={`w-8 h-8 text-${card.color} mx-auto mb-3`} />
                                        <p className="text-white font-medium mb-2">{card.description}</p>
                                        <div className={`text-2xl font-bold text-${card.color}`}>
                                            {card.value}명
                                        </div>
                                    </div>
                                </FlipCardFace>
                            }
                        />
                    </AnimatedSection>
                ))}
            </div>

            {/* Search and Filter */}
            <AnimatedSection animation="fadeIn" delay={0.2} className="mb-8">
                <SpatialCard className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="이름, 이메일, 부서로 검색..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-neon-violet/50 transition-colors"
                            />
                        </div>

                        {/* Role Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-500" />
                            <div className="flex gap-2 flex-wrap">
                                <motion.button
                                    onClick={() => setRoleFilter(null)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        !roleFilter
                                            ? "bg-neon-violet/30 text-neon-violet border border-neon-violet/50"
                                            : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                                    }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    전체
                                </motion.button>
                                {roleDistribution.map((role) => (
                                    <motion.button
                                        key={role.role}
                                        onClick={() => setRoleFilter(roleFilter === role.role ? null : role.role)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                            roleFilter === role.role
                                                ? "bg-neon-violet/30 text-neon-violet border border-neon-violet/50"
                                                : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                                        }`}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {role.role} ({role.count})
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </div>
                </SpatialCard>
            </AnimatedSection>

            {/* Team Members Grid */}
            <AnimatedSection animation="fadeInUp" delay={0.3}>
                {filteredMembers.length === 0 ? (
                    <SpatialCard className="p-12">
                        <div className="flex flex-col items-center justify-center">
                            <FloatingElement floatIntensity={10}>
                                <Users className="w-16 h-16 text-gray-600 mb-4" />
                            </FloatingElement>
                            <p className="text-gray-500 text-lg">검색 결과가 없습니다</p>
                            <p className="text-gray-600 text-sm mt-2">다른 검색어나 필터를 시도해 보세요</p>
                        </div>
                    </SpatialCard>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatedList
                            animation="fadeInUp"
                            staggerDelay={0.05}
                            className="contents"
                        >
                            {filteredMembers.map((member) => (
                                <TeamMemberCard
                                    key={member.id}
                                    member={member}
                                    onContact={(m) => {
                                        window.location.href = `mailto:${m.email}`;
                                    }}
                                    onViewTasks={(m) => {
                                        console.log("View tasks for:", m.name);
                                    }}
                                />
                            ))}
                        </AnimatedList>
                    </div>
                )}
            </AnimatedSection>

            {/* Role Distribution Chart */}
            <AnimatedSection animation="fadeInUp" delay={0.4} className="mt-8">
                <SpatialCard className="p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <FloatingElement floatIntensity={2} duration={3}>
                            <Briefcase className="w-5 h-5 text-cyan-400" />
                        </FloatingElement>
                        역할 분포
                    </h3>
                    <div className="flex flex-wrap gap-4">
                        {roleDistribution.map((role, index) => {
                            const percentage = totalMembers > 0
                                ? Math.round((role.count / totalMembers) * 100)
                                : 0;
                            const colors = [
                                "from-violet-500 to-purple-600",
                                "from-cyan-500 to-blue-600",
                                "from-emerald-500 to-green-600",
                                "from-amber-500 to-orange-600",
                                "from-pink-500 to-rose-600",
                            ];
                            const color = colors[index % colors.length];

                            return (
                                <motion.div
                                    key={role.role}
                                    className="flex-1 min-w-[200px] p-4 bg-white/5 rounded-xl border border-white/10"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.02, y: -5 }}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-white font-medium">{role.role}</span>
                                        <span className="text-sm text-gray-400">{role.count}명</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            className={`h-full bg-linear-to-r ${color} rounded-full`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                                        />
                                    </div>
                                    <div className="mt-2 text-right text-sm text-gray-500">
                                        {percentage}%
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </SpatialCard>
            </AnimatedSection>
        </motion.div>
    );
}
