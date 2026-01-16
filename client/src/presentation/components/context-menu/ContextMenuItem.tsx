import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/core/utils/cn';

export interface ContextMenuItemProps {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

export function ContextMenuItem({
  label,
  icon: Icon,
  onClick,
  variant = 'default',
  disabled = false,
}: ContextMenuItemProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-neon-violet/50',
        variant === 'default' && [
          'text-gray-200 hover:bg-white/10 hover:text-white',
          disabled && 'text-gray-500 cursor-not-allowed hover:bg-transparent hover:text-gray-500',
        ],
        variant === 'danger' && [
          'text-red-400 hover:bg-red-500/15 hover:text-red-300',
          disabled && 'text-red-800 cursor-not-allowed hover:bg-transparent hover:text-red-800',
        ]
      )}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      {Icon && (
        <Icon
          className={cn(
            'w-4 h-4 flex-shrink-0',
            variant === 'danger' ? 'text-red-400' : 'text-gray-400'
          )}
        />
      )}
      <span className="flex-1 text-left">{label}</span>
    </motion.button>
  );
}
