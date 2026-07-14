import { Router } from 'express';
import { z } from 'zod';
import * as batchService from '../services/batch.service';

const router = Router();

// TODO: auth middleware 
const createBatchSchema = z.object({
  organizationId: z.string(),
  name: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  capacity: z.number().int().positive().optional(),
  defaultMeetLink: z.string().url().optional(),
  lateThresholdMinsOverride: z.number().int().positive().optional(),
  attendanceDurationMinsOverride: z.number().int().positive().optional(),
});

router.post('/', async (req, res) => {
  try {
    const parsed = createBatchSchema.parse(req.body);
    const { organizationId, ...data } = parsed;
    const batch = await batchService.createBatch(organizationId, data);
    res.status(201).json(batch);
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    res.status(err.name === 'LimitExceededError' ? 402 : 400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const organizationId = req.query.organizationId as string;
  if (!organizationId) return res.status(400).json({ error: 'organizationId is required' });

  const batches = await batchService.listBatches(organizationId);
  res.json(batches);
});

router.get('/:id', async (req, res) => {
  try {
    const organizationId = req.query.organizationId as string;
    if (!organizationId) return res.status(400).json({ error: 'organizationId is required' });

    const batch = await batchService.getBatchById(organizationId, req.params.id);
    res.json(batch);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

const updateBatchSchema = z.object({
  organizationId: z.string(),
  name: z.string().min(1).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  defaultMeetLink: z.string().url().nullable().optional(),
  isArchived: z.boolean().optional(),
  lateThresholdMinsOverride: z.number().int().positive().nullable().optional(),
  attendanceDurationMinsOverride: z.number().int().positive().nullable().optional(),
});

router.patch('/:id', async (req, res) => {
  try {
    const parsed = updateBatchSchema.parse(req.body);
    const { organizationId, ...data } = parsed;
    const batch = await batchService.updateBatch(organizationId, req.params.id, data);
    res.json(batch);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

const addMembershipSchema = z.object({
  organizationId: z.string(),
  membershipId: z.string(),
  isCR: z.boolean().optional(),
});

router.post('/:id/memberships', async (req, res) => {
  try {
    const parsed = addMembershipSchema.parse(req.body);
    const { organizationId, ...data } = parsed;
    const membership = await batchService.addBatchMembership(organizationId, req.params.id, data);
    res.status(201).json(membership);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id/memberships/:memberId', async (req, res) => {
  try {
    const organizationId = req.query.organizationId as string;
    if (!organizationId) return res.status(400).json({ error: 'organizationId is required' });

    await batchService.revokeBatchMembership(organizationId, req.params.id, req.params.memberId);
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;