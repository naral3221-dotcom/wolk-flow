import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// 로그인
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const member = await prisma.member.findUnique({
      where: { email },
      include: { role: true }
    });

    if (!member || !member.password) {
      res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      return;
    }

    const isValid = await bcrypt.compare(password, member.password);
    if (!isValid) {
      res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      return;
    }

    const token = jwt.sign(
      { memberId: member.id, email: member.email, roleId: member.roleId },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      member: {
        id: member.id,
        email: member.email,
        name: member.name,
        avatarUrl: member.avatarUrl,
        department: member.department,
        position: member.position,
        role: member.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '로그인 중 오류가 발생했습니다.' });
  }
});

// 현재 사용자 정보
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: req.member!.id },
      include: { role: true }
    });

    if (!member) {
      res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      return;
    }

    res.json({
      id: member.id,
      email: member.email,
      name: member.name,
      avatarUrl: member.avatarUrl,
      department: member.department,
      position: member.position,
      role: member.role
    });
  } catch (error) {
    res.status(500).json({ error: '사용자 정보 조회 중 오류가 발생했습니다.' });
  }
});

export default router;
