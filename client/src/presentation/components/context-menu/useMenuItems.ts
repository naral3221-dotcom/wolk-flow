import { useMemo } from 'react';
import {
  Edit3,
  Trash2,
  FolderPlus,
  ListPlus,
  Eye,
  Users,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTeamStore } from '@/stores/teamStore';
import { useRoutineStore } from '@/stores/routineStore';
import type { ContextMenuItemProps } from './ContextMenuItem';

type MenuItemConfig = Omit<ContextMenuItemProps, 'onClick'> & {
  action: () => void;
};

export function useMenuItems() {
  const {
    contextMenu,
    closeContextMenu,
    openCreateTaskModal,
    openEditTaskModal,
    openCreateProjectModal,
    openEditProjectModal,
    openProjectProgressModal,
    openEditTeamModal,
    openTeamMemberModal,
    openEditRoutineModal,
    openConfirmModal,
  } = useUIStore();

  const deleteTask = useTaskStore((state) => state.deleteTask);
  const updateTaskStatus = useTaskStore((state) => state.updateTaskStatus);
  const deleteProject = useProjectStore((state) => state.deleteProject);
  const deleteTeam = useTeamStore((state) => state.deleteTeam);
  const { toggleComplete: toggleRoutineComplete, deleteRoutine } = useRoutineStore();

  const menuItems = useMemo((): MenuItemConfig[] => {
    const { type, data } = contextMenu;

    const withClose = (action: () => void) => () => {
      closeContextMenu();
      action();
    };

    // 빈 공간 우클릭
    if (type === 'empty') {
      const items: MenuItemConfig[] = [
        {
          label: '새 업무 추가',
          icon: ListPlus,
          action: withClose(() => openCreateTaskModal(data?.projectId)),
        },
        {
          label: '새 프로젝트 추가',
          icon: FolderPlus,
          action: withClose(() => openCreateProjectModal()),
        },
      ];
      return items;
    }

    // Task 우클릭
    if (type === 'task' && data?.task) {
      const task = data.task;
      const isDone = task.status === 'DONE';
      return [
        {
          label: isDone ? '완료 취소' : '완료 처리',
          icon: isDone ? XCircle : CheckCircle,
          action: withClose(() => updateTaskStatus(task.id, isDone ? 'TODO' : 'DONE')),
        },
        {
          label: '업무 상세보기/수정',
          icon: Edit3,
          action: withClose(() => openEditTaskModal(task)),
        },
        {
          label: '업무 추가',
          icon: ListPlus,
          action: withClose(() => openCreateTaskModal(task.projectId)),
        },
        {
          label: '업무 삭제',
          icon: Trash2,
          variant: 'danger',
          action: withClose(() => {
            openConfirmModal({
              title: '업무 삭제',
              message: `"${task.title}" 업무를 삭제하시겠습니까? 하위 업무도 함께 삭제됩니다.`,
              confirmText: '삭제',
              variant: 'danger',
              onConfirm: () => deleteTask(task.id),
            });
          }),
        },
      ];
    }

    // Project 우클릭
    if (type === 'project' && data?.project) {
      const project = data.project;
      return [
        {
          label: '진행상황 보기',
          icon: Eye,
          action: withClose(() => openProjectProgressModal(project)),
        },
        {
          label: '프로젝트 수정',
          icon: Edit3,
          action: withClose(() => openEditProjectModal(project)),
        },
        {
          label: '업무 추가',
          icon: ListPlus,
          action: withClose(() => openCreateTaskModal(project.id)),
        },
        {
          label: '프로젝트 삭제',
          icon: Trash2,
          variant: 'danger',
          action: withClose(() => {
            openConfirmModal({
              title: '프로젝트 삭제',
              message: `"${project.name}" 프로젝트를 삭제하시겠습니까? 관련된 모든 업무도 함께 삭제됩니다.`,
              confirmText: '삭제',
              variant: 'danger',
              onConfirm: () => deleteProject(project.id),
            });
          }),
        },
      ];
    }

    // Team 우클릭
    if (type === 'team' && data?.team) {
      const team = data.team;
      return [
        {
          label: '팀 수정',
          icon: Edit3,
          action: withClose(() => openEditTeamModal(team)),
        },
        {
          label: '멤버 관리',
          icon: Users,
          action: withClose(() => openTeamMemberModal(team.id)),
        },
        {
          label: '팀 삭제',
          icon: Trash2,
          variant: 'danger',
          action: withClose(() => {
            openConfirmModal({
              title: '팀 삭제',
              message: `"${team.name}" 팀을 삭제하시겠습니까?`,
              confirmText: '삭제',
              variant: 'danger',
              onConfirm: () => deleteTeam(team.id),
            });
          }),
        },
      ];
    }

    // Routine 우클릭
    if (type === 'routine' && data?.routine) {
      const routine = data.routine;
      return [
        {
          label: routine.isCompletedToday ? '완료 취소' : '완료 처리',
          icon: routine.isCompletedToday ? XCircle : CheckCircle,
          action: withClose(() => toggleRoutineComplete(routine.id)),
        },
        {
          label: '루틴 수정',
          icon: Edit3,
          action: withClose(() => openEditRoutineModal(routine)),
        },
        {
          label: '루틴 삭제',
          icon: Trash2,
          variant: 'danger',
          action: withClose(() => {
            openConfirmModal({
              title: '루틴 삭제',
              message: `"${routine.title}" 루틴을 삭제하시겠습니까?`,
              confirmText: '삭제',
              variant: 'danger',
              onConfirm: () => deleteRoutine(routine.id),
            });
          }),
        },
      ];
    }

    return [];
  }, [
    contextMenu,
    closeContextMenu,
    openCreateTaskModal,
    openEditTaskModal,
    openCreateProjectModal,
    openEditProjectModal,
    openProjectProgressModal,
    openEditTeamModal,
    openTeamMemberModal,
    openEditRoutineModal,
    openConfirmModal,
    deleteTask,
    updateTaskStatus,
    deleteProject,
    deleteTeam,
    toggleRoutineComplete,
    deleteRoutine,
  ]);

  return menuItems;
}
