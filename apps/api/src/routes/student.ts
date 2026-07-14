// apps/api/src/routes/student.ts
import { Router } from 'express';
import { z } from 'zod';
import * as studentService from '../services/student.service';
import { HireStatus, JobType, WorkplacePreference } from '@prisma/client';

const router = Router();

// ==========================================
// Enrollment Endpoints
// ==========================================

const enrollStudentSchema = z.object({
  workspaceId: z.string().min(1, 'workspaceId is required'),
  membershipId: z.string().min(1, 'membershipId is required'),
});

// POST /api/v1/batches/:batchId/students
router.post('/batches/:batchId/students', async (req, res) => {
  try {
    const parsed = enrollStudentSchema.parse(req.body);
    const enrollment = await studentService.enrollStudent(
      parsed.workspaceId,
      req.params.batchId,
      parsed.membershipId,
    );
    res.status(201).json(enrollment);
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    res.status(400).json({ error: err.message });
  }
});

// GET /api/v1/batches/:batchId/students
router.get('/batches/:batchId/students', async (req, res) => {
  try {
    const workspaceId = req.query.workspaceId as string;
    if (!workspaceId) return res.status(400).json({ error: 'workspaceId is required in query' });

    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));

    const result = await studentService.listStudents(workspaceId, req.params.batchId, page, limit);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/v1/batches/:batchId/students/:batchMembershipId
router.delete('/batches/:batchId/students/:batchMembershipId', async (req, res) => {
  try {
    const workspaceId = req.query.workspaceId as string;
    if (!workspaceId) return res.status(400).json({ error: 'workspaceId is required in query' });

    await studentService.revokeStudent(
      workspaceId,
      req.params.batchId,
      req.params.batchMembershipId,
    );
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// Profile Endpoints
// ==========================================

// GET /api/v1/students/:membershipId/profile
router.get('/students/:membershipId/profile', async (req, res) => {
  try {
    const workspaceId = req.query.workspaceId as string;
    if (!workspaceId) return res.status(400).json({ error: 'workspaceId is required in query' });

    const profile = await studentService.getStudentProfile(workspaceId, req.params.membershipId);
    res.json(profile);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

const updateProfileSchema = z.object({
  workspaceId: z.string().min(1, 'workspaceId is required'),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  institution: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  studentId: z.string().nullable().optional(),
  graduationYear: z.number().int().min(1900).max(2100).nullable().optional(),
  skills: z.array(z.string()).optional(),
  hireStatus: z.nativeEnum(HireStatus).nullable().optional(),
  jobType: z.nativeEnum(JobType).nullable().optional(),
  workplacePreference: z.nativeEnum(WorkplacePreference).nullable().optional(),
  currentEmployer: z.string().nullable().optional(),
  currentPosition: z.string().nullable().optional(),
  portfolioUrl: z.string().url().nullable().optional(),
  linkedinUrl: z.string().url().nullable().optional(),
});

// PATCH /api/v1/students/:membershipId/profile
router.patch('/students/:membershipId/profile', async (req, res) => {
  try {
    const parsed = updateProfileSchema.parse(req.body);
    const { workspaceId, ...data } = parsed;

    const updatedProfile = await studentService.updateStudentProfile(
      workspaceId,
      req.params.membershipId,
      data,
    );
    res.json(updatedProfile);
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    res.status(400).json({ error: err.message });
  }
});

export default router;
