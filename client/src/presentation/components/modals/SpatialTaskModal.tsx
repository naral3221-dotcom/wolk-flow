import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Flag, FileText, Folder, Users, Plus, Check } from 'lucide-react';
import { cn } from '@/core/utils/cn';
import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';
import { useMemberStore } from '@/stores/memberStore';
import { useUIStore } from '@/stores/uiStore';
import type { TaskStatus, TaskPriority } from '@/types';

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'TODO', label: '대기중', color: 'bg-slate-500' },
  { value: 'IN_PROGRESS', label: '진행중', color: 'bg-blue-500' },
  { value: 'REVIEW', label: '검토중', color: 'bg-amber-500' },
  { value: 'DONE', label: '완료', color: 'bg-emerald-500' },
];

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'LOW', label: '낮음', color: 'text-slate-400' },
  { value: 'MEDIUM', label: '보통', color: 'text-blue-400' },
  { value: 'HIGH', label: '높음', color: 'text-amber-400' },
  { value: 'URGENT', label: '긴급', color: 'text-red-400' },
];

export function SpatialTaskModal() {
  const { isTaskModalOpen, editingTask, taskModalProjectId, closeTaskModal } = useUIStore();
  const { addTask, updateTask } = useTaskStore();
  const { projects } = useProjectStore();
  const { members } = useMemberStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    status: 'TODO' as TaskStatus,
    priority: 'MEDIUM' as TaskPriority,
    assigneeIds: [] as string[],  // 다중 담당자
    startDate: '',
    dueDate: '',
    folderUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  // 담당자 토글
  const toggleAssignee = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(memberId)
        ? prev.assigneeIds.filter(id => id !== memberId)
        : [...prev.assigneeIds, memberId]
    }));
  };

  // 담당자 제거
  const removeAssignee = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      assigneeIds: prev.assigneeIds.filter(id => id !== memberId)
    }));
  };

  // 선택된 담당자 목록
  const selectedAssignees = members.filter(m => formData.assigneeIds.includes(m.id));

  useEffect(() => {
    if (editingTask) {
      // 기존 assignees 또는 단일 assignee 처리
      const assigneeIds = editingTask.assignees?.map(a => a.id)
        || (editingTask.assignee ? [editingTask.assignee.id] : []);
      setFormData({
        title: editingTask.title,
        description: editingTask.description || '',
        projectId: editingTask.projectId,
        status: editingTask.status,
        priority: editingTask.priority,
        assigneeIds,
        startDate: editingTask.startDate || '',
        dueDate: editingTask.dueDate || '',
        folderUrl: editingTask.folderUrl || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        projectId: taskModalProjectId || (projects[0]?.id ?? ''),
        status: 'TODO',
        priority: 'MEDIUM',
        assigneeIds: [],
        startDate: '',
        dueDate: '',
        folderUrl: '',
      });
    }
    setError(null);
    setShowAssigneeDropdown(false);
  }, [editingTask, taskModalProjectId, projects, isTaskModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    if (!formData.projectId) {
      setError('프로젝트를 선택해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingTask) {
        await updateTask(editingTask.id, {
          title: formData.title,
          description: formData.description || undefined,
          status: formData.status,
          priority: formData.priority,
          startDate: formData.startDate || undefined,
          dueDate: formData.dueDate || undefined,
          folderUrl: formData.folderUrl || undefined,
          assigneeIds: formData.assigneeIds.length > 0 ? formData.assigneeIds : undefined,
        });
      } else {
        await addTask({
          projectId: formData.projectId,
          title: formData.title,
          description: formData.description || undefined,
          status: formData.status,
          priority: formData.priority,
          assigneeIds: formData.assigneeIds.length > 0 ? formData.assigneeIds : undefined,
          startDate: formData.startDate || undefined,
          dueDate: formData.dueDate || undefined,
        });
      }
      closeTaskModal();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isTaskModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={closeTaskModal}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg"
          >
            <div className="bg-midnight-800/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">
                  {editingTask ? '업무 수정' : '새 업무 추가'}
                </h2>
                <button
                  onClick={closeTaskModal}
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

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    제목
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="업무 제목을 입력하세요"
                    className="w-full px-4 py-3 bg-midnight-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-violet/50 focus:border-neon-violet/50 transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">설명</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="업무 설명을 입력하세요"
                    rows={3}
                    className="w-full px-4 py-3 bg-midnight-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-violet/50 focus:border-neon-violet/50 transition-all resize-none"
                  />
                </div>

                {/* Project & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">프로젝트</label>
                    <select
                      value={formData.projectId}
                      onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                      className="w-full px-4 py-3 bg-midnight-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-neon-violet/50 focus:border-neon-violet/50 transition-all"
                    >
                      <option value="">선택하세요</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">상태</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                      className="w-full px-4 py-3 bg-midnight-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-neon-violet/50 focus:border-neon-violet/50 transition-all"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Flag className="w-4 h-4 inline mr-2" />
                    우선순위
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    className="w-full px-4 py-3 bg-midnight-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-neon-violet/50 focus:border-neon-violet/50 transition-all"
                  >
                    {priorityOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assignees (다중 담당자) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Users className="w-4 h-4 inline mr-2" />
                    담당자 ({selectedAssignees.length}명)
                  </label>

                  {/* 선택된 담당자 태그 */}
                  <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
                    {selectedAssignees.map((member) => (
                      <motion.div
                        key={member.id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-neon-violet/20 border border-neon-violet/30 rounded-full text-sm"
                      >
                        <div className="w-5 h-5 rounded-full bg-linear-to-br from-neon-violet to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">
                          {member.name.charAt(0)}
                        </div>
                        <span className="text-white">{member.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAssignee(member.id)}
                          className="ml-1 p-0.5 hover:bg-white/10 rounded-full transition-colors"
                        >
                          <X className="w-3 h-3 text-gray-400" />
                        </button>
                      </motion.div>
                    ))}
                    {selectedAssignees.length === 0 && (
                      <span className="text-gray-500 text-sm py-1.5">담당자를 선택하세요</span>
                    )}
                  </div>

                  {/* 담당자 선택 드롭다운 */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                      className="w-full px-4 py-3 bg-midnight-700/50 border border-white/10 rounded-xl text-left text-gray-400 hover:border-neon-violet/30 focus:outline-none focus:ring-2 focus:ring-neon-violet/50 transition-all flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        담당자 추가
                      </span>
                      <span className="text-xs text-gray-500">{members.length}명 중 선택</span>
                    </button>

                    <AnimatePresence>
                      {showAssigneeDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-10 w-full mt-2 py-2 bg-midnight-800 border border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto"
                        >
                          {members.map((member) => {
                            const isSelected = formData.assigneeIds.includes(member.id);
                            return (
                              <button
                                key={member.id}
                                type="button"
                                onClick={() => toggleAssignee(member.id)}
                                className={cn(
                                  'w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors',
                                  isSelected && 'bg-neon-violet/10'
                                )}
                              >
                                <div className={cn(
                                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white',
                                  isSelected
                                    ? 'bg-linear-to-br from-neon-violet to-pink-500'
                                    : 'bg-gray-600'
                                )}>
                                  {member.name.charAt(0)}
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="text-white text-sm">{member.name}</div>
                                  <div className="text-gray-500 text-xs">{member.position || member.department || member.email}</div>
                                </div>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-neon-violet" />
                                )}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                      마감일
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-4 py-3 bg-midnight-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-neon-violet/50 focus:border-neon-violet/50 transition-all"
                    />
                  </div>
                </div>

                {/* Folder URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Folder className="w-4 h-4 inline mr-2" />
                    작업 폴더 URL
                  </label>
                  <input
                    type="url"
                    value={formData.folderUrl}
                    onChange={(e) => setFormData({ ...formData, folderUrl: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-4 py-3 bg-midnight-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-violet/50 focus:border-neon-violet/50 transition-all"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeTaskModal}
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
                    {loading ? '저장 중...' : editingTask ? '수정하기' : '추가하기'}
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
