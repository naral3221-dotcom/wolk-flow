import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import type { TaskPriority, TaskStatus } from '@/types';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        {
          'bg-blue-50 text-blue-700 ring-blue-600/20': variant === 'default',
          'bg-gray-50 text-gray-600 ring-gray-500/20': variant === 'secondary',
          'bg-green-50 text-green-700 ring-green-600/20': variant === 'success',
          'bg-amber-50 text-amber-700 ring-amber-600/20': variant === 'warning',
          'bg-red-50 text-red-700 ring-red-600/20': variant === 'destructive',
        },
        className
      )}
      {...props}
    />
  );
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const config = {
    TODO: { label: '예정', variant: 'secondary' as const },
    IN_PROGRESS: { label: '진행중', variant: 'default' as const },
    REVIEW: { label: '검토', variant: 'warning' as const },
    DONE: { label: '완료', variant: 'success' as const },
  };

  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const config = {
    LOW: { label: '낮음', variant: 'secondary' as const },
    MEDIUM: { label: '보통', variant: 'default' as const },
    HIGH: { label: '높음', variant: 'warning' as const },
    URGENT: { label: '긴급', variant: 'destructive' as const },
  };

  const { label, variant } = config[priority];
  return <Badge variant={variant}>{label}</Badge>;
}
