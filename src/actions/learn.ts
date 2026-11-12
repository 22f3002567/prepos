// src/actions/learn.ts
'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function markTopicCompleted(userId: string, topicId: string) {
  await prisma.userTopicState.upsert({
    where: { userId_topicId: { userId, topicId } },
    update: {
      isMastered: true,
      compositeMastery: 100.0,
      lectureCoverage: 100.0,
      lastReviewedAt: new Date(),
    },
    create: {
      userId,
      topicId,
      isMastered: true,
      compositeMastery: 100.0,
      lectureCoverage: 100.0,
      lastReviewedAt: new Date(),
    }
  });

  revalidatePath(`/learn/${topicId}`);
  revalidatePath('/dashboard');
  
  return { success: true };
}