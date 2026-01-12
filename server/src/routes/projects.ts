import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, checkPermission, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// 프로젝트 목록
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: req.member!.id },
          { members: { some: { memberId: req.member!.id } } }
        ]
      },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        members: {
          include: {
            member: { select: { id: true, name: true, avatarUrl: true } }
          }
        },
        _count: { select: { tasks: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: '프로젝트 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 프로젝트 생성
router.post('/', authenticate, checkPermission('project.create'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, startDate, endDate } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        ownerId: req.member!.id,
        members: {
          create: {
            memberId: req.member!.id,
            role: 'OWNER'
          }
        }
      },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        members: {
          include: {
            member: { select: { id: true, name: true, avatarUrl: true } }
          }
        }
      }
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: '프로젝트 생성 중 오류가 발생했습니다.' });
  }
});

// 프로젝트 상세
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        members: {
          include: {
            member: { select: { id: true, name: true, avatarUrl: true, department: true, position: true } }
          }
        },
        labels: true,
        _count: { select: { tasks: true } }
      }
    });

    if (!project) {
      res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
      return;
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: '프로젝트 조회 중 오류가 발생했습니다.' });
  }
});

// 프로젝트 수정
router.put('/:id', authenticate, checkPermission('project.edit'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, status, startDate, endDate } = req.body;

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        members: {
          include: {
            member: { select: { id: true, name: true, avatarUrl: true } }
          }
        }
      }
    });

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: '프로젝트 수정 중 오류가 발생했습니다.' });
  }
});

// 프로젝트 삭제
router.delete('/:id', authenticate, checkPermission('project.delete'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.project.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: '프로젝트 삭제 중 오류가 발생했습니다.' });
  }
});

// 프로젝트 멤버 추가
router.post('/:id/members', authenticate, checkPermission('project.manage_members'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { memberId, role } = req.body;

    const projectMember = await prisma.projectMember.create({
      data: {
        projectId: req.params.id,
        memberId,
        role: role || 'VIEWER'
      },
      include: {
        member: { select: { id: true, name: true, avatarUrl: true } }
      }
    });

    res.status(201).json(projectMember);
  } catch (error) {
    res.status(500).json({ error: '멤버 추가 중 오류가 발생했습니다.' });
  }
});

// 프로젝트 멤버 제거
router.delete('/:id/members/:memberId', authenticate, checkPermission('project.manage_members'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.projectMember.delete({
      where: {
        projectId_memberId: {
          projectId: req.params.id,
          memberId: req.params.memberId
        }
      }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: '멤버 제거 중 오류가 발생했습니다.' });
  }
});

export default router;
