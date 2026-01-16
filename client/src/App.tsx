import { useEffect } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AppShell } from "@/presentation/components/layout/AppShell";
import { LevitatingSidebar } from "@/presentation/components/layout/LevitatingSidebar";
import { Dashboard } from "@/presentation/pages/Dashboard";
import { MyTasksPage } from "@/presentation/pages/MyTasksPage";
import { KanbanBoard } from "@/presentation/pages/KanbanBoard";
import { ProjectsPage } from "@/presentation/pages/ProjectsPage";
import { TeamPage } from "@/presentation/pages/TeamPage";
import { SettingsPage } from "@/presentation/pages/SettingsPage";
import { AdminPage } from "@/presentation/pages/AdminPage";
import { SpatialCard } from "@/presentation/components/ui/SpatialCard";
import { ToastContainer } from "@/presentation/components/ui/Toast";
import { ModalProvider } from "@/presentation/components/modals";
import { Login } from "@/features/auth/Login";
import { useTaskStore } from "@/stores/taskStore";
import { useProjectStore } from "@/stores/projectStore";
import { useMemberStore } from "@/stores/memberStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useAuthStore } from "@/stores/authStore";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

// 인증 필요 라우트 래퍼
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// 관리자 전용 라우트 래퍼
function AdminRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAdmin = useAuthStore((state) => state.isAdmin);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AuthenticatedApp() {
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);
  const fetchMembers = useMemberStore((state) => state.fetchMembers);
  const initializeTheme = useSettingsStore((state) => state.initializeTheme);

  // Initialize session timeout management
  useSessionTimeout();

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchMembers();
    initializeTheme();
  }, [fetchTasks, fetchProjects, fetchMembers, initializeTheme]);

  return (
    <ModalProvider>
      <AppShell>
        <LevitatingSidebar />

        <main className="flex-1 h-full overflow-hidden p-4 relative z-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/my-tasks" element={<MyTasksPage />} />
            <Route path="/tasks" element={<KanbanBoard />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            } />
            <Route path="*" element={
              <div className="h-full flex items-center justify-center">
                <SpatialCard className="p-12 text-center">
                  <h1 className="text-6xl font-bold text-neon-violet mb-4">404</h1>
                  <p className="text-xl text-white mb-2">페이지를 찾을 수 없습니다</p>
                  <p className="text-gray-400">요청하신 페이지가 존재하지 않습니다.</p>
                </SpatialCard>
              </div>
            } />
          </Routes>
        </main>
      </AppShell>
    </ModalProvider>
  );
}

function App() {
  const basename = import.meta.env.PROD ? '/secrets/workflow' : '/';

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <AuthenticatedApp />
          </ProtectedRoute>
        } />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
