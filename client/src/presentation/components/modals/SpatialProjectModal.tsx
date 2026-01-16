import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderKanban, Calendar, Users, ChevronDown, ChevronUp, UserPlus, Check } from 'lucide-react';
import { cn } from '@/core/utils/cn';
import { useProjectStore } from '@/stores/projectStore';
import type { TeamAssignmentInput } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { useTeamStore } from '@/stores/teamStore';
import type { Team, Member } from '@/types';

interface TeamAssignmentState {
  teamId: string;
  assigneeIds: string[];
  expanded: boolean;
}

export function SpatialProjectModal() {
  const { isProjectModalOpen, editingProject, closeProjectModal } = useUIStore();
  const { addProject, updateProject, projects } = useProjectStore();
  const { teams, teamMembers, fetchTeams, fetchTeamMembers } = useTeamStore();

  // editingProject.id를 사용해서 store에서 최신 프로젝트 데이터 가져오기
  const currentProject = editingProject
    ? projects.find(p => p.id === editingProject.id) || editingProject
    : null;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  });
  const [teamAssignments, setTeamAssignments] = useState<TeamAssignmentState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 팀 목록 로드
  useEffect(() => {
    if (isProjectModalOpen && teams.length === 0) {
      fetchTeams();
    }
  }, [isProjectModalOpen, teams.length, fetchTeams]);

  // 선택된 팀들의 멤버 로드
  useEffect(() => {
    teamAssignments.forEach((assignment) => {
      if (!teamMembers.has(assignment.teamId)) {
        fetchTeamMembers(assignment.teamId);
      }
    });
  }, [teamAssignments, teamMembers, fetchTeamMembers]);

  useEffect(() => {
    if (currentProject) {
      console.log('[SpatialProjectModal] Loading project data:', currentProject);
      console.log('[SpatialProjectModal] teamAssignments:', currentProject.teamAssignments);

      setFormData({
        name: currentProject.name,
        description: currentProject.description || '',
        startDate: currentProject.startDate || '',
        endDate: currentProject.endDate || '',
      });

      // 기존 팀 할당 정보 로드
      if (currentProject.teamAssignments && currentProject.teamAssignments.length > 0) {
        setTeamAssignments(
          currentProject.teamAssignments.map((ta) => ({
            teamId: ta.teamId,
            assigneeIds: ta.assigneeIds || [],
            expanded: true,
          }))
        );
      } else if (currentProject.teamIds && currentProject.teamIds.length > 0) {
        // 다중 팀만 있는 경우
        setTeamAssignments(
          currentProject.teamIds.map((teamId) => ({
            teamId,
            assigneeIds: [],
            expanded: true,
          }))
        );
      } else if (currentProject.teamId) {
        // 단일 팀 (하위 호환)
        setTeamAssignments([
          {
            teamId: currentProject.teamId,
            assigneeIds: [],
            expanded: true,
          },
        ]);
      } else {
        setTeamAssignments([]);
      }
    } else {
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
      });
      setTeamAssignments([]);
    }
    setError(null);
  }, [currentProject, isProjectModalOpen]);

  // 선택된 팀 ID 목록
  const selectedTeamIds = useMemo(
    () => teamAssignments.map((ta) => ta.teamId),
    [teamAssignments]
  );

  // 팀 선택/해제 토글
  const toggleTeam = (teamId: string) => {
    setTeamAssignments((prev) => {
      const exists = prev.find((ta) => ta.teamId === teamId);
      if (exists) {
        // 제거
        return prev.filter((ta) => ta.teamId !== teamId);
      } else {
        // 추가
        fetchTeamMembers(teamId);
        return [...prev, { teamId, assigneeIds: [], expanded: true }];
      }
    });
  };

  // 담당자 선택/해제 토글
  const toggleAssignee = (teamId: string, memberId: string) => {
    setTeamAssignments((prev) =>
      prev.map((ta) => {
        if (ta.teamId !== teamId) return ta;
        const exists = ta.assigneeIds.includes(memberId);
        return {
          ...ta,
          assigneeIds: exists
            ? ta.assigneeIds.filter((id) => id !== memberId)
            : [...ta.assigneeIds, memberId],
        };
      })
    );
  };

  // 팀 섹션 확장/축소 토글
  const toggleTeamExpanded = (teamId: string) => {
    setTeamAssignments((prev) =>
      prev.map((ta) =>
        ta.teamId === teamId ? { ...ta, expanded: !ta.expanded } : ta
      )
    );
  };

  // 팀의 모든 담당자 선택
  const selectAllAssignees = (teamId: string) => {
    const members = teamMembers.get(teamId) || [];
    setTeamAssignments((prev) =>
      prev.map((ta) =>
        ta.teamId === teamId
          ? { ...ta, assigneeIds: members.map((m) => m.member.id) }
          : ta
      )
    );
  };

  // 팀의 모든 담당자 해제
  const deselectAllAssignees = (teamId: string) => {
    setTeamAssignments((prev) =>
      prev.map((ta) =>
        ta.teamId === teamId ? { ...ta, assigneeIds: [] } : ta
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('프로젝트 이름을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    // teamAssignments 변환
    const teamAssignmentsInput: TeamAssignmentInput[] = teamAssignments.map((ta) => ({
      teamId: ta.teamId,
      assigneeIds: ta.assigneeIds,
    }));

    console.log('[SpatialProjectModal] handleSubmit - teamAssignments:', teamAssignments);
    console.log('[SpatialProjectModal] handleSubmit - teamAssignmentsInput:', teamAssignmentsInput);

    try {
      if (currentProject) {
        await updateProject(currentProject.id, {
          name: formData.name,
          description: formData.description || undefined,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          teamIds: selectedTeamIds.length > 0 ? selectedTeamIds : undefined,
          teamAssignments: teamAssignmentsInput.length > 0 ? teamAssignmentsInput : undefined,
          // 하위 호환을 위해 첫 번째 팀을 teamId로 설정
          teamId: selectedTeamIds[0] || undefined,
        });
      } else {
        await addProject({
          name: formData.name,
          description: formData.description || undefined,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          teamIds: selectedTeamIds.length > 0 ? selectedTeamIds : undefined,
          teamAssignments: teamAssignmentsInput.length > 0 ? teamAssignmentsInput : undefined,
          teamId: selectedTeamIds[0] || undefined,
        });
      }
      closeProjectModal();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 팀 정보 가져오기
  const getTeam = (teamId: string): Team | undefined => {
    return teams.find((t) => t.id === teamId);
  };

  // 팀 멤버 목록 가져오기
  const getTeamMembersList = (teamId: string): Member[] => {
    const members = teamMembers.get(teamId) || [];
    return members.map((tm) => tm.member);
  };

  return (
    <AnimatePresence>
      {isProjectModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={closeProjectModal}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[90vh] overflow-hidden"
          >
            <div className="bg-midnight-800/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-neon-violet" />
                  {currentProject ? '프로젝트 수정' : '새 프로젝트'}
                </h2>
                <button
                  onClick={closeProjectModal}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      프로젝트 이름
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="프로젝트 이름을 입력하세요"
                      className="w-full px-4 py-3 bg-midnight-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-violet/50 focus:border-neon-violet/50 transition-all"
                      autoFocus
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">설명</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="프로젝트 설명을 입력하세요"
                      rows={3}
                      className="w-full px-4 py-3 bg-midnight-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-violet/50 focus:border-neon-violet/50 transition-all resize-none"
                    />
                  </div>

                  {/* Teams Multi-Select */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Users className="w-4 h-4 inline mr-2" />
                      담당 팀 (복수 선택 가능)
                    </label>
                    <div className="space-y-2">
                      {/* 팀 선택 버튼들 */}
                      <div className="flex flex-wrap gap-2">
                        {teams.map((team) => {
                          const isSelected = selectedTeamIds.includes(team.id);
                          return (
                            <button
                              key={team.id}
                              type="button"
                              onClick={() => toggleTeam(team.id)}
                              className={cn(
                                'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm',
                                isSelected
                                  ? 'border-neon-violet/50 bg-neon-violet/20 text-white'
                                  : 'border-white/10 bg-midnight-700/30 text-gray-400 hover:bg-midnight-700/50 hover:text-gray-200'
                              )}
                            >
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: team.color }}
                              />
                              <span>{team.name}</span>
                              {isSelected && <Check className="w-4 h-4 text-neon-violet" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* 선택된 팀별 담당자 선택 */}
                      {teamAssignments.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {teamAssignments.map((assignment) => {
                            const team = getTeam(assignment.teamId);
                            const members = getTeamMembersList(assignment.teamId);
                            if (!team) return null;

                            return (
                              <div
                                key={assignment.teamId}
                                className="bg-midnight-700/30 rounded-xl border border-white/5 overflow-hidden"
                              >
                                {/* 팀 헤더 */}
                                <button
                                  type="button"
                                  onClick={() => toggleTeamExpanded(assignment.teamId)}
                                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: team.color }}
                                    />
                                    <span className="text-white font-medium">{team.name}</span>
                                    <span className="text-gray-500 text-sm">
                                      ({assignment.assigneeIds.length}명 선택)
                                    </span>
                                  </div>
                                  {assignment.expanded ? (
                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                  )}
                                </button>

                                {/* 담당자 목록 */}
                                <AnimatePresence>
                                  {assignment.expanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="px-4 pb-3 space-y-2">
                                        {/* 전체 선택/해제 버튼 */}
                                        <div className="flex gap-2 mb-2">
                                          <button
                                            type="button"
                                            onClick={() => selectAllAssignees(assignment.teamId)}
                                            className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200 transition-colors"
                                          >
                                            전체 선택
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => deselectAllAssignees(assignment.teamId)}
                                            className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200 transition-colors"
                                          >
                                            전체 해제
                                          </button>
                                        </div>

                                        {/* 멤버 목록 */}
                                        {members.length > 0 ? (
                                          <div className="grid grid-cols-2 gap-2">
                                            {members.map((member) => {
                                              const isSelected = assignment.assigneeIds.includes(member.id);
                                              return (
                                                <button
                                                  key={member.id}
                                                  type="button"
                                                  onClick={() => toggleAssignee(assignment.teamId, member.id)}
                                                  className={cn(
                                                    'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left',
                                                    isSelected
                                                      ? 'border-neon-blue/50 bg-neon-blue/10 text-white'
                                                      : 'border-white/5 bg-midnight-800/50 text-gray-400 hover:bg-midnight-700/50 hover:text-gray-200'
                                                  )}
                                                >
                                                  {member.avatarUrl ? (
                                                    <img
                                                      src={member.avatarUrl}
                                                      alt={member.name}
                                                      className="w-6 h-6 rounded-full object-cover"
                                                    />
                                                  ) : (
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neon-violet to-neon-blue flex items-center justify-center text-white text-xs font-medium">
                                                      {member.name.charAt(0)}
                                                    </div>
                                                  )}
                                                  <div className="flex-1 min-w-0">
                                                    <div className="text-sm truncate">{member.name}</div>
                                                    {member.position && (
                                                      <div className="text-xs text-gray-500 truncate">
                                                        {member.position}
                                                      </div>
                                                    )}
                                                  </div>
                                                  {isSelected && (
                                                    <Check className="w-4 h-4 text-neon-blue shrink-0" />
                                                  )}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                                            <UserPlus className="w-4 h-4" />
                                            <span>팀에 등록된 멤버가 없습니다</span>
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {teams.length === 0 && (
                        <div className="text-gray-500 text-sm py-2">
                          등록된 팀이 없습니다. 팀 관리에서 팀을 먼저 추가해주세요.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        시작일
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-4 py-3 bg-midnight-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-neon-violet/50 focus:border-neon-violet/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        종료일
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-4 py-3 bg-midnight-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-neon-violet/50 focus:border-neon-violet/50 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 p-6 pt-4 border-t border-white/10 shrink-0">
                  <button
                    type="button"
                    onClick={closeProjectModal}
                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={cn(
                      'flex-1 px-4 py-3 rounded-xl font-medium transition-all',
                      'bg-gradient-to-r from-neon-violet to-neon-blue text-white',
                      'hover:shadow-lg hover:shadow-neon-violet/25',
                      loading && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {loading ? '저장 중...' : currentProject ? '수정하기' : '생성하기'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
