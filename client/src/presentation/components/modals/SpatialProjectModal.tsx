import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderKanban, Calendar } from 'lucide-react';
import { cn } from '@/core/utils/cn';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

export function SpatialProjectModal() {
  const { isProjectModalOpen, editingProject, closeProjectModal } = useUIStore();
  const { addProject, updateProject } = useProjectStore();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingProject) {
      setFormData({
        name: editingProject.name,
        description: editingProject.description || '',
        startDate: editingProject.startDate || '',
        endDate: editingProject.endDate || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
      });
    }
    setError(null);
  }, [editingProject, isProjectModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('프로젝트 이름을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingProject) {
        await updateProject(editingProject.id, {
          name: formData.name,
          description: formData.description || undefined,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
        });
      } else {
        await addProject({
          name: formData.name,
          description: formData.description || undefined,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
        });
      }
      closeProjectModal();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-midnight-800/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-neon-violet" />
                  {editingProject ? '프로젝트 수정' : '새 프로젝트'}
                </h2>
                <button
                  onClick={closeProjectModal}
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

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
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
                      'bg-linear-to-r from-neon-violet to-neon-blue text-white',
                      'hover:shadow-lg hover:shadow-neon-violet/25',
                      loading && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {loading ? '저장 중...' : editingProject ? '수정하기' : '생성하기'}
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
