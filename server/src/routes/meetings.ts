import { Router, Response, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import type { Permission } from '../types/index.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// MeetingStatus 타입 정의 (Prisma 마이그레이션 전까지 사용)
type MeetingStatus = 'DRAFT' | 'PUBLISHED';

const router = Router();
const prisma = new PrismaClient();

// 업로드 디렉토리 설정
const uploadsDir = path.join(process.cwd(), 'uploads', 'meetings');

// 디렉토리가 없으면 생성
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// 멤버 정보 조회 헬퍼 함수
async function getMemberInfo(memberId: number) {
  const member = await prisma.member.findUnique({
    where: { id: String(memberId) },
    select: { id: true, name: true, avatarUrl: true, department: true, position: true }
  });
  return member ? { ...member, id: Number(member.id) } : null;
}

// 프로젝트 정보 조회 헬퍼 함수
async function getProjectInfo(projectId: number | null) {
  if (!projectId) return null;
  const project = await prisma.project.findUnique({
    where: { id: String(projectId) },
    select: { id: true, name: true }
  });
  return project ? { ...project, id: Number(project.id) } : null;
}

// 회의자료 목록
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, authorId, attendeeId, status, startDate, endDate, search } = req.query;

    const where: Record<string, unknown> = {};

    // 필터 조건
    if (projectId) where.projectId = Number(projectId);
    if (authorId) where.authorId = Number(authorId);
    if (status) where.status = status;

    // 날짜 범위 필터
    if (startDate || endDate) {
      where.meetingDate = {};
      if (startDate) (where.meetingDate as Record<string, unknown>).gte = new Date(startDate as string);
      if (endDate) (where.meetingDate as Record<string, unknown>).lte = new Date(endDate as string);
    }

    // 검색어 필터
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { summary: { contains: search } }
      ];
    }

    // 참석자 필터 (별도 처리 필요)
    let meetingIds: number[] | undefined;
    if (attendeeId) {
      const attendeeRecords = await prisma.meetingAttendee.findMany({
        where: { memberId: Number(attendeeId) },
        select: { meetingId: true }
      });
      meetingIds = attendeeRecords.map((a: { meetingId: number }) => a.meetingId);
      where.id = { in: meetingIds };
    }

    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        attendees: true,
        _count: { select: { attachments: true, comments: true } }
      },
      orderBy: { meetingDate: 'desc' }
    });

    // 각 회의에 대해 author, project, attendee member 정보 추가
    const meetingsWithRelations = await Promise.all(
      meetings.map(async (meeting) => {
        const author = await getMemberInfo(meeting.authorId);
        const project = await getProjectInfo(meeting.projectId);

        // 참석자들의 멤버 정보 조회
        const attendeesWithMembers = await Promise.all(
          meeting.attendees.map(async (attendee) => {
            const member = await getMemberInfo(attendee.memberId);
            return {
              ...attendee,
              member
            };
          })
        );

        return {
          ...meeting,
          author,
          project,
          attendees: attendeesWithMembers
        };
      })
    );

    res.json(meetingsWithRelations);
  } catch (error) {
    console.error('Meeting list error:', error);
    res.status(500).json({ error: '회의자료 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 회의자료 상세
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        attendees: true,
        attachments: true,
        comments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!meeting) {
      res.status(404).json({ error: '회의자료를 찾을 수 없습니다.' });
      return;
    }

    // author, project 정보 추가
    const author = await getMemberInfo(meeting.authorId);
    const project = await getProjectInfo(meeting.projectId);

    // 참석자들의 멤버 정보 조회
    const attendeesWithMembers = await Promise.all(
      meeting.attendees.map(async (attendee) => {
        const member = await getMemberInfo(attendee.memberId);
        return {
          ...attendee,
          member
        };
      })
    );

    // 댓글 작성자 정보 조회
    const commentsWithAuthors = await Promise.all(
      meeting.comments.map(async (comment) => {
        const commentAuthor = await getMemberInfo(comment.authorId);
        return {
          ...comment,
          author: commentAuthor
        };
      })
    );

    res.json({
      ...meeting,
      author,
      project,
      attendees: attendeesWithMembers,
      comments: commentsWithAuthors
    });
  } catch (error) {
    console.error('Meeting detail error:', error);
    res.status(500).json({ error: '회의자료 조회 중 오류가 발생했습니다.' });
  }
});

