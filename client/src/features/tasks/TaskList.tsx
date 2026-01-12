import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { projectsApi, tasksApi } from '@/services/api';
import { formatDate, cn } from '@/lib/utils';
import type { Project, Task } from '@/types';
import { Plus, LayoutGrid, GanttChart, List, FolderOpen, ChevronDown, ChevronUp, Clock, Search, Filter, MoreHorizontal } from 'lucide-react';

export function TaskList() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<'title' | 'status' | 'priority' | 'dueDate'>('status');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSort = (field: typeof sortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const modifier = sortOrder === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'title':
        return a.title.localeCompare(b.title) * modifier;
      case 'status':
        const statusOrder = { TODO: 0, IN_PROGRESS: 1, REVIEW: 2, DONE: 3 };
        return (statusOrder[a.status] - statusOrder[b.status]) * modifier;
      case 'priority':
        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return (priorityOrder[a.priority] - priorityOrder[b.priority]) * modifier;
      case 'dueDate':
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * modifier;
      default:
        return 0;
    }
  });

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <div className="w-4 h-4" />;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ChevronDown className="h-4 w-4 text-blue-600" />
    );
  };

  const isOverdue = (date: string) => new Date(date) < new Date();

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
        subtitle="업무 목록을 테이블 형태로 관리합니다"
      />

      {/* Navigation Bar */}
      <div className="bg-white border-b px-6 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <Link to={`/projects/${projectId}/board`}>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-all">
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
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-white text-blue-600 shadow-sm">
                <List className="h-4 w-4" />
                리스트
              </button>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="업무 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              필터
            </Button>
            <Button size="sm" className="gap-2 gradient-primary shadow-md hover:shadow-lg">
              <Plus className="h-4 w-4" />
              업무 추가
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center gap-2">
                    업무명
                    <SortIcon field="title" />
                  </div>
                </th>
                <th
                  className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    상태
                    <SortIcon field="status" />
                  </div>
                </th>
                <th
                  className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center gap-2">
                    우선순위
                    <SortIcon field="priority" />
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  담당자
                </th>
                <th
                  className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('dueDate')}
                >
                  <div className="flex items-center gap-2">
                    마감일
                    <SortIcon field="dueDate" />
                  </div>
                </th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  폴더
                </th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedTasks.map((task, index) => (
                <tr
                  key={task.id}
                  className={cn(
                    'group hover:bg-blue-50/50 transition-colors cursor-pointer',
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-1 h-10 rounded-full mt-0.5',
                        task.priority === 'URGENT' && 'bg-red-500',
                        task.priority === 'HIGH' && 'bg-orange-500',
                        task.priority === 'MEDIUM' && 'bg-blue-500',
                        task.priority === 'LOW' && 'bg-gray-400',
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </p>
                        {task.labels && task.labels.length > 0 && (
                          <div className="flex gap-1.5 mt-1.5">
                            {task.labels.map(({ label }) => (
                              <span
                                key={label.id}
                                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white shadow-sm"
                                style={{ backgroundColor: label.color }}
                              >
                                {label.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="px-4 py-4">
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td className="px-4 py-4">
                    {task.assignee ? (
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={task.assignee.name}
                          src={task.assignee.avatarUrl}
                          size="sm"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {task.assignee.name}
                          </span>
                          {task.assignee.position && (
                            <p className="text-xs text-gray-400">{task.assignee.position}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">미배정</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {task.dueDate ? (
                      <div className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm',
                        isOverdue(task.dueDate) && task.status !== 'DONE'
                          ? 'bg-red-50 text-red-600'
                          : 'text-gray-600'
                      )}>
                        {isOverdue(task.dueDate) && task.status !== 'DONE' && (
                          <Clock className="h-3.5 w-3.5" />
                        )}
                        <span className="font-medium">{formatDate(task.dueDate)}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {task.folderUrl ? (
                      <a
                        href={task.folderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FolderOpen className="h-4 w-4" />
                      </a>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sortedTasks.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <List className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">
                {searchQuery ? '검색 결과가 없습니다' : '업무가 없습니다'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {searchQuery ? '다른 검색어로 시도해보세요' : '새로운 업무를 추가해보세요'}
              </p>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <p>
            총 <span className="font-semibold text-gray-900">{sortedTasks.length}</span>개의 업무
            {searchQuery && ` (검색: "${searchQuery}")`}
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" /> 예정 {tasks.filter(t => t.status === 'TODO').length}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> 진행중 {tasks.filter(t => t.status === 'IN_PROGRESS').length}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> 검토중 {tasks.filter(t => t.status === 'REVIEW').length}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> 완료 {tasks.filter(t => t.status === 'DONE').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
