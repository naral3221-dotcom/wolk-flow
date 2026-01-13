import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '@/services/api';
import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';
import { useMemberStore } from '@/stores/memberStore';
import type { DashboardStats, Task, TeamProgress, ActivityLog } from '@/types';

interface DashboardData {
  stats: DashboardStats | null;
  myTasks: Task[];
  teamProgress: TeamProgress[];
  activities: ActivityLog[];
}

interface UseDashboardReturn {
  data: DashboardData;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  // Store의 tasks를 구독하여 변경 시 자동 갱신
  const storeTasks = useTaskStore((state) => state.tasks);
  const storeProjects = useProjectStore((state) => state.projects);
  const storeMembers = useMemberStore((state) => state.members);

  const [data, setData] = useState<DashboardData>({
    stats: null,
    myTasks: [],
    teamProgress: [],
    activities: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [stats, myTasks, teamProgress, activities] = await Promise.all([
        dashboardApi.summary(),
        dashboardApi.myTasks(),
        dashboardApi.teamProgress(),
        dashboardApi.recentActivities(),
      ]);

      setData({
        stats,
        myTasks,
        teamProgress,
        activities,
      });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch dashboard data'));
    } finally {
      setLoading(false);
    }
  }, []);

  // 최초 로드
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Store 데이터 변경 시 자동 갱신
  useEffect(() => {
    // 최초 로드 이후에만 갱신 (storeTasks가 비어있지 않을 때)
    if (storeTasks.length > 0 || storeProjects.length > 0 || storeMembers.length > 0) {
      fetchDashboard();
    }
  }, [storeTasks, storeProjects, storeMembers, fetchDashboard]);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboard,
  };
}