// 회의자료 생성
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, meetingDate, location, projectId, content, summary, attendeeIds, status } = req.body;

    // member.id가 String이므로 Number로 변환
    const authorId = Number(req.member!.id);

    const meeting = await prisma.meeting.create({
      data: {
        title,
        meetingDate: new Date(meetingDate),
        location,
        projectId: projectId ? Number(projectId) : null,
        content,
        summary,
        authorId,
        status: (status as MeetingStatus) || 'DRAFT',
        attendees: {
          create: (attendeeIds || []).map((memberId: number) => ({
            memberId: Number(memberId)
          }))
        }
      },
      include: {
        attendees: true,
        _count: { select: { attachments: true, comments: true } }
      }
    });

    // author, project, attendees member 정보 추가
    const author = await getMemberInfo(meeting.authorId);
    const project = await getProjectInfo(meeting.projectId);

    const attendeesWithMembers = await Promise.all(
      meeting.attendees.map(async (attendee) => {
        const member = await getMemberInfo(attendee.memberId);
        return {
          ...attendee,
          member
        };
      })
    );

    res.status(201).json({
      ...meeting,
      author,
      project,
      attendees: attendeesWithMembers
    });
  } catch (error) {
    console.error('Meeting creation error:', error);
    res.status(500).json({ error: '회의자료 생성 중 오류가 발생했습니다.' });
  }
});

// 회의자료 수정
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, meetingDate, location, projectId, content, summary, attendeeIds, status } = req.body;
    const meetingId = Number(req.params.id);

    // 작성자 또는 관리자만 수정 가능
    const existing = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { authorId: true }
    });

    if (!existing) {
      res.status(404).json({ error: '회의자료를 찾을 수 없습니다.' });
      return;
    }

    const currentMemberId = Number(req.member!.id);
    const isAdmin = req.member!.permissions &&
      (req.member!.permissions as unknown as Record<string, Record<string, boolean>>).system?.manage_settings;

    if (existing.authorId !== currentMemberId && !isAdmin) {
      res.status(403).json({ error: '수정 권한이 없습니다.' });
      return;
    }

    // 기존 참석자 삭제 후 새로 생성
    if (attendeeIds !== undefined) {
      await prisma.meetingAttendee.deleteMany({
        where: { meetingId }
      });
    }

    const meeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        title,
        meetingDate: meetingDate ? new Date(meetingDate) : undefined,
        location,
        projectId: projectId !== undefined ? (projectId ? Number(projectId) : null) : undefined,
        content,
        summary,
        status: status as MeetingStatus,
        ...(attendeeIds !== undefined && {
          attendees: {
            create: attendeeIds.map((memberId: number) => ({
              memberId: Number(memberId)
            }))
          }
        })
      },
      include: {
        attendees: true,
        _count: { select: { attachments: true, comments: true } }
      }
    });

    // author, project, attendees member 정보 추가
    const author = await getMemberInfo(meeting.authorId);
    const project = await getProjectInfo(meeting.projectId);

    const attendeesWithMembers = await Promise.all(
      meeting.attendees.map(async (attendee) => {
        const member = await getMemberInfo(attendee.memberId);
        return {
          ...attendee,
          member
        };
      })
    );

    res.json({
      ...meeting,
      author,
      project,
      attendees: attendeesWithMembers
    });
  } catch (error) {
    console.error('Meeting update error:', error);
    res.status(500).json({ error: '회의자료 수정 중 오류가 발생했습니다.' });
  }
});

