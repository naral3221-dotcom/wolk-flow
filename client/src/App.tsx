import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Layout } from '@/components/layout/Layout';
import { Login } from '@/features/auth/Login';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { ProjectList } from '@/features/projects/ProjectList';
import { KanbanBoard } from '@/features/kanban/KanbanBoard';
import { TaskList } from '@/features/tasks/TaskList';
import { GanttChart } from '@/features/gantt/GanttChart';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/:projectId/board" element={<KanbanBoard />} />
          <Route path="projects/:projectId/list" element={<TaskList />} />
          <Route path="projects/:projectId/timeline" element={<GanttChart />} />
          <Route path="members" element={<div className="p-6">팀원 관리 페이지 (개발 예정)</div>} />
          <Route path="settings" element={<div className="p-6">설정 페이지 (개발 예정)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
