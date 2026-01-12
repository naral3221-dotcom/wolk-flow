import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  color?: string;
  children: ReactNode;
  onAddClick?: () => void;
}

const columnColors: Record<string, { bg: string; border: string; badge: string; badgeText: string }> = {
  TODO: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    badge: 'bg-slate-200',
    badgeText: 'text-slate-700',
  },
  IN_PROGRESS: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-200',
    badgeText: 'text-blue-700',
  },
  REVIEW: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-200',
    badgeText: 'text-amber-700',
  },
  DONE: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-200',
    badgeText: 'text-emerald-700',
  },
};

export function KanbanColumn({ id, title, count, children, onAddClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const colors = columnColors[id] || columnColors.TODO;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-80 flex-col rounded-2xl border-2 transition-all duration-200',
        colors.bg,
        colors.border,
        isOver && 'ring-2 ring-blue-500 ring-offset-2 scale-[1.02]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100/50">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'w-2.5 h-2.5 rounded-full',
            id === 'TODO' && 'bg-slate-400',
            id === 'IN_PROGRESS' && 'bg-blue-500',
            id === 'REVIEW' && 'bg-amber-500',
            id === 'DONE' && 'bg-emerald-500'
          )} />
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <span className={cn(
            'flex h-5 min-w-5 items-center justify-center rounded-full px-2 text-xs font-bold',
            colors.badge,
            colors.badgeText
          )}>
            {count}
          </span>
        </div>
        <button
          onClick={onAddClick}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-600 hover:shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Cards Container */}
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3 min-h-[200px]">
        {children}
        {count === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              <Plus className="h-5 w-5" />
            </div>
            <p className="text-sm">업무 없음</p>
          </div>
        )}
      </div>
    </div>
  );
}
