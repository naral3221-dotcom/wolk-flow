import { useState, useEffect } from 'react';
import { SpatialCard } from '@/presentation/components/ui/SpatialCard';
import { NeonButton } from '@/presentation/components/ui/NeonButton';
import { adminApi } from '@/services/api';
import type { AuthUser, CreateUserInput } from '@/types';

export function AdminPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState<AuthUser | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '사용자 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDeleteUser = async (user: AuthUser) => {
    if (!confirm(`정말 ${user.name}님의 계정을 삭제하시겠습니까?`)) return;

    try {
      await adminApi.deleteUser(user.id);
      setUsers(users.filter((u) => u.id !== user.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  };

  const handleToggleActive = async (user: AuthUser) => {
    try {
      await adminApi.updateUser(user.id, { isActive: !user.isActive });
      setUsers(users.map((u) =>
        u.id === user.id ? { ...u, isActive: !u.isActive } : u
      ));
    } catch (err) {
      alert(err instanceof Error ? err.message : '상태 변경에 실패했습니다.');
    }
  };

  const handleResetPassword = async (user: AuthUser) => {
    try {
      const newPassword = await adminApi.resetPassword(user.id);
      setTempPassword(newPassword);
      setShowResetModal(user);
    } catch (err) {
      alert(err instanceof Error ? err.message : '비밀번호 초기화에 실패했습니다.');
    }
  };

  return (
    <div className="h-full overflow-auto space-y-6 p-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">사용자 관리</h1>
          <p className="text-gray-400 mt-1">팀원 계정을 생성하고 관리합니다</p>
        </div>
        <NeonButton onClick={() => setShowCreateModal(true)}>
          + 새 계정 생성
        </NeonButton>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400">
          {error}
        </div>
      )}

      {/* User List */}
      <SpatialCard className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">로딩 중...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">이름</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">아이디</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">부서</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">직책</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">권한</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">상태</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                        {user.name.charAt(0)}
                      </div>
                      <span className="text-white font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{user.username}</td>
                  <td className="px-6 py-4 text-gray-400">{user.department || '-'}</td>
                  <td className="px-6 py-4 text-gray-400">{user.position || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.userRole === 'admin'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {user.userRole === 'admin' ? '관리자' : '멤버'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.isActive
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {user.isActive ? '활성' : '비활성'}
                    </span>
                    {user.mustChangePassword && (
                      <span className="ml-2 px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                        비번변경필요
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResetPassword(user)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                      >
                        비밀번호 초기화
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                          user.isActive
                            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        }`}
                      >
                        {user.isActive ? '비활성화' : '활성화'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SpatialCard>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(user, password) => {
            setUsers([user, ...users]);
            setShowCreateModal(false);
            setTempPassword(password);
            setShowResetModal(user);
          }}
        />
      )}

      {/* Password Display Modal */}
      {showResetModal && tempPassword && (
        <PasswordDisplayModal
          user={showResetModal}
          password={tempPassword}
          onClose={() => {
            setShowResetModal(null);
            setTempPassword(null);
          }}
        />
      )}
    </div>
  );
}

// 사용자 생성 모달
function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (user: AuthUser, tempPassword: string) => void;
}) {
  const [form, setForm] = useState<CreateUserInput>({
    username: '',
    name: '',
    password: '123456789',
    email: '',
    department: '',
    position: '',
    role: 'member',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user, tempPassword } = await adminApi.createUser(form);
      onCreated(user, tempPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : '계정 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6">새 계정 생성</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                아이디 (로그인용) *
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                placeholder="예: 홍길동"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                이름 *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                placeholder="예: 홍길동"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              초기 비밀번호
            </label>
            <input
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              placeholder="기본값: 123456789"
            />
            <p className="text-xs text-gray-500 mt-1">
              비워두면 기본 비밀번호 123456789가 설정됩니다
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                부서
              </label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                placeholder="예: 물리치료실"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                직책
              </label>
              <input
                type="text"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                placeholder="예: 물리치료사"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              이메일 (선택)
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              권한
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'member' })}
              className="w-full rounded-lg border border-white/10 bg-slate-700 px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="member">멤버</option>
              <option value="admin">관리자</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-colors"
            >
              취소
            </button>
            <NeonButton type="submit" disabled={loading}>
              {loading ? '생성 중...' : '계정 생성'}
            </NeonButton>
          </div>
        </form>
      </div>
    </div>
  );
}

// 비밀번호 표시 모달
function PasswordDisplayModal({
  user,
  password,
  onClose,
}: {
  user: AuthUser;
  password: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`아이디: ${user.username}\n비밀번호: ${password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">계정 정보</h2>
          <p className="text-gray-400 text-sm mt-1">
            {user.name}님에게 아래 정보를 전달해주세요
          </p>
        </div>

        <div className="bg-white/5 rounded-lg p-4 mb-6">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">아이디</p>
              <p className="text-white font-mono text-lg">{user.username}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">초기 비밀번호</p>
              <p className="text-white font-mono text-lg">{password}</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-yellow-400 text-center mb-4">
          첫 로그인 시 비밀번호 변경이 필요합니다
        </p>

        <div className="flex gap-3">
          <button
            onClick={copyToClipboard}
            className="flex-1 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
          >
            {copied ? '복사됨!' : '복사하기'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
