import { useState, useEffect, useCallback } from 'react';
import { projectsApi, tasksApi, membersApi } from '@/services/api';
import type { Project, Task, TaskStatus, Member } from '@/types';

interface UseKanbanReturn {
  project: Project | null;
  tasks: Task[];
  members: Member[];
  loading: boolean;
  error: Error | null;
  getTasksByStatus: (status: TaskStatus) => Task[];
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, data: Partial<Task>) => void;
  refetch: () => Promise<void>;
}

export function useKanban(projectId: string | undefined): UseKanbanReturn {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      const [projectData, tasksData, membersData] = await Promise.all([
        projectsApi.get(projectId),
        tasksApi.list({ projectId }),
        membersApi.list(),
      ]);

      setProject(projectData);
      setTasks(tasksData);
      setMembers(membersData);
    } catch (err) {
      console.error('Kanban fetch error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch kanban data'));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getTasksByStatus = useCallback(
    (status: TaskStatus) => {
      return tasks
        .filter((task) => task.status === status)
        .sort((a, b) => a.order - b.order);
    },
    [tasks]
  );

  const updateTaskStatus = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.status === newStatus) return;

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      try {
        await tasksApi.updateStatus(taskId, newStatus);
      } catch (err) {
        console.error('Status update error:', err);
        // Revert on error
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
        );
        throw err;
      }
    },
    [tasks]
  );

  const addTask = useCallback((task: Task) => {
    setTasks((prev) => [...prev, task]);
  }, []);

  const updateTask = useCallback((taskId: string, data: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...data } : t))
    );
  }, []);

  return {
    project,
    tasks,
    members,
    loading,
    error,
    getTasksByStatus,
    updateTaskStatus,
    addTask,
    updateTask,
    refetch: fetchData,
  };
}
