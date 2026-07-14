import { prisma } from '../prisma';
import { HireStatus, JobType, WorkplacePreference } from '@prisma/client';

export async function enrollStudent(organizationId: string, batchId: string, membershipId: string) {
  const batch = await prisma.batch.findFirst({
    where: { id: batchId, organizationId },
  });
  if (!batch) throw new Error('Batch not found');

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, organizationId, deletedAt: null },
  });
  if (!membership) throw new Error('Membership not found');
  if (membership.role !== 'STUDENT') throw new Error('Only students can be enrolled via this endpoint');

  // Check capacity
  if (batch.capacity != null) {
    const currentStudentCount = await prisma.batchMembership.count({
      where: { batchId, revokedAt: null, membership: { role: 'STUDENT' } },
    });
    if (currentStudentCount >= batch.capacity) {
      throw new Error('Batch has reached its student capacity');
    }
  }

  const existing = await prisma.batchMembership.findUnique({
    where: { membershipId_batchId: { membershipId, batchId } },
  });

  if (existing) {
    return prisma.batchMembership.update({
      where: { id: existing.id },
      data: { revokedAt: null, assignedAt: new Date() },
    });
  }

  return prisma.batchMembership.create({
    data: {
      batchId,
      membershipId,
      isCR: false,
    },
  });
}

export async function listStudents(organizationId: string, batchId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.batchMembership.findMany({
      where: {
        batchId,
        revokedAt: null,
        membership: { organizationId, role: 'STUDENT' },
      },
      include: {
        membership: {
          include: { user: true, studentProfile: true },
        },
      },
      skip,
      take: limit,
      orderBy: { assignedAt: 'desc' },
    }),
    prisma.batchMembership.count({
      where: {
        batchId,
        revokedAt: null,
        membership: { organizationId, role: 'STUDENT' },
      },
    }),
  ]);

  return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function revokeStudent(organizationId: string, batchId: string, batchMembershipId: string) {
  const batch = await prisma.batch.findFirst({
    where: { id: batchId, organizationId },
  });
  if (!batch) throw new Error('Batch not found');

  const membership = await prisma.batchMembership.findFirst({
    where: { id: batchMembershipId, batchId, revokedAt: null },
    include: { membership: true },
  });
  if (!membership) throw new Error('Batch membership not found or already revoked');

  return prisma.batchMembership.update({
    where: { id: batchMembershipId },
    data: { revokedAt: new Date() },
  });
}

export async function getStudentProfile(organizationId: string, membershipId: string) {
  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, organizationId, role: 'STUDENT' },
    include: { studentProfile: true, user: true },
  });

  if (!membership) throw new Error('Student membership not found');

  return membership;
}

interface UpdateProfileData {
  phone?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  courseName?: string | null;
  specialization?: string | null;
  skills?: string[];
  hireStatus?: HireStatus | null;
  jobType?: JobType | null;
  workplacePreference?: WorkplacePreference | null;
  currentEmployer?: string | null;
  currentPosition?: string | null;
  portfolioUrl?: string | null;
  linkedinUrl?: string | null;
}

export async function updateStudentProfile(organizationId: string, membershipId: string, data: UpdateProfileData) {
  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, organizationId, role: 'STUDENT' },
  });

  if (!membership) throw new Error('Student membership not found');

  return prisma.studentProfile.upsert({
    where: { membershipId },
    update: data,
    create: {
      membershipId,
      ...data,
      skills: data.skills ?? [],
    },
  });
}
