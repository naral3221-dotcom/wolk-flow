import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Header } from '@/components/layout/Header';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { projectsApi, tasksApi, membersApi } from '@/services/api';
import type { Project, Task, TaskStatus, Member } from '@/types';
import Button from '@/components/ui/Button';
import { TaskModal } from '@/components/modals';
import type { TaskFormData } from '@/components/modals';
import { Plus, LayoutGrid, GanttChart, List } from 'lucide-react';
import { Link } from 'react-router-dom';

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'TODO', title: '예정' },
  { id: 'IN_PROGRESS', title: '진행중' },
  { id: 'REVIEW', title: '검토중' },
  { id: 'DONE', title: '완료' },
];

export function KanbanBoard() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('TODO');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    async function fetchData() {
      if (!projectId) return;
      try {
        const [projectData, tasksData, membersData] = await Promise.all([
          projectsApi.get(projectId),
          tasksApi.list({ projectId }),
          membersApi.list(),
        ]);
        setProject(projectData);
        setTasks(tasksData);
        setMembers(membersData);
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [projectId]);

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks
      .filter((task) => task.status === status)
      .sort((a, b) => a.order - b.order);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Find the target column
    let newStatus: TaskStatus;
    if (COLUMNS.some((col) => col.id === overId)) {
      newStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (!overTask) return;
      newStatus = overTask.status;
    }

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      )
    );

    try {
      await tasksApi.updateStatus(taskId, newStatus);
    } catch (error) {
      console.error('Status update error:', error);
      // Revert on error
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: task.status } : t
        )
      );
    }
  };

  const handleAddTask = (status: TaskStatus) => {
    setDefaultStatus(status);
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskSubmit = async (data: TaskFormData) => {
    if (!projectId) return;

    // For now, just add to local state (mock mode)
    const newTask: Task = {
      id: `task-${Date.now()}`,
      projectId,
      title: data.title,
      description: data.description,
      status: selectedTask ? data.status : defaultStatus,
      priority: data.priority,
      assignee: members.find(m => m.id === data.assigneeId),
      startDate: data.startDate,
      dueDate: data.dueDate,
      folderUrl: data.folderUrl,
      order: tasks.filter(t => t.status === (selectedTask ? data.status : defaultStatus)).length,
      labels: [],
      _count: { subtasks: 0, comments: 0 },
      project: { id: projectId, name: project?.name || '' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (selectedTask) {
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, ...newTask, id: t.id } : t));
    } else {
      setTasks(prev => [...prev, newTask]);
    }

    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Header
        title={project?.name || '프로젝트'}
        subtitle="칸반 보드로 업무를 관리합니다"
      />

      {/* Navigation Bar */}
      <div className="bg-white border-b px-6 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <Link to={`/projects/${projectId}/board`}>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-white text-blue-600 shadow-sm">
                <LayoutGrid className="h-4 w-4" />
                보드
              </button>
            </Link>
            <Link to={`/projects/${projectId}/timeline`}>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-all">
                <GanttChart className="h-4 w-4" />
                타임라인
              </button>
            </Link>
            <Link to={`/projects/${projectId}/list`}>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-all">
                <List className="h-4 w-4" />
                리스트
              </button>
            </Link>
          </div>
          <Button size="sm" className="gap-2 gradient-primary shadow-md" onClick={() => handleAddTask('TODO')}>
            <Plus className="h-4 w-4" />
            업무 추가
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-5 h-full min-w-max">
            {COLUMNS.map((column) => {
              const columnTasks = getTasksByStatus(column.id);
              return (
                <SortableContext
                  key={column.id}
                  items={columnTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <KanbanColumn
                    id={column.id}
                    title={column.title}
                    count={columnTasks.length}
                    onAddClick={() => handleAddTask(column.id)}
                  >
                    {columnTasks.map((task) => (
                      <KanbanCard
                        key={task.id}
                        task={task}
                        onClick={() => handleEditTask(task)}
                      />
                    ))}
                  </KanbanColumn>
                </SortableContext>
              );
            })}
          </div>

          <DragOverlay>
            {activeTask && <KanbanCard task={activeTask} isDragging />}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        onSubmit={handleTaskSubmit}
        task={selectedTask}
        members={members}
      />
    </div>
  );
}
