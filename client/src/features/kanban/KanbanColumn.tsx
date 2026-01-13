import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Plus, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  color?: string;
  children: ReactNode;
  onAddClick?: () => void;
}

const columnColors: Record<string, {
  bg: string;
  bgHover: string;
  border: string;
  borderHover: string;
  badge: string;
  badgeText: string;
  dot: string;
  glow: string;
  header: string;
}> = {
  TODO: {
    bg: 'bg-slate-50/70',
    bgHover: 'bg-slate-100/80',
    border: 'border-slate-200/60',
    borderHover: 'border-slate-300',
    badge: 'bg-slate-600',
    badgeText: 'text-white',
    dot: 'bg-linear-to-br from-slate-400 to-slate-500',
    glow: 'ring-slate-400/30',
    header: 'from-slate-100/80 to-slate-50/50',
  },
  IN_PROGRESS: {
    bg: 'bg-blue-50/70',
    bgHover: 'bg-blue-100/80',
    border: 'border-blue-200/60',
    borderHover: 'border-blue-300',
    badge: 'bg-blue-600',
    badgeText: 'text-white',
    dot: 'bg-linear-to-br from-blue-400 to-blue-500',
    glow: 'ring-blue-400/30',
    header: 'from-blue-100/80 to-blue-50/50',
  },
  REVIEW: {
    bg: 'bg-amber-50/70',
    bgHover: 'bg-amber-100/80',
    border: 'border-amber-200/60',
    borderHover: 'border-amber-300',
    badge: 'bg-amber-600',
    badgeText: 'text-white',
    dot: 'bg-linear-to-br from-amber-400 to-amber-500',
    glow: 'ring-amber-400/30',
    header: 'from-amber-100/80 to-amber-50/50',
  },
  DONE: {
    bg: 'bg-emerald-50/70',
    bgHover: 'bg-emerald-100/80',
    border: 'border-emerald-200/60',
    borderHover: 'border-emerald-300',
    badge: 'bg-emerald-600',
    badgeText: 'text-white',
    dot: 'bg-linear-to-br from-emerald-400 to-emerald-500',
    glow: 'ring-emerald-400/30',
    header: 'from-emerald-100/80 to-emerald-50/50',
  },
};

export function KanbanColumn({ id, title, count, children, onAddClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const colors = columnColors[id] || columnColors.TODO;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-80 flex-col rounded-2xl border-2 transition-all duration-300',
        colors.bg,
        colors.border,
        isOver && `${colors.bgHover} ${colors.borderHover} ring-4 ring-offset-2 ${colors.glow} scale-[1.02]`
      )}
    >
      {/* Header - 더 명확한 시각 계층 */}
      <div className={cn(
        'flex items-center justify-between px-5 py-4 border-b border-gray-100/50 rounded-t-2xl',
        `bg-linear-to-b ${colors.header}`,
        'backdrop-blur-sm'
      )}>
        <div className="flex items-center gap-3">
          {/* 상태 표시 점 - 그라디언트 */}
          <div className={cn(
            'w-3 h-3 rounded-full shadow-sm',
            colors.dot
          )} />

          <h3 className="font-bold text-[15px] text-gray-800">{title}</h3>

          {/* 카운트 배지 - 더 돋보이게 */}
          <span className={cn(
            'flex h-6 min-w-6 items-center justify-center rounded-full px-2.5 text-xs font-bold shadow-sm',
            colors.badge,
            colors.badgeText
          )}>
            {count}
          </span>
        </div>

        {/* 추가 버튼 - 더 명확한 호버 효과 */}
        <button
          onClick={onAddClick}
          className="rounded-xl p-2 text-gray-400 hover:bg-white hover:text-gray-700 hover:shadow-md transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Cards Container - 더 나은 스크롤 경험 */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 min-h-[300px]">
        {children}

        {/* Empty state - 더 매력적인 디자인 */}
        {count === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className={cn(
              'w-16 h-16 rounded-2xl bg-linear-to-br from-gray-100 to-white flex items-center justify-center mb-3 shadow-sm border-2',
              colors.border
            )}>
              <Inbox className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">업무 없음</p>
            <button
              onClick={onAddClick}
              className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              첫 업무 추가하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
