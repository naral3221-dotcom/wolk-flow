import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { projectsApi } from '@/services/api';
import { formatDate, cn } from '@/lib/utils';
import { ProjectModal } from '@/components/modals';
import type { ProjectFormData } from '@/components/modals';
import type { Project } from '@/types';
import { Plus, Calendar, Users, CheckSquare, FolderKanban, MoreHorizontal, TrendingUp } from 'lucide-react';

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const data = await projectsApi.list();
        setProjects(data);
      } catch (error) {
        console.error('Projects fetch error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const statusConfig = {
    ACTIVE: { label: '진행중', color: 'bg-blue-100 text-blue-700' },
    COMPLETED: { label: '완료', color: 'bg-emerald-100 text-emerald-700' },
    ON_HOLD: { label: '보류', color: 'bg-amber-100 text-amber-700' },
    ARCHIVED: { label: '보관됨', color: 'bg-gray-100 text-gray-700' },
  };

  const handleProjectSubmit = (data: ProjectFormData) => {
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: data.name,
      description: data.description,
      status: data.status,
      startDate: data.startDate,
      endDate: data.endDate,
      members: [],
      _count: { tasks: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (selectedProject) {
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, ...newProject, id: p.id } : p));
    } else {
      setProjects(prev => [...prev, newProject]);
    }

    setIsProjectModalOpen(false);
    setSelectedProject(null);
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
      <Header title="프로젝트" subtitle="모든 프로젝트를 관리합니다" />

      <div className="flex-1 overflow-auto p-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FolderKanban className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                <p className="text-xs text-gray-500">전체 프로젝트</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.filter(p => p.status === 'ACTIVE').length}
                </p>
                <p className="text-xs text-gray-500">진행중</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <CheckSquare className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.reduce((acc, p) => acc + (p._count?.tasks || 0), 0)}
                </p>
                <p className="text-xs text-gray-500">전체 업무</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600 font-medium">프로젝트 목록</p>
          <Button className="gap-2 gradient-primary shadow-md" onClick={() => setIsProjectModalOpen(true)}>
            <Plus className="h-4 w-4" />
            새 프로젝트
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <FolderKanban className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2 font-medium">프로젝트가 없습니다</p>
            <p className="text-sm text-gray-400 mb-6">첫 프로젝트를 생성하여 시작하세요</p>
            <Button className="gradient-primary shadow-md" onClick={() => setIsProjectModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              첫 프로젝트 만들기
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project, index) => {
              const config = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.ACTIVE;

              return (
                <Link key={project.id} to={`/projects/${project.id}/board`}>
                  <Card
                    className={cn(
                      'h-full bg-white border-0 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group hover:-translate-y-1 overflow-hidden',
                      'animate-fade-in'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Color Bar */}
                    <div className={cn(
                      'h-1.5 w-full',
                      project.status === 'ACTIVE' && 'bg-linear-to-r from-blue-500 to-blue-600',
                      project.status === 'COMPLETED' && 'bg-linear-to-r from-emerald-500 to-emerald-600',
                      project.status === 'ON_HOLD' && 'bg-linear-to-r from-amber-500 to-amber-600',
                    )} />

                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                            {project.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                              {project.name}
                            </h3>
                            <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', config.color)}>
                              {config.label}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>

                      {project.description && (
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2 pl-13">
                          {project.description}
                        </p>
                      )}

                      <div className="space-y-2.5 text-sm text-gray-500">
                        {(project.startDate || project.endDate) && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>
                              {project.startDate && formatDate(project.startDate)}
                              {project.startDate && project.endDate && ' ~ '}
                              {project.endDate && formatDate(project.endDate)}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{project._count?.tasks || 0}</span>
                          <span>개의 업무</span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <div className="flex -space-x-2">
                              {project.members?.slice(0, 4).map((pm) => (
                                <Avatar
                                  key={pm.id}
                                  name={pm.member.name}
                                  src={pm.member.avatarUrl}
                                  size="sm"
                                  className="ring-2 ring-white"
                                />
                              ))}
                              {(project.members?.length || 0) > 4 && (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium ring-2 ring-white">
                                  +{(project.members?.length || 0) - 4}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-blue-600 font-medium group-hover:underline">
                            보드 열기 →
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setSelectedProject(null);
        }}
        onSubmit={handleProjectSubmit}
        project={selectedProject}
      />
    </div>
  );
}
