import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { PriorityBadge } from '@/components/ui/Badge';
import type { Task } from '@/types';
import { Calendar, MessageSquare, FolderOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface KanbanCardProps {
  task: Task;
  isDragging?: boolean;
  onClick?: () => void;
}

export function KanbanCard({ task, isDragging, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityColors = {
    LOW: 'from-slate-300 to-slate-400',
    MEDIUM: 'from-blue-400 to-blue-500',
    HIGH: 'from-orange-400 to-orange-500',
    URGENT: 'from-red-500 to-red-600',
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'group relative rounded-xl bg-white p-4 cursor-grab active:cursor-grabbing',
        'border-2 border-gray-100/80 hover:border-gray-200',
        'shadow-sm hover:shadow-lg transition-all duration-300',
        'hover:-translate-y-0.5',
        (isDragging || isSortableDragging) &&
          'opacity-90 shadow-2xl scale-105 rotate-1 border-blue-300 ring-4 ring-blue-100'
      )}
    >
      {/* Priority Indicator - 더 굵고 그라디언트 */}
      <div className={cn(
        'absolute left-0 top-4 bottom-4 w-1.5 rounded-r-full',
        'bg-linear-to-b shadow-sm',
        priorityColors[task.priority]
      )} />

      {/* Labels - 더 선명한 색상 */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3 pl-3">
          {task.labels.map(({ label }) => (
            <span
              key={label.id}
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-md uppercase tracking-wide"
              style={{
                backgroundColor: label.color,
                boxShadow: `0 2px 8px ${label.color}50`
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Title - 더 명확한 타이포그래피 */}
      <h4 className="font-semibold text-[15px] text-gray-900 mb-2.5 pl-3 pr-4 leading-relaxed group-hover:text-blue-600 transition-colors line-clamp-2">
        {task.title}
      </h4>

      {/* Description - 더 읽기 쉽게 */}
      {task.description && (
        <p className="text-sm text-gray-500 mb-3 pl-3 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Meta info - 더 큰 아이콘과 여백 */}
      <div className="flex items-center gap-2 text-xs mb-3 pl-3 flex-wrap">
        {task.dueDate && (
          <div className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition-colors',
            isOverdue
              ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
              : 'bg-gray-100 text-gray-600'
          )}>
            {isOverdue ? (
              <AlertCircle className="h-3.5 w-3.5" />
            ) : (
              <Calendar className="h-3.5 w-3.5" />
            )}
            <span>{formatDate(task.dueDate)}</span>
          </div>
        )}

        {task._count?.comments !== undefined && task._count.comments > 0 && (
          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-2.5 py-1.5 rounded-lg font-semibold">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{task._count.comments}</span>
          </div>
        )}

        {task._count?.subtasks !== undefined && task._count.subtasks > 0 && (
          <div className="flex items-center gap-1.5 bg-green-50 text-green-600 px-2.5 py-1.5 rounded-lg font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{task._count.subtasks}</span>
          </div>
        )}

        {task.folderUrl && (
          <a
            href={task.folderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-purple-50 text-purple-600 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-purple-100 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <FolderOpen className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {/* Footer - 더 명확한 분리 */}
      <div className="flex items-center justify-between pl-3 pt-3 border-t border-gray-100/80">
        <PriorityBadge priority={task.priority} />
        {task.assignee && (
          <div className="flex items-center gap-2 group/avatar">
            <span className="text-xs text-gray-500 font-medium opacity-0 group-hover/avatar:opacity-100 group-hover:opacity-100 transition-opacity">
              {task.assignee.name}
            </span>
            <div className="relative">
              <Avatar
                name={task.assignee.name}
                src={task.assignee.avatarUrl}
                size="sm"
              />
              {/* 온라인 상태 표시 */}
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
            </div>
          </div>
        )}
      </div>

      {/* Hover border effect - 더 부드럽게 */}
      <div className="absolute inset-0 rounded-xl border-2 border-blue-400/50 opacity-0 group-hover:opacity-100 transition-all pointer-events-none" />
    </div>
  );
}
