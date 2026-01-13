import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/authStore';
import { getRelativeTime } from '@/lib/utils';
import { useDashboard } from './hooks/useDashboard';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  ArrowRight,
  Activity,
  TrendingUp,
  Sparkles,
  CalendarDays,
} from 'lucide-react';

export function Dashboard() {
  const { member } = useAuthStore();
  const { data, loading } = useDashboard();
  const { stats, myTasks, teamProgress, activities } = data;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-base text-gray-500 animate-pulse">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <Header title="대시보드" subtitle="팀 업무 현황을 한눈에 확인하세요" />

      <div className="flex-1 overflow-auto p-8 space-y-8">
        {/* Stats + Welcome */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Welcome Card - 히어로 스타일 */}
          <div className="lg:col-span-2 relative overflow-hidden rounded-2xl gradient-hero p-8 text-white shadow-xl shadow-blue-500/20">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-blue-200" />
                <p className="text-blue-100 text-base font-medium">안녕하세요,</p>
              </div>
              <p className="text-3xl font-bold">
                {member?.name || '사용자'}님
              </p>
              <div className="mt-6 flex items-center gap-4 bg-white/15 backdrop-blur-sm rounded-xl px-5 py-4 border border-white/20">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-blue-100">진행중인 업무</p>
                  <p className="text-2xl font-bold">{stats?.inProgress || 0}개</p>
                </div>
              </div>
            </div>

            {/* 배경 장식 */}
            <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -right-4 -bottom-8 w-36 h-36 bg-purple-400/20 rounded-full blur-2xl" />
            <div className="absolute left-1/2 -bottom-4 w-28 h-28 bg-blue-300/20 rounded-full blur-xl" />
          </div>

          {/* Stats Cards - 모던 스타일 */}
          <StatCard
            icon={Clock}
            value={stats?.inProgress || 0}
            label="진행중"
            color="blue"
          />
          <StatCard
            icon={CheckCircle2}
            value={stats?.done || 0}
            label="완료"
            color="green"
          />
          <StatCard
            icon={AlertCircle}
            value={stats?.overdue || 0}
            label="지연"
            color="red"
          />
        </div>

        {/* Main Content - 내 업무 + 팀 현황 */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* My Tasks - 3/5 너비 */}
          <Card className="xl:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-5">
              <CardTitle className="text-lg font-bold flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                내 업무
                <span className="ml-2 text-sm font-medium text-gray-400">
                  {myTasks.length}개
                </span>
              </CardTitle>
              <Link
                to="/projects"
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2 font-semibold transition-colors group bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100"
              >
                전체보기
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {myTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
                    <CheckCircle2 className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-lg text-gray-500 font-medium">할당된 업무가 없습니다</p>
                  <p className="text-sm text-gray-400 mt-2">새 업무가 할당되면 여기에 표시됩니다</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {myTasks.slice(0, 5).map((task, index) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between py-5 px-6 hover:bg-blue-50/50 transition-all cursor-pointer group animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex-1 min-w-0 mr-6">
                        <p className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-sm text-gray-600 font-medium bg-gray-100 px-3 py-1.5 rounded-lg">
                            {task.project?.name}
                          </span>
                          {task.dueDate && (
                            <span className="text-sm text-gray-500 flex items-center gap-1.5 font-medium">
                              <CalendarDays className="h-4 w-4 text-gray-400" />
                              {new Date(task.dueDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge status={task.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Progress - 2/5 너비 */}
          <Card className="xl:col-span-2">
            <CardHeader className="border-b border-gray-100 pb-5">
              <CardTitle className="text-lg font-bold flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                팀 현황
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {teamProgress.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">팀원이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {teamProgress.slice(0, 5).map((memberItem, index) => {
                    const total = memberItem.taskStats.todo + memberItem.taskStats.inProgress + memberItem.taskStats.review + memberItem.taskStats.done;
                    const donePercent = total > 0 ? (memberItem.taskStats.done / total) * 100 : 0;

                    return (
                      <div
                        key={memberItem.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar name={memberItem.name} size="md" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-bold text-gray-900">{memberItem.name}</span>
                          </div>
                          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                            {memberItem.taskStats.done}/{total}
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: `${donePercent}%`,
                              background: `linear-gradient(90deg, #22c55e 0%, #16a34a 100%)`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity - 전체 너비 */}
        <Card>
          <CardHeader className="border-b border-gray-100 pb-5">
            <CardTitle className="text-lg font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-amber-600" />
              </div>
              최근 활동
              <span className="ml-2 text-sm font-medium text-gray-400">
                최근 7일
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <Activity className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">최근 활동이 없습니다</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activities.slice(0, 6).map((activity, index) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors animate-fade-in border border-gray-100"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Avatar name={activity.member.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-base text-gray-900 font-bold">
                          {activity.member.name}
                        </p>
                        <span className="text-sm text-gray-400 font-medium">
                          {getRelativeTime(activity.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {activity.action === 'created' && '업무를 생성했습니다'}
                        {activity.action === 'updated' && '업무를 수정했습니다'}
                        {activity.action === 'moved' && '업무 상태를 변경했습니다'}
                      </p>
                      <p className="text-sm text-gray-800 truncate mt-3 font-semibold bg-white px-3 py-2 rounded-lg border border-gray-200">
                        {activity.task?.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 통계 카드 컴포넌트
interface StatCardProps {
  icon: React.ElementType;
  value: number;
  label: string;
  color: 'blue' | 'green' | 'red' | 'amber';
}

function StatCard({ icon: Icon, value, label, color }: StatCardProps) {
  const colorClasses = {
    blue: {
      bg: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-500/30',
      hover: 'group-hover:shadow-blue-500/40',
      text: 'group-hover:text-blue-600',
      bgLight: 'from-blue-50/80 to-transparent',
    },
    green: {
      bg: 'from-green-500 to-green-600',
      shadow: 'shadow-green-500/30',
      hover: 'group-hover:shadow-green-500/40',
      text: 'group-hover:text-green-600',
      bgLight: 'from-green-50/80 to-transparent',
    },
    red: {
      bg: 'from-red-500 to-red-600',
      shadow: 'shadow-red-500/30',
      hover: 'group-hover:shadow-red-500/40',
      text: 'group-hover:text-red-600',
      bgLight: 'from-red-50/80 to-transparent',
    },
    amber: {
      bg: 'from-amber-500 to-amber-600',
      shadow: 'shadow-amber-500/30',
      hover: 'group-hover:shadow-amber-500/40',
      text: 'group-hover:text-amber-600',
      bgLight: 'from-amber-50/80 to-transparent',
    },
  };

  const classes = colorClasses[color];

  return (
    <div className="group relative bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden cursor-pointer hover:-translate-y-1">
      {/* 배경 그라디언트 */}
      <div className={`absolute inset-0 bg-linear-to-br ${classes.bgLight} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="relative flex items-center gap-5">
        <div className={`w-14 h-14 rounded-xl bg-linear-to-br ${classes.bg} flex items-center justify-center shadow-lg ${classes.shadow} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
        <div>
          <p className={`text-4xl font-bold text-gray-900 ${classes.text} transition-colors duration-300`}>
            {value}
          </p>
          <p className="text-base text-gray-500 font-medium mt-1">{label}</p>
        </div>
      </div>

      {/* 호버 인디케이터 */}
      <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className={`h-5 w-5 ${classes.text.replace('group-hover:', '')}`} />
      </div>
    </div>
  );
}