// 회의자료 삭제
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meetingId = Number(req.params.id);

    // 작성자 또는 관리자만 삭제 가능
    const existing = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { authorId: true }
    });

    if (!existing) {
      res.status(404).json({ error: '회의자료를 찾을 수 없습니다.' });
      return;
    }

    const currentMemberId = Number(req.member!.id);
    const isAdmin = req.member!.permissions &&
      (req.member!.permissions as unknown as Record<string, Record<string, boolean>>).system?.manage_settings;

    if (existing.authorId !== currentMemberId && !isAdmin) {
      res.status(403).json({ error: '삭제 권한이 없습니다.' });
      return;
    }

    // 첨부파일 삭제
    const attachments = await prisma.meetingAttachment.findMany({
      where: { meetingId }
    });

    for (const attachment of attachments) {
      const filePath = path.join(uploadsDir, attachment.storedName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.meeting.delete({
      where: { id: meetingId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Meeting deletion error:', error);
    res.status(500).json({ error: '회의자료 삭제 중 오류가 발생했습니다.' });
  }
});

// 첨부파일 업로드
router.post('/:id/attachments', authenticate, upload.array('files', 10), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    const meetingId = Number(req.params.id);

    if (!files || files.length === 0) {
      res.status(400).json({ error: '파일이 없습니다.' });
      return;
    }

    // 회의자료 존재 확인
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId }
    });

    if (!meeting) {
      // 업로드된 파일 삭제
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      res.status(404).json({ error: '회의자료를 찾을 수 없습니다.' });
      return;
    }

    const attachments = await Promise.all(
      files.map(file =>
        prisma.meetingAttachment.create({
          data: {
            meetingId,
            fileName: file.originalname,
            storedName: file.filename,
            filePath: `/uploads/meetings/${file.filename}`,
            fileSize: file.size,
            mimeType: file.mimetype
          }
        })
      )
    );

    res.status(201).json(attachments);
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: '파일 업로드 중 오류가 발생했습니다.' });
  }
});

// 첨부파일 삭제
router.delete('/:id/attachments/:attachmentId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const attachmentId = Number(req.params.attachmentId);

    const attachment = await prisma.meetingAttachment.findUnique({
      where: { id: attachmentId }
    });

    if (!attachment) {
      res.status(404).json({ error: '첨부파일을 찾을 수 없습니다.' });
      return;
    }

    // 회의 정보 조회하여 작성자 확인
    const meeting = await prisma.meeting.findUnique({
      where: { id: attachment.meetingId },
      select: { authorId: true }
    });

    if (!meeting) {
      res.status(404).json({ error: '회의자료를 찾을 수 없습니다.' });
      return;
    }

    // 작성자 또는 관리자만 삭제 가능
    const currentMemberId = Number(req.member!.id);
    const isAdmin = req.member!.permissions &&
      (req.member!.permissions as unknown as Record<string, Record<string, boolean>>).system?.manage_settings;

    if (meeting.authorId !== currentMemberId && !isAdmin) {
      res.status(403).json({ error: '삭제 권한이 없습니다.' });
      return;
    }

    // 파일 삭제
    const filePath = path.join(uploadsDir, attachment.storedName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.meetingAttachment.delete({
      where: { id: attachmentId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ error: '파일 삭제 중 오류가 발생했습니다.' });
  }
});

// 댓글 목록
router.get('/:id/comments', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meetingId = Number(req.params.id);

    const comments = await prisma.meetingComment.findMany({
      where: { meetingId },
      orderBy: { createdAt: 'desc' }
    });

    // 각 댓글에 작성자 정보 추가
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await getMemberInfo(comment.authorId);
        return {
          ...comment,
          author
        };
      })
    );

    res.json(commentsWithAuthors);
  } catch (error) {
    console.error('Comments list error:', error);
    res.status(500).json({ error: '댓글 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 댓글 작성
router.post('/:id/comments', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content } = req.body;
    const meetingId = Number(req.params.id);
    const authorId = Number(req.member!.id);

    const comment = await prisma.meetingComment.create({
      data: {
        meetingId,
        authorId,
        content
      }
    });

    // 작성자 정보 추가
    const author = await getMemberInfo(comment.authorId);

    res.status(201).json({
      ...comment,
      author
    });
  } catch (error) {
    console.error('Comment creation error:', error);
    res.status(500).json({ error: '댓글 작성 중 오류가 발생했습니다.' });
  }
});

// 댓글 삭제
router.delete('/:id/comments/:commentId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const commentId = Number(req.params.commentId);

    const comment = await prisma.meetingComment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
      return;
    }

    // 작성자 또는 관리자만 삭제 가능
    const currentMemberId = Number(req.member!.id);
    const isAdmin = req.member!.permissions &&
      (req.member!.permissions as unknown as Record<string, Record<string, boolean>>).system?.manage_settings;

    if (comment.authorId !== currentMemberId && !isAdmin) {
      res.status(403).json({ error: '삭제 권한이 없습니다.' });
      return;
    }

    await prisma.meetingComment.delete({
      where: { id: commentId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Comment deletion error:', error);
    res.status(500).json({ error: '댓글 삭제 중 오류가 발생했습니다.' });
  }
});

export default router;
