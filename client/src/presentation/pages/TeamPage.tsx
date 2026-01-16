import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useTeamStore } from '@/stores/teamStore';
import { AnimatedSection, FloatingElement } from '../components/effects/AnimatedSection';
import { MagneticButton } from '../components/effects/MagneticButton';
import {
  useTeams,
  useTeamDetail,
  TeamList,
  TeamHeader,
  TeamMemberList,
} from '@/features/team';
import type { Team } from '@/types';

export function TeamPage() {
  const { openCreateTeamModal, openEditTeamModal, openTeamMemberModal, openConfirmModal } = useUIStore();
  const { teams, loading: storeLoading, fetchTeams, deleteTeam } = useTeamStore();
  const { teams: teamsWithStats, stats, loading: hooksLoading } = useTeams();

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const loading = storeLoading || hooksLoading;

  // 선택된 팀의 상세 정보
  const selectedTeamWithStats = selectedTeam
    ? teamsWithStats.find((t) => t.id === selectedTeam.id)
    : teamsWithStats[0];

  // 선택된 팀의 멤버 상세 정보 훅
  const { members: teamMembers, loading: detailLoading, removeMember } = useTeamDetail(
    selectedTeamWithStats?.id || null
  );

  // 팀 선택 핸들러
  const handleSelectTeam = (team: Team) => {
    setSelectedTeam(team);
  };

  // 팀 삭제 핸들러
  const handleDeleteTeam = (team: Team) => {
    openConfirmModal({
      title: '팀 삭제',
      message: `"${team.name}" 팀을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      variant: 'danger',
      confirmText: '삭제',
      onConfirm: async () => {
        await deleteTeam(team.id);
        if (selectedTeam?.id === team.id) {
          setSelectedTeam(null);
        }
      },
    });
  };

  // 멤버 제거 핸들러
  const handleRemoveMember = (memberId: string) => {
    if (!selectedTeamWithStats) return;

    openConfirmModal({
      title: '멤버 제거',
      message: '이 멤버를 팀에서 제거하시겠습니까?',
      variant: 'warning',
      confirmText: '제거',
      onConfirm: async () => {
        await removeMember(memberId);
      },
    });
  };

  // 로딩 상태
  if (loading && teams.length === 0) {
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

  return (
    <motion.div
      className="p-8 w-full h-full overflow-hidden flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <AnimatedSection animation="fadeInDown" className="mb-6 shrink-0">
        <header className="flex justify-between items-end">
          <div>
            <FloatingElement floatIntensity={3} rotateIntensity={1} duration={6}>
              <motion.h1
                className="text-4xl font-bold text-white mb-2 tracking-tight"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <span className="text-transparent bg-clip-text bg-linear-to-r from-neon-violet to-pink-500">
                  팀
                </span>{' '}
                관리
              </motion.h1>
            </FloatingElement>
            <p className="text-gray-400">
              {stats.totalTeams}개 팀 · {stats.totalMembers}명의 멤버
            </p>
          </div>
          <MagneticButton
            variant="neon"
            size="lg"
            magneticStrength={0.4}
            glowColor="#E040FB"
            onClick={openCreateTeamModal}
          >
            <Plus className="w-5 h-5" /> 팀 만들기
          </MagneticButton>
        </header>
      </AnimatedSection>

      {/* Main Content - 2 Panel Layout */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Panel - Team List */}
        <AnimatedSection animation="fadeInLeft" delay={0.1} className="w-80 shrink-0">
          <div className="h-full bg-midnight-800/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
            <TeamList
              teams={teamsWithStats}
              selectedTeam={selectedTeamWithStats || null}
              loading={loading}
              onSelectTeam={handleSelectTeam}
              onCreateTeam={openCreateTeamModal}
              onEditTeam={openEditTeamModal}
              onDeleteTeam={handleDeleteTeam}
            />
          </div>
        </AnimatedSection>

        {/* Right Panel - Team Detail */}
        <AnimatedSection animation="fadeInRight" delay={0.2} className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {selectedTeamWithStats ? (
              <motion.div
                key={selectedTeamWithStats.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full flex flex-col overflow-hidden"
              >
                {/* Team Header */}
                <TeamHeader
                  team={selectedTeamWithStats}
                  onEdit={openEditTeamModal}
                  onDelete={handleDeleteTeam}
                />

                {/* Team Members with Tasks */}
                <div className="flex-1 overflow-y-auto">
                  <TeamMemberList
                    members={teamMembers.length > 0 ? teamMembers : selectedTeamWithStats.members}
                    loading={detailLoading}
                    onAddMember={() => openTeamMemberModal(selectedTeamWithStats.id)}
                    onRemoveMember={handleRemoveMember}
                    onTaskClick={(task) => {
                      // TaskModal을 열거나 Task 상세 페이지로 이동
                      console.log('Task clicked:', task);
                    }}
                    onMemberContact={(email) => {
                      window.location.href = `mailto:${email}`;
                    }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center bg-midnight-800/30 backdrop-blur-sm rounded-2xl border border-white/10"
              >
                <FloatingElement floatIntensity={10} rotateIntensity={3}>
                  <div className="flex flex-col items-center text-center p-8">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-violet/20 to-neon-blue/20 flex items-center justify-center mb-6">
                      <Users className="w-10 h-10 text-neon-violet" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      팀을 선택하세요
                    </h3>
                    <p className="text-gray-400 mb-6 max-w-sm">
                      왼쪽 목록에서 팀을 선택하거나 새 팀을 만들어 시작하세요.
                    </p>
                    <MagneticButton
                      variant="neon"
                      size="md"
                      magneticStrength={0.3}
                      onClick={openCreateTeamModal}
                    >
                      <Plus className="w-4 h-4" /> 첫 번째 팀 만들기
                    </MagneticButton>
                  </div>
                </FloatingElement>
              </motion.div>
            )}
          </AnimatePresence>
        </AnimatedSection>
      </div>
    </motion.div>
  );
}
