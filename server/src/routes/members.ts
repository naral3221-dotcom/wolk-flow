import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// 팀원 목록
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const members = await prisma.member.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        department: true,
        position: true,
        role: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });

    res.json(members);
  } catch (error) {
    res.status(500).json({ error: '팀원 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 팀원 상세
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        department: true,
        position: true,
        role: true,
        createdAt: true
      }
    });

    if (!member) {
      res.status(404).json({ error: '팀원을 찾을 수 없습니다.' });
      return;
    }

    res.json(member);
  } catch (error) {
    res.status(500).json({ error: '팀원 조회 중 오류가 발생했습니다.' });
  }
});

// 팀원별 업무
router.get('/:id/tasks', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await prisma.task.findMany({
      where: { assigneeId: req.params.id },
      include: {
        project: { select: { id: true, name: true } },
        labels: { include: { label: true } }
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }]
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: '팀원 업무 조회 중 오류가 발생했습니다.' });
  }
});

// 팀원 업무량
router.get('/:id/workload', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await prisma.task.groupBy({
      by: ['status'],
      where: { assigneeId: req.params.id },
      _count: { id: true }
    });

    const workload = {
      todo: 0,
      inProgress: 0,
      review: 0,
      done: 0
    };

    tasks.forEach(t => {
      switch (t.status) {
        case 'TODO': workload.todo = t._count.id; break;
        case 'IN_PROGRESS': workload.inProgress = t._count.id; break;
        case 'REVIEW': workload.review = t._count.id; break;
        case 'DONE': workload.done = t._count.id; break;
      }
    });

    res.json(workload);
  } catch (error) {
    res.status(500).json({ error: '업무량 조회 중 오류가 발생했습니다.' });
  }
});

export default router;
