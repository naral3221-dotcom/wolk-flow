import { Router, Response } from 'express';
import { PrismaClient, TaskStatus } from '@prisma/client';
import { authenticate, checkPermission, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// 업무 목록 (프로젝트별)
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, status, assigneeId } = req.query;

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        reporter: { select: { id: true, name: true, avatarUrl: true } },
        labels: { include: { label: true } },
        _count: { select: { subtasks: true, comments: true } }
      },
      orderBy: [{ status: 'asc' }, { order: 'asc' }]
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: '업무 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 업무 생성
router.post('/', authenticate, checkPermission('task.create'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, title, description, priority, assigneeId, startDate, dueDate, parentId, folderUrl } = req.body;

    // 마지막 순서 가져오기
    const lastTask = await prisma.task.findFirst({
      where: { projectId, status: 'TODO' },
      orderBy: { order: 'desc' }
    });

    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description,
        priority: priority || 'MEDIUM',
        assigneeId,
        reporterId: req.member!.id,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        parentId,
        folderUrl,
        order: (lastTask?.order || 0) + 1
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        reporter: { select: { id: true, name: true, avatarUrl: true } },
        labels: { include: { label: true } }
      }
    });

    // 활동 로그 기록
    await prisma.activityLog.create({
      data: {
        taskId: task.id,
        memberId: req.member!.id,
        action: 'created',
        details: { title: task.title }
      }
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Task creation error:', error);
    res.status(500).json({ error: '업무 생성 중 오류가 발생했습니다.' });
  }
});

// 업무 상세
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true, department: true, position: true } },
        reporter: { select: { id: true, name: true, avatarUrl: true } },
        labels: { include: { label: true } },
        subtasks: {
          include: {
            assignee: { select: { id: true, name: true, avatarUrl: true } }
          }
        },
        comments: {
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!task) {
      res.status(404).json({ error: '업무를 찾을 수 없습니다.' });
      return;
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: '업무 조회 중 오류가 발생했습니다.' });
  }
});

// 업무 수정
router.put('/:id', authenticate, checkPermission('task.edit'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, priority, assigneeId, startDate, dueDate, estimatedHours, actualHours, folderUrl } = req.body;

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        priority,
        assigneeId,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours,
        actualHours,
        folderUrl
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        reporter: { select: { id: true, name: true, avatarUrl: true } },
        labels: { include: { label: true } }
      }
    });

    // 활동 로그 기록
    await prisma.activityLog.create({
      data: {
        taskId: task.id,
        memberId: req.member!.id,
        action: 'updated',
        details: { title: task.title }
      }
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: '업무 수정 중 오류가 발생했습니다.' });
  }
});

// 업무 상태 변경 (칸반 이동)
router.patch('/:id/status', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, order } = req.body;

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        status: status as TaskStatus,
        order: order || 0
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } }
      }
    });

    // 활동 로그 기록
    await prisma.activityLog.create({
      data: {
        taskId: task.id,
        memberId: req.member!.id,
        action: 'moved',
        details: { status: task.status }
      }
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: '상태 변경 중 오류가 발생했습니다.' });
  }
});

// 업무 순서 변경
router.patch('/:id/order', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { order } = req.body;

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { order }
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: '순서 변경 중 오류가 발생했습니다.' });
  }
});

// 업무 삭제
router.delete('/:id', authenticate, checkPermission('task.delete'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.task.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: '업무 삭제 중 오류가 발생했습니다.' });
  }
});

// 댓글 목록
router.get('/:id/comments', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const comments = await prisma.comment.findMany({
      where: { taskId: req.params.id },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: '댓글 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 댓글 작성
router.post('/:id/comments', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content } = req.body;

    const comment = await prisma.comment.create({
      data: {
        taskId: req.params.id,
        authorId: req.member!.id,
        content
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } }
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: '댓글 작성 중 오류가 발생했습니다.' });
  }
});

export default router;
