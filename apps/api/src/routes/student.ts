import { Router } from 'express';
import { z } from 'zod';
import * as studentService from '../services/student.service';
import { HireStatus, JobType, WorkplacePreference } from '@prisma/client';

const router = Router();

// ==========================================
// Enrollment Endpoints
// ==========================================

const enrollStudentSchema = z.object({
  organizationId: z.string(),
  membershipId: z.string(),
});

router.post('/batches/:batchId/students', async (req, res) => {
  try {
    // TODO: When auth middleware is ready, organizationId will come from req.user
    const parsed = enrollStudentSchema.parse(req.body);
    const { organizationId, membershipId } = parsed;
    const batchId = req.params.batchId;

    const enrollment = await studentService.enrollStudent(organizationId, batchId, membershipId);
    res.status(201).json(enrollment);
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    res.status(400).json({ error: err.message });
  }
});

router.get('/batches/:batchId/students', async (req, res) => {
  try {
    const organizationId = req.query.organizationId as string;
    if (!organizationId) return res.status(400).json({ error: 'organizationId is required in query' });

    const batchId = req.params.batchId;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);

    const result = await studentService.listStudents(organizationId, batchId, page, limit);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/batches/:batchId/students/:batchMembershipId', async (req, res) => {
  try {
    const organizationId = req.query.organizationId as string;
    if (!organizationId) return res.status(400).json({ error: 'organizationId is required in query' });

    const { batchId, batchMembershipId } = req.params;
    await studentService.revokeStudent(organizationId, batchId, batchMembershipId);
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// Profile Endpoints
// ==========================================

router.get('/students/:membershipId/profile', async (req, res) => {
  try {
    const organizationId = req.query.organizationId as string;
    if (!organizationId) return res.status(400).json({ error: 'organizationId is required in query' });

    const profile = await studentService.getStudentProfile(organizationId, req.params.membershipId);
    res.json(profile);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

const updateProfileSchema = z.object({
  organizationId: z.string(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  courseName: z.string().nullable().optional(),
  specialization: z.string().nullable().optional(),
  skills: z.array(z.string()).optional(),
  hireStatus: z.nativeEnum(HireStatus).nullable().optional(),
  jobType: z.nativeEnum(JobType).nullable().optional(),
  workplacePreference: z.nativeEnum(WorkplacePreference).nullable().optional(),
  currentEmployer: z.string().nullable().optional(),
  currentPosition: z.string().nullable().optional(),
  portfolioUrl: z.string().url().nullable().optional(),
  linkedinUrl: z.string().url().nullable().optional(),
});

router.patch('/students/:membershipId/profile', async (req, res) => {
  try {
    const parsed = updateProfileSchema.parse(req.body);
    const { organizationId, ...data } = parsed;

    const updatedProfile = await studentService.updateStudentProfile(
      organizationId,
      req.params.membershipId,
      data
    );
    res.json(updatedProfile);
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    res.status(400).json({ error: err.message });
  }
});

export default router;
