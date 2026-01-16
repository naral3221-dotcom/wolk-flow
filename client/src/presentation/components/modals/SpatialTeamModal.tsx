import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Palette } from 'lucide-react';
import { cn } from '@/core/utils/cn';
import { useTeamStore } from '@/stores/teamStore';
import { useMemberStore } from '@/stores/memberStore';
import { useUIStore } from '@/stores/uiStore';

const TEAM_COLORS = [
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

export function SpatialTeamModal() {
  const { isTeamModalOpen, editingTeam, closeTeamModal } = useUIStore();
  const { addTeam, updateTeam } = useTeamStore();
  const { members, fetchMembers } = useMemberStore();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: TEAM_COLORS[0],
    leaderId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isTeamModalOpen) {
      fetchMembers();
    }
  }, [isTeamModalOpen, fetchMembers]);

  useEffect(() => {
    if (editingTeam) {
      setFormData({
        name: editingTeam.name,
        description: editingTeam.description || '',
        color: editingTeam.color,
        leaderId: editingTeam.leaderId || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: TEAM_COLORS[0],
        leaderId: '',
      });
    }
    setError(null);
  }, [editingTeam, isTeamModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('팀 이름을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingTeam) {
        await updateTeam(editingTeam.id, {
          name: formData.name,
          description: formData.description || undefined,
          color: formData.color,
          leaderId: formData.leaderId || undefined,
        });
      } else {
        await addTeam({
          name: formData.name,
          description: formData.description || undefined,
          color: formData.color,
          leaderId: formData.leaderId || undefined,
        });
      }
      closeTeamModal();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isTeamModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={closeTeamModal}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-midnight-800/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-neon-violet" />
                  {editingTeam ? '팀 수정' : '새 팀 만들기'}
                </h2>
                <button
                  onClick={closeTeamModal}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    팀 이름
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="팀 이름을 입력하세요"
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
                    placeholder="팀 설명을 입력하세요"
                    rows={3}
                    className="w-full px-4 py-3 bg-midnight-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-violet/50 focus:border-neon-violet/50 transition-all resize-none"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Palette className="w-4 h-4 inline mr-2" />
                    팀 색상
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {TEAM_COLORS.map((color) => (
                      <motion.button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={cn(
                          'w-10 h-10 rounded-xl transition-all',
                          formData.color === color
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-midnight-800 scale-110'
                            : 'hover:scale-105'
                        )}
                        style={{ backgroundColor: color }}
                        whileHover={{ scale: formData.color === color ? 1.1 : 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      />
                    ))}
                  </div>
                </div>

                {/* Leader */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">팀 리더</label>
                  <select
                    value={formData.leaderId}
                    onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })}
                    className="w-full px-4 py-3 bg-midnight-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-neon-violet/50 focus:border-neon-violet/50 transition-all"
                  >
                    <option value="">리더 선택 (선택사항)</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeTeamModal}
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
                    {loading ? '저장 중...' : editingTeam ? '수정하기' : '생성하기'}
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
