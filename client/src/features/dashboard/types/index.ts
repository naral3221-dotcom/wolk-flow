import type { Task, DashboardStats as GlobalDashboardStats, TeamProgress } from '@/types';

// Re-export from global types
export type DashboardStats = GlobalDashboardStats;

// Team member progress with task stats
export interface TeamMemberProgress extends TeamProgress {
    id: string;
    name: string;
    taskStats: {
        todo: number;
        inProgress: number;
        review: number;
        done: number;
    };
}

// Activity feed item (별도 정의, ActivityLog와 유사하지만 단순화된 버전)
export interface ActivityItem {
    id: string;
    action: string;
    member: {
        id: string;
        name: string;
    };
    task?: {
        id: string;
        title: string;
        project?: { id: string; name: string };
    };
    createdAt: string;
}

// Dashboard data interface
export interface DashboardData {
    stats: DashboardStats | null;
    myTasks: Task[];
    teamProgress: TeamMemberProgress[];
    activities: ActivityItem[];
}

// Welcome messages
export const WELCOME_MESSAGES = [
    "업무가 당신을 기다리고 있어요. 도망치지 마세요.",
    "커피 한 잔과 함께 오늘의 업무를 정복해보세요.",
    "퇴근까지 앞으로... 아, 그건 안 알려드릴게요.",
    "오늘도 야근 없는 하루가 되길 빕니다.",
    "일단 업무부터... 아니, 커피부터 뽑아볼까요?",
    "어서와, 어제의 '내일 할게'가 바로 오늘이야!",
    "할 일이 없으면 좋겠지만... 있네요.",
] as const;
