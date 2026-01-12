import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { dashboardApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { getRelativeTime } from '@/lib/utils';
import type { DashboardStats, Task, TeamProgress, ActivityLog } from '@/types';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  ArrowRight,
  Activity,
} from 'lucide-react';

export function Dashboard() {
  const { member } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [teamProgress, setTeamProgress] = useState<TeamProgress[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, tasksData, progressData, activitiesData] = await Promise.all([
          dashboardApi.summary(),
          dashboardApi.myTasks(),
          dashboardApi.teamProgress(),
          dashboardApi.recentActivities(),
        ]);
        setStats(statsData);
        setMyTasks(tasksData);
        setTeamProgress(progressData);
        setActivities(activitiesData);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Header title="대시보드" subtitle="팀 업무 현황을 한눈에 확인하세요" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats + Welcome */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Welcome */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-gray-500 text-sm">안녕하세요,</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">
              {member?.name || '사용자'}님
            </p>
            <p className="text-sm text-gray-500 mt-3">
              현재 <span className="font-medium text-blue-600">{stats?.inProgress || 0}개</span>의 업무가 진행중입니다.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.inProgress || 0}</p>
              <p className="text-xs text-gray-500">진행중</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.done || 0}</p>
              <p className="text-xs text-gray-500">완료</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.overdue || 0}</p>
              <p className="text-xs text-gray-500">지연</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Tasks */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">내 업무</CardTitle>
              <Link
                to="/projects"
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                전체보기 <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {myTasks.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 text-sm">할당된 업무가 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {myTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-200"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {task.project?.name}
                          </span>
                          {task.dueDate && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(task.dueDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge status={task.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                팀 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teamProgress.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 text-sm">팀원이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamProgress.slice(0, 5).map((memberItem) => {
                    const total = memberItem.taskStats.todo + memberItem.taskStats.inProgress + memberItem.taskStats.review + memberItem.taskStats.done;
                    const donePercent = total > 0 ? (memberItem.taskStats.done / total) * 100 : 0;

                    return (
                      <div key={memberItem.id}>
                        <div className="flex items-center gap-3 mb-1.5">
                          <Avatar name={memberItem.name} size="sm" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-900">{memberItem.name}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {memberItem.taskStats.done}/{total}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${donePercent}%` }}
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

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-400" />
              최근 활동
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 text-sm">최근 활동이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 6).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 py-2"
                  >
                    <Avatar name={activity.member.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.member.name}</span>
                        <span className="text-gray-500 ml-1">
                          {activity.action === 'created' && '업무를 생성했습니다'}
                          {activity.action === 'updated' && '업무를 수정했습니다'}
                          {activity.action === 'moved' && '업무 상태를 변경했습니다'}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {activity.task?.title}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {getRelativeTime(activity.createdAt)}
                    </span>
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
