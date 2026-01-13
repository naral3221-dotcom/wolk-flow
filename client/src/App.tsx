import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "@/presentation/components/layout/AppShell";
import { LevitatingSidebar } from "@/presentation/components/layout/LevitatingSidebar";
import { Dashboard } from "@/presentation/pages/Dashboard";
import { KanbanBoard } from "@/presentation/pages/KanbanBoard";
import { GanttPage } from "@/presentation/pages/GanttPage";
import { TeamPage } from "@/presentation/pages/TeamPage";
import { SettingsPage } from "@/presentation/pages/SettingsPage";
import { SpatialCard } from "@/presentation/components/ui/SpatialCard";
import { ModalProvider } from "@/presentation/components/modals";
import { useTaskStore } from "@/stores/taskStore";
import { useProjectStore } from "@/stores/projectStore";
import { useMemberStore } from "@/stores/memberStore";

function App() {
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);
  const fetchMembers = useMemberStore((state) => state.fetchMembers);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchMembers();
  }, [fetchTasks, fetchProjects, fetchMembers]);

  return (
    <BrowserRouter>
      <ModalProvider>
      <AppShell>
        <LevitatingSidebar />

        <main className="flex-1 h-full overflow-hidden p-4 relative z-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<KanbanBoard />} />
            <Route path="/projects" element={<GanttPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/settings" element={<SettingsPage />} />
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
    </BrowserRouter>
  );
}

export default App;
