import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// 전체 요약 통계
router.get('/summary', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalTasks, tasksByStatus, projectCount, memberCount] = await Promise.all([
      prisma.task.count(),
      prisma.task.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      prisma.project.count({ where: { status: 'ACTIVE' } }),
      prisma.member.count()
    ]);

    const stats = {
      total: totalTasks,
      todo: 0,
      inProgress: 0,
      review: 0,
      done: 0,
      projects: projectCount,
      members: memberCount
    };

    tasksByStatus.forEach(t => {
      switch (t.status) {
        case 'TODO': stats.todo = t._count.id; break;
        case 'IN_PROGRESS': stats.inProgress = t._count.id; break;
        case 'REVIEW': stats.review = t._count.id; break;
        case 'DONE': stats.done = t._count.id; break;
      }
    });

    // 지연된 업무 (마감일 지남 & 미완료)
    const overdue = await prisma.task.count({
      where: {
        dueDate: { lt: new Date() },
        status: { not: 'DONE' }
      }
    });

    res.json({ ...stats, overdue });
  } catch (error) {
    res.status(500).json({ error: '통계 조회 중 오류가 발생했습니다.' });
  }
});

// 내 업무 현황
router.get('/my-tasks', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: req.member!.id,
        status: { not: 'DONE' }
      },
      include: {
        project: { select: { id: true, name: true } },
        labels: { include: { label: true } }
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      take: 10
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: '내 업무 조회 중 오류가 발생했습니다.' });
  }
});

// 팀 진행 현황
router.get('/team-progress', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const members = await prisma.member.findMany({
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        department: true,
        _count: {
          select: {
            assignedTasks: true
          }
        }
      }
    });

    const progress = await Promise.all(
      members.map(async (member) => {
        const taskStats = await prisma.task.groupBy({
          by: ['status'],
          where: { assigneeId: member.id },
          _count: { id: true }
        });

        const stats = { todo: 0, inProgress: 0, review: 0, done: 0 };
        taskStats.forEach(t => {
          switch (t.status) {
            case 'TODO': stats.todo = t._count.id; break;
            case 'IN_PROGRESS': stats.inProgress = t._count.id; break;
            case 'REVIEW': stats.review = t._count.id; break;
            case 'DONE': stats.done = t._count.id; break;
          }
        });

        return {
          ...member,
          taskStats: stats,
          total: member._count.assignedTasks
        };
      })
    );

    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: '팀 진행 현황 조회 중 오류가 발생했습니다.' });
  }
});

// 최근 활동
router.get('/recent-activities', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activities = await prisma.activityLog.findMany({
      include: {
        member: { select: { id: true, name: true, avatarUrl: true } },
        task: { select: { id: true, title: true, project: { select: { id: true, name: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: '최근 활동 조회 중 오류가 발생했습니다.' });
  }
});

export default router;
