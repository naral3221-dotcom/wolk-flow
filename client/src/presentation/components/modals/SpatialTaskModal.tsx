import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Folder, Users, Plus, Check, Settings, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/core/utils/cn';
import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';
import { useMemberStore } from '@/stores/memberStore';
import { useUIStore } from '@/stores/uiStore';
import { validateTaskForm, getFieldError, type ValidationResult } from '@/core/utils/validation';
import type { TaskStatus, TaskPriority } from '@/types';

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'TODO', label: '대기중', color: 'bg-gray-400' },
  { value: 'IN_PROGRESS', label: '진행중', color: 'bg-blue-400' },
  { value: 'REVIEW', label: '검토중', color: 'bg-amber-400' },
  { value: 'DONE', label: '완료', color: 'bg-emerald-400' },
];

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'LOW', label: '낮음', color: 'bg-green-400' },
  { value: 'MEDIUM', label: '보통', color: 'bg-yellow-400' },
  { value: 'HIGH', label: '높음', color: 'bg-orange-400' },
  { value: 'URGENT', label: '긴급', color: 'bg-red-500' },
];

type TabType = 'basic' | 'detail';

export function SpatialTaskModal() {
  const { isTaskModalOpen, editingTask, taskModalProjectId, taskModalParentId, closeTaskModal } = useUIStore();
  const { tasks, addTask, updateTask } = useTaskStore();
  const { projects } = useProjectStore();
  const { members } = useMemberStore();

  // editingTask가 있으면 store에서 최신 데이터로 참조 (실시간 동기화)
  const currentTask = editingTask
    ? tasks.find(t => t.id === editingTask.id) || editingTask
    : null;

  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    status: 'TODO' as TaskStatus,
    priority: 'MEDIUM' as TaskPriority,
    assigneeIds: [] as string[],
    startDate: '',
    dueDate: '',
    folderUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, errors: [] });

  const toggleAssignee = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(memberId)
        ? prev.assigneeIds.filter(id => id !== memberId)
        : [...prev.assigneeIds, memberId]
    }));
  };

  const removeAssignee = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      assigneeIds: prev.assigneeIds.filter(id => id !== memberId)
    }));
  };

  const selectedAssignees = members.filter(m => formData.assigneeIds.includes(m.id));

  useEffect(() => {
    if (currentTask) {
      const assigneeIds = currentTask.assignees?.map(a => a.id)
        || (currentTask.assignee ? [currentTask.assignee.id] : []);
      setFormData({
        title: currentTask.title,
        description: currentTask.description || '',
        projectId: currentTask.projectId,
        status: currentTask.status,
        priority: currentTask.priority,
        assigneeIds,
        startDate: currentTask.startDate || '',
        dueDate: currentTask.dueDate || '',
        folderUrl: currentTask.folderUrl || '',
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
    setActiveTab('basic');
    setError(null);
    setShowAssigneeDropdown(false);
    setValidation({ isValid: true, errors: [] });
  }, [currentTask, taskModalProjectId, projects, isTaskModalOpen]);

  // 실시간 유효성 검사
  const validateField = (fieldName: string) => {
    const result = validateTaskForm(formData, !!taskModalParentId);
    setValidation(result);
    return getFieldError(result, fieldName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 전체 유효성 검사 실행
    const result = validateTaskForm(formData, !!taskModalParentId);
    setValidation(result);

    if (!result.isValid) {
      // 첫 번째 에러가 있는 필드에 따라 탭 전환
      const firstError = result.errors[0];
      if (firstError) {
        const basicFields = ['제목', '프로젝트', '설명'];
        const detailFields = ['시작일', '마감일', '작업 폴더 URL'];

        if (basicFields.some(f => firstError.field.includes(f))) {
          setActiveTab('basic');
        } else if (detailFields.some(f => firstError.field.includes(f))) {
          setActiveTab('detail');
        }
        setError(firstError.message);
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (currentTask) {
        await updateTask(currentTask.id, {
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
          parentId: taskModalParentId || undefined,
        });
      }
      closeTaskModal();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic' as TabType, label: '기본 정보', icon: FileText },
    { id: 'detail' as TabType, label: '일정 및 설정', icon: Settings },
  ];

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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl mx-4"
          >
            <div className="bg-midnight-800/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">
                  {currentTask ? '업무 수정' : taskModalParentId ? '하위 업무 추가' : '새 업무 추가'}
                </h2>
                <button
                  onClick={closeTaskModal}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative',
                      activeTab === tab.id
                        ? 'text-neon-violet'
                        : 'text-gray-400 hover:text-gray-200'
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-violet"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="p-6">
                  {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                      {error}
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    {activeTab === 'basic' && (
                      <motion.div
                        key="basic"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-5"
                      >
                        {/* Title */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            <FileText className="w-4 h-4 inline mr-2" />
                            제목 <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            onBlur={() => validateField('제목')}
                            placeholder="업무 제목을 입력하세요"
                            maxLength={100}
                            className={cn(
                              "w-full px-4 py-3 bg-midnight-700/50 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all",
                              getFieldError(validation, '제목')
                                ? "border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50"
                                : "border-white/10 focus:ring-neon-violet/50 focus:border-neon-violet/50"
                            )}
                          />
                          {getFieldError(validation, '제목') && (
                            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {getFieldError(validation, '제목')}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-500 text-right">{formData.title.length}/100</p>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">설명</label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            onBlur={() => validateField('설명')}
                            placeholder="업무 설명을 입력하세요"
                            rows={3}
                            maxLength={2000}
                            className={cn(
                              "w-full px-4 py-3 bg-midnight-700/50 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all resize-none",
                              getFieldError(validation, '설명')
                                ? "border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50"
                                : "border-white/10 focus:ring-neon-violet/50 focus:border-neon-violet/50"
                            )}
                          />
                          <p className="mt-1 text-xs text-gray-500 text-right">{formData.description.length}/2000</p>
                        </div>

                        {/* Project, Status, Priority */}
                        <div className={cn("grid gap-4", taskModalParentId ? "grid-cols-2" : "grid-cols-3")}>
                          {/* 하위 업무가 아닐 때만 프로젝트 선택 표시 */}
                          {!taskModalParentId && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                프로젝트 <span className="text-red-400">*</span>
                              </label>
                              <select
                                value={formData.projectId}
                                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                className="w-full px-4 py-3 bg-midnight-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-neon-violet/50 focus:border-neon-violet/50 transition-all"
                              >
                                <option value="">선택</option>
                                {projects.map((project) => (
                                  <option key={project.id} value={project.id}>
                                    {project.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">상태</label>
                            <div className="relative">
                              <span className={cn(
                                "absolute left-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full",
                                statusOptions.find(s => s.value === formData.status)?.color
                              )} />
                              <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                                className="w-full pl-9 pr-4 py-3 bg-midnight-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-neon-violet/50 focus:border-neon-violet/50 transition-all appearance-none cursor-pointer"
                              >
                                {statusOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">우선순위</label>
                            <div className="relative">
                              <span className={cn(
                                "absolute left-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full",
                                formData.priority === 'LOW' && "bg-green-400",
                                formData.priority === 'MEDIUM' && "bg-yellow-400",
                                formData.priority === 'HIGH' && "bg-orange-400",
                                formData.priority === 'URGENT' && "bg-red-500",
                              )} />
                              <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                                className="w-full pl-9 pr-4 py-3 bg-midnight-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-neon-violet/50 focus:border-neon-violet/50 transition-all appearance-none cursor-pointer"
                              >
                                {priorityOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'detail' && (
                      <motion.div
                        key="detail"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-5"
                      >
                        {/* Dates - 2 columns */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            <Clock className="w-4 h-4 inline mr-2" />
                            일정
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1.5">시작일</label>
                              <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full px-4 py-3 bg-midnight-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-neon-violet/50 focus:border-neon-violet/50 transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1.5">마감일</label>
                              <input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                className="w-full px-4 py-3 bg-midnight-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-neon-violet/50 focus:border-neon-violet/50 transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Assignees */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            <Users className="w-4 h-4 inline mr-2" />
                            담당자 ({selectedAssignees.length}명)
                          </label>

                          {/* Selected assignees */}
                          <div className="flex flex-wrap gap-2 mb-3 min-h-[36px] p-3 bg-midnight-700/30 rounded-xl border border-white/5">
                            {selectedAssignees.map((member) => (
                              <motion.div
                                key={member.id}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-neon-violet/20 border border-neon-violet/30 rounded-full"
                              >
                                <div className="w-5 h-5 rounded-full bg-linear-to-br from-neon-violet to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">
                                  {member.name.charAt(0)}
                                </div>
                                <span className="text-sm text-white">{member.name}</span>
                                <button
                                  type="button"
                                  onClick={() => removeAssignee(member.id)}
                                  className="p-0.5 hover:bg-white/10 rounded-full transition-colors"
                                >
                                  <X className="w-3 h-3 text-gray-400" />
                                </button>
                              </motion.div>
                            ))}
                            {selectedAssignees.length === 0 && (
                              <span className="text-gray-500 text-sm">담당자를 선택하세요</span>
                            )}
                          </div>

                          {/* Assignee dropdown */}
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
                              <span className="text-sm text-gray-500">{members.length}명</span>
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
                                          {member.position && (
                                            <div className="text-gray-500 text-xs">{member.position}</div>
                                          )}
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-midnight-900/30">
                  <div className="text-sm text-gray-500">
                    {activeTab === 'basic' ? '1 / 2' : '2 / 2'}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={closeTaskModal}
                      className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className={cn(
                        'px-6 py-2.5 rounded-xl font-medium transition-all',
                        'bg-linear-to-r from-neon-violet to-neon-blue text-white',
                        'hover:shadow-lg hover:shadow-neon-violet/25',
                        loading && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {loading ? '저장 중...' : currentTask ? '수정하기' : '추가하기'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
