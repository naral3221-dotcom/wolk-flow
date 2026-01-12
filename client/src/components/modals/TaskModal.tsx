import { useState, useEffect } from 'react';
import { X, Calendar, User, Flag, FolderOpen, AlignLeft, Tag } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import type { Task, Member, TaskStatus, TaskPriority } from '@/types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
  task?: Task | null;
  members?: Member[];
}

export interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  startDate: string;
  dueDate: string;
  folderUrl: string;
}

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'TODO', label: '예정', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'IN_PROGRESS', label: '진행중', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'REVIEW', label: '검토중', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'DONE', label: '완료', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
];

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'LOW', label: '낮음', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'MEDIUM', label: '보통', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'HIGH', label: '높음', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'URGENT', label: '긴급', color: 'bg-red-100 text-red-700 border-red-200' },
];

export function TaskModal({ isOpen, onClose, onSubmit, task, members = [] }: TaskModalProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    assigneeId: '',
    startDate: '',
    dueDate: '',
    folderUrl: '',
  });

  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        assigneeId: task.assignee?.id || '',
        startDate: task.startDate || '',
        dueDate: task.dueDate || '',
        folderUrl: task.folderUrl || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        assigneeId: '',
        startDate: '',
        dueDate: '',
        folderUrl: '',
      });
    }
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSubmit(formData);
  };

  const selectedAssignee = members.find(m => m.id === formData.assigneeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {task ? '업무 수정' : '새 업무 생성'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                업무명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="업무 제목을 입력하세요"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <AlignLeft className="h-4 w-4" />
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="업무에 대한 상세 설명을 입력하세요"
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Tag className="h-4 w-4" />
                  상태
                </label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: option.value })}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                        formData.status === option.value
                          ? option.color + ' ring-2 ring-offset-1 ring-blue-500'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Flag className="h-4 w-4" />
                  우선순위
                </label>
                <div className="flex flex-wrap gap-2">
                  {priorityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: option.value })}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                        formData.priority === option.value
                          ? option.color + ' ring-2 ring-offset-1 ring-blue-500'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Assignee */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4" />
                담당자
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors text-left"
                >
                  {selectedAssignee ? (
                    <>
                      <Avatar name={selectedAssignee.name} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">{selectedAssignee.name}</p>
                        <p className="text-xs text-gray-500">{selectedAssignee.position} · {selectedAssignee.department}</p>
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-400">담당자를 선택하세요</span>
                  )}
                </button>

                {showAssigneeDropdown && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, assigneeId: '' });
                        setShowAssigneeDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left text-gray-400 hover:bg-gray-50 border-b"
                    >
                      담당자 없음
                    </button>
                    {members.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, assigneeId: member.id });
                          setShowAssigneeDropdown(false);
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors',
                          formData.assigneeId === member.id && 'bg-blue-50'
                        )}
                      >
                        <Avatar name={member.name} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.position} · {member.department}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4" />
                  시작일
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4" />
                  마감일
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Folder URL */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FolderOpen className="h-4 w-4" />
                관련 폴더 URL
              </label>
              <input
                type="url"
                value={formData.folderUrl}
                onChange={(e) => setFormData({ ...formData, folderUrl: e.target.value })}
                placeholder="https://drive.google.com/..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
            <Button type="button" variant="ghost" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" className="gradient-primary shadow-md">
              {task ? '수정하기' : '생성하기'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
