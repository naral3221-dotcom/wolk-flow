import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import { projectsApi, tasksApi } from '@/services/api';
import type { Project, Task } from '@/types';
import { Plus, LayoutGrid, GanttChart as GanttIcon, List, ChevronLeft, ChevronRight } from 'lucide-react';

export function GanttChart() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewStart, setViewStart] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      if (!projectId) return;
      try {
        const [projectData, tasksData] = await Promise.all([
          projectsApi.get(projectId),
          tasksApi.list({ projectId }),
        ]);
        setProject(projectData);
        setTasks(tasksData);
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [projectId]);

  // Generate days for the current view (30 days)
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(viewStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  const getTaskPosition = (task: Task) => {
    if (!task.startDate && !task.dueDate) return null;

    const start = task.startDate ? new Date(task.startDate) : new Date(task.dueDate!);
    const end = task.dueDate ? new Date(task.dueDate) : new Date(task.startDate!);

    const viewStartTime = viewStart.getTime();
    const dayWidth = 40; // pixels per day

    const startOffset = Math.floor((start.getTime() - viewStartTime) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    return {
      left: Math.max(0, startOffset * dayWidth),
      width: duration * dayWidth,
      isVisible: startOffset + duration > 0 && startOffset < 30,
    };
  };

  const statusColors = {
    TODO: 'bg-gray-400',
    IN_PROGRESS: 'bg-blue-500',
    REVIEW: 'bg-yellow-500',
    DONE: 'bg-green-500',
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setViewStart(today);
  };

  const moveView = (direction: 'prev' | 'next') => {
    const newStart = new Date(viewStart);
    newStart.setDate(newStart.getDate() + (direction === 'next' ? 7 : -7));
    setViewStart(newStart);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const tasksWithDates = tasks.filter((t) => t.startDate || t.dueDate);

  return (
    <div className="flex flex-col h-full">
      <Header
        title={project?.name || '프로젝트'}
        subtitle="타임라인으로 일정을 확인합니다"
      />

      <div className="border-b bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to={`/projects/${projectId}/board`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                보드
              </Button>
            </Link>
            <Link to={`/projects/${projectId}/timeline`}>
              <Button variant="secondary" size="sm" className="gap-2">
                <GanttIcon className="h-4 w-4" />
                타임라인
              </Button>
            </Link>
            <Link to={`/projects/${projectId}/list`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <List className="h-4 w-4" />
                리스트
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => moveView('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              오늘
            </Button>
            <Button variant="outline" size="sm" onClick={() => moveView('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              업무 추가
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="flex">
            {/* Task names column */}
            <div className="w-64 flex-shrink-0 border-r border-gray-200">
              <div className="h-12 border-b border-gray-200 bg-gray-50 px-4 flex items-center">
                <span className="text-sm font-medium text-gray-500">업무명</span>
              </div>
              {tasksWithDates.map((task) => (
                <div
                  key={task.id}
                  className="h-12 border-b border-gray-100 px-4 flex items-center"
                >
                  <span className="text-sm text-gray-900 truncate">{task.title}</span>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-x-auto" ref={scrollRef}>
              {/* Header with dates */}
              <div className="flex h-12 border-b border-gray-200 bg-gray-50">
                {days.map((day, i) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <div
                      key={i}
                      className={`w-10 flex-shrink-0 border-r border-gray-100 flex flex-col items-center justify-center text-xs ${
                        isWeekend ? 'bg-gray-100' : ''
                      } ${isToday ? 'bg-blue-50' : ''}`}
                    >
                      <span className={`font-medium ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                        {day.getDate()}
                      </span>
                      <span className="text-gray-400">
                        {['일', '월', '화', '수', '목', '금', '토'][day.getDay()]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Task bars */}
              {tasksWithDates.map((task) => {
                const position = getTaskPosition(task);
                return (
                  <div
                    key={task.id}
                    className="h-12 border-b border-gray-100 relative"
                    style={{ width: 30 * 40 }}
                  >
                    {/* Grid lines */}
                    {days.map((day, i) => {
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                      const isToday = day.toDateString() === new Date().toDateString();
                      return (
                        <div
                          key={i}
                          className={`absolute top-0 bottom-0 w-10 border-r border-gray-100 ${
                            isWeekend ? 'bg-gray-50' : ''
                          } ${isToday ? 'bg-blue-50/50' : ''}`}
                          style={{ left: i * 40 }}
                        />
                      );
                    })}

                    {/* Task bar */}
                    {position && position.isVisible && (
                      <div
                        className={`absolute top-2 h-8 rounded ${statusColors[task.status]} opacity-80 hover:opacity-100 cursor-pointer transition-opacity flex items-center px-2`}
                        style={{
                          left: position.left,
                          width: Math.max(position.width, 40),
                        }}
                        title={task.title}
                      >
                        <span className="text-xs text-white font-medium truncate">
                          {task.title}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {tasksWithDates.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              일정이 있는 업무가 없습니다
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-6 text-sm">
          <span className="text-gray-500">상태:</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-400" />
            <span className="text-gray-600">할 일</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-gray-600">진행중</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span className="text-gray-600">검토</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-gray-600">완료</span>
          </div>
        </div>
      </div>
    </div>
  );
}
