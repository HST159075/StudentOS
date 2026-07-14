import { prisma } from '../prisma';
import { assertBatchLimitNotExceeded } from './limit.service';

interface CreateBatchInput {
  name: string;
  startDate: Date;
  endDate?: Date;
  capacity?: number;
  defaultMeetLink?: string;
  lateThresholdMinsOverride?: number;
  attendanceDurationMinsOverride?: number;
}

export async function createBatch(organizationId: string, data: CreateBatchInput) {
  await assertBatchLimitNotExceeded(organizationId);

  return prisma.batch.create({
    data: {
      organizationId,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,


      capacity: data.capacity,
      defaultMeetLink: data.defaultMeetLink,
      lateThresholdMinsOverride: data.lateThresholdMinsOverride,
      attendanceDurationMinsOverride: data.attendanceDurationMinsOverride,
    },
  });
}

export async function listBatches(organizationId: string) {
  return prisma.batch.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  });
}




export async function getBatchById(organizationId: string, batchId: string) {
  const batch = await prisma.batch.findFirst({
    where: { id: batchId, organizationId },
    include: {
      batchMemberships: {
        where: { revokedAt: null },
        include: { membership: { include: { user: true } } },
      },
    },
  });



  if (!batch) throw new Error('Batch not found');
  return batch;
}




interface UpdateBatchInput {
  name?: string;
  startDate?: Date;
  endDate?: Date | null;
  capacity?: number | null;
  defaultMeetLink?: string | null;
  isArchived?: boolean;
  lateThresholdMinsOverride?: number | null;
  attendanceDurationMinsOverride?: number | null;
}




export async function updateBatch(organizationId: string, batchId: string, data: UpdateBatchInput) {
  const existing = await prisma.batch.findFirst({
    where: { id: batchId, organizationId },
  });
  if (!existing) throw new Error('Batch not found');

  return prisma.batch.update({
    where: { id: batchId },
    data,
  });
}



interface AddMembershipInput {
  membershipId: string;
  isCR?: boolean;
}


export async function addBatchMembership(organizationId: string, batchId: string, data: AddMembershipInput) {
  const batch = await prisma.batch.findFirst({
    where: { id: batchId, organizationId },
  });
  if (!batch) throw new Error('Batch not found');

  const membership = await prisma.membership.findFirst({
    where: { id: data.membershipId, organizationId, deletedAt: null },
  });
  if (!membership) throw new Error('Membership not found in this organization');

  if (data.isCR && membership.role !== 'STUDENT') {
    throw new Error('Only students can be assigned as CR');
  }

  if (membership.role === 'STUDENT' && batch.capacity != null) {
    const currentStudentCount = await prisma.batchMembership.count({
      where: {
        batchId,
        revokedAt: null,
        membership: { role: 'STUDENT' },
      },
    });
    if (currentStudentCount >= batch.capacity) {
      throw new Error('Batch has reached its student capacity');
    }
  }

  const existing = await prisma.batchMembership.findUnique({
    where: { membershipId_batchId: { membershipId: data.membershipId, batchId } },
  });

  if (existing) {
    return prisma.batchMembership.update({
      where: { id: existing.id },
      data: { revokedAt: null, isCR: data.isCR ?? existing.isCR, assignedAt: new Date() },
    });
  }

  return prisma.batchMembership.create({
    data: {
      batchId,
      membershipId: data.membershipId,
      isCR: data.isCR ?? false,
    },
  });
}

export async function revokeBatchMembership(organizationId: string, batchId: string, memberId: string) {
  const batch = await prisma.batch.findFirst({
    where: { id: batchId, organizationId },
  });
  if (!batch) throw new Error('Batch not found');

  const membership = await prisma.batchMembership.findFirst({
    where: { id: memberId, batchId, revokedAt: null },
  });
  if (!membership) throw new Error('Batch membership not found or already revoked');

  return prisma.batchMembership.update({
    where: { id: memberId },
    data: { revokedAt: new Date() },
  });
}