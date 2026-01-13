import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Mail, Shield } from 'lucide-react';
import { cn } from '@/core/utils/cn';
import { useMemberStore } from '@/stores/memberStore';
import { useUIStore } from '@/stores/uiStore';

const roleOptions = [
  { value: 'member', label: '팀원', description: '기본 권한' },
  { value: 'admin', label: '관리자', description: '전체 권한' },
];

export function InviteMemberModal() {
  const { isInviteMemberModalOpen, closeInviteMemberModal } = useUIStore();
  const { inviteMember } = useMemberStore();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await inviteMember(email, role);
      setSuccess(true);
      setTimeout(() => {
        setEmail('');
        setRole('member');
        setSuccess(false);
        closeInviteMemberModal();
      }, 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('member');
    setError(null);
    setSuccess(false);
    closeInviteMemberModal();
  };

  return (
    <AnimatePresence>
      {isInviteMemberModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-midnight-800/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-neon-cyan" />
                  팀원 초대
                </h2>
                <button
                  onClick={handleClose}
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

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm"
                  >
                    초대가 완료되었습니다!
                  </motion.div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    이메일 주소
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full px-4 py-3 bg-midnight-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 focus:border-neon-cyan/50 transition-all"
                    autoFocus
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Shield className="w-4 h-4 inline mr-2" />
                    역할
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {roleOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRole(option.value)}
                        className={cn(
                          'p-4 rounded-xl border text-left transition-all',
                          role === option.value
                            ? 'border-neon-cyan/50 bg-neon-cyan/10'
                            : 'border-white/10 bg-midnight-700/30 hover:bg-midnight-700/50'
                        )}
                      >
                        <div className="font-medium text-white">{option.label}</div>
                        <div className="text-xs text-gray-400 mt-1">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={loading || success}
                    className={cn(
                      'flex-1 px-4 py-3 rounded-xl font-medium transition-all',
                      'bg-linear-to-r from-neon-cyan to-neon-blue text-white',
                      'hover:shadow-lg hover:shadow-neon-cyan/25',
                      (loading || success) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {loading ? '초대 중...' : success ? '완료!' : '초대하기'}
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
