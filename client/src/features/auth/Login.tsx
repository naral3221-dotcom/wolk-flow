import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/services/api';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { token, user, mustChangePassword } = await authApi.login(username, password);
      login(token, user, mustChangePassword);

      // 비밀번호 변경 필요 시 설정 페이지로 이동
      if (mustChangePassword) {
        navigate('/settings?changePassword=true');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white text-2xl font-bold shadow-lg shadow-purple-500/30">
              W
            </div>
            <h1 className="text-2xl font-bold text-white">Workflow</h1>
            <p className="mt-2 text-gray-400">팀 업무 관리 시스템</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                아이디
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                placeholder="이름 또는 아이디"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg shadow-purple-500/25"
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-gray-500">
            <p>관리자에게 계정을 요청하세요</p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          Balance Lab Internal System
        </p>
      </div>
    </div>
  );
}
