import { prisma } from '../prisma';



export class LimitExceededError extends Error {
  constructor(public resource: string, public limit: number) {
    super(`${resource} limit of ${limit} reached for this plan`);
    this.name = 'LimitExceededError';
  }
}

export async function assertBatchLimitNotExceeded(organizationId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },

    include: { plan: true },
  });

  if (!subscription) {
    throw new Error('No subscription found for organization');
  }

  const maxBatches = subscription.overrideMaxBatches ?? subscription.plan.maxBatches;

  const activeBatchCount = await prisma.batch.count({
    where: { organizationId, isArchived: false },


  });

  if (activeBatchCount >= maxBatches) {
    throw new LimitExceededError('batches', maxBatches);
  }
}