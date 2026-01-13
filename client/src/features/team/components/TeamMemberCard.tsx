import { motion } from 'framer-motion';
import { Mail, MessageSquare, CheckCircle2, Clock, AlertCircle, MoreHorizontal } from 'lucide-react';
import { FlipCard, FlipCardFace } from '@/presentation/components/effects/FlipCard';
import type { Member } from '@/types';

interface MemberWithStats extends Member {
  taskStats: {
    todo: number;
    inProgress: number;
    review: number;
    done: number;
    total: number;
  };
  isOnline: boolean;
}

interface TeamMemberCardProps {
  member: MemberWithStats;
  onContact?: (member: Member) => void;
  onViewTasks?: (member: Member) => void;
}

export function TeamMemberCard({ member, onContact, onViewTasks }: TeamMemberCardProps) {
  const completionRate = member.taskStats.total > 0
    ? Math.round((member.taskStats.done / member.taskStats.total) * 100)
    : 0;

  const roleBadgeColor = getRoleBadgeColor(member.role?.name || member.position);

  const frontFace = (
    <FlipCardFace className="p-0!">
      <div className="relative w-full h-full p-6 flex flex-col items-center justify-center gap-4">
        {/* Online Status Indicator */}
        <motion.div
          className={`absolute top-4 right-4 w-3 h-3 rounded-full ${
            member.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
          }`}
          animate={member.isOnline ? {
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1],
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Avatar */}
        <div className="relative">
          <motion.div
            className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20"
            whileHover={{ scale: 1.05 }}
          >
            {member.avatarUrl ? (
              <img
                src={member.avatarUrl}
                alt={member.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold">
                {member.name.charAt(0)}
              </div>
            )}
          </motion.div>

          {/* Glow effect on hover */}
          <motion.div
            className="absolute -inset-2 rounded-full opacity-0 -z-10"
            style={{
              background: 'radial-gradient(circle, rgba(0, 255, 255, 0.3) 0%, transparent 70%)',
            }}
            whileHover={{ opacity: 1 }}
          />
        </div>

        {/* Name & Role */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white">{member.name}</h3>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleBadgeColor}`}
            >
              {member.role?.name || member.position || '팀원'}
            </span>
          </div>
          {member.department && (
            <p className="text-sm text-white/60 mt-1">{member.department}</p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-sm text-white/60">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>{member.taskStats.inProgress}</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{member.taskStats.done}</span>
          </div>
        </div>
      </div>
    </FlipCardFace>
  );

  const backFace = (
    <FlipCardFace gradient="from-slate-900/95 to-violet-900/30">
      <div className="w-full h-full p-5 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-white/80">업무 현황</h4>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewTasks?.(member);
            }}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <MoreHorizontal className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Task Stats */}
        <div className="space-y-2 flex-1">
          <StatBar label="대기중" value={member.taskStats.todo} color="bg-slate-400" />
          <StatBar label="진행중" value={member.taskStats.inProgress} color="bg-cyan-400" />
          <StatBar label="검토중" value={member.taskStats.review} color="bg-amber-400" />
          <StatBar label="완료" value={member.taskStats.done} color="bg-emerald-400" />
        </div>

        {/* Completion Rate */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">완료율</span>
            <span className="text-white font-semibold">{completionRate}%</span>
          </div>
          <div className="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-linear-to-r from-cyan-400 to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onContact?.(member);
            }}
            className="flex-1 flex items-center justify-center gap-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/80 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Mail className="w-4 h-4" />
            <span>이메일</span>
          </motion.button>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="flex-1 flex items-center justify-center gap-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/80 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <MessageSquare className="w-4 h-4" />
            <span>메시지</span>
          </motion.button>
        </div>
      </div>
    </FlipCardFace>
  );

  return (
    <FlipCard
      width="100%"
      height={280}
      flipOnHover
      enableTilt
      className="group"
      front={frontFace}
      back={backFace}
    />
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  const maxValue = 10; // For visualization purposes
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-white/50 w-12">{label}</span>
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs text-white/70 w-6 text-right">{value}</span>
    </div>
  );
}

function getRoleBadgeColor(role?: string): string {
  const roleColors: Record<string, string> = {
    '관리자': 'bg-violet-500/30 text-violet-300 border border-violet-400/30',
    '매니저': 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/30',
    '리더': 'bg-amber-500/30 text-amber-300 border border-amber-400/30',
    '개발자': 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/30',
    '디자이너': 'bg-pink-500/30 text-pink-300 border border-pink-400/30',
    '기획자': 'bg-blue-500/30 text-blue-300 border border-blue-400/30',
  };

  return roleColors[role || ''] || 'bg-slate-500/30 text-slate-300 border border-slate-400/30';
}

// Mini card for compact views
export function TeamMemberMiniCard({ member }: { member: MemberWithStats }) {
  return (
    <motion.div
      className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
          {member.avatarUrl ? (
            <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
              {member.name.charAt(0)}
            </div>
          )}
        </div>
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
            member.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{member.name}</p>
        <p className="text-xs text-white/50 truncate">{member.position || '팀원'}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-white/60">
        <AlertCircle className="w-3 h-3 text-cyan-400" />
        <span>{member.taskStats.inProgress}</span>
      </div>
    </motion.div>
  );
}
