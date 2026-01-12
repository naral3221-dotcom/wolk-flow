import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { PriorityBadge } from '@/components/ui/Badge';
import type { Task } from '@/types';
import { Calendar, MessageSquare, FolderOpen, Clock, CheckCircle2 } from 'lucide-react';
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
    LOW: 'from-gray-400 to-gray-500',
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
        'group relative rounded-xl bg-white p-4 shadow-sm cursor-grab active:cursor-grabbing',
        'border border-gray-100 hover:border-gray-200',
        'hover:shadow-md transition-all duration-200',
        (isDragging || isSortableDragging) && 'opacity-60 shadow-xl scale-105 rotate-2',
      )}
    >
      {/* Priority Indicator */}
      <div className={cn(
        'absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gradient-to-b',
        priorityColors[task.priority]
      )} />

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3 pl-2">
          {task.labels.map(({ label }) => (
            <span
              key={label.id}
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white shadow-sm"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h4 className="font-medium text-gray-900 mb-3 pl-2 pr-6 leading-snug group-hover:text-blue-600 transition-colors">
        {task.title}
      </h4>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-gray-500 mb-3 pl-2 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Meta info */}
      <div className="flex items-center gap-3 text-xs text-gray-400 mb-3 pl-2">
        {task.dueDate && (
          <div className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-full',
            isOverdue ? 'bg-red-50 text-red-600' : 'bg-gray-50'
          )}>
            {isOverdue ? (
              <Clock className="h-3 w-3" />
            ) : (
              <Calendar className="h-3 w-3" />
            )}
            <span className="font-medium">{formatDate(task.dueDate)}</span>
          </div>
        )}
        {task._count?.comments !== undefined && task._count.comments > 0 && (
          <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full">
            <MessageSquare className="h-3 w-3" />
            <span>{task._count.comments}</span>
          </div>
        )}
        {task._count?.subtasks !== undefined && task._count.subtasks > 0 && (
          <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="h-3 w-3" />
            <span>{task._count.subtasks}</span>
          </div>
        )}
        {task.folderUrl && (
          <a
            href={task.folderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <FolderOpen className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pl-2 pt-2 border-t border-gray-50">
        <PriorityBadge priority={task.priority} />
        {task.assignee && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 hidden group-hover:inline">
              {task.assignee.name}
            </span>
            <Avatar
              name={task.assignee.name}
              src={task.assignee.avatarUrl}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Hover overlay indicator */}
      <div className="absolute inset-0 rounded-xl border-2 border-blue-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}
