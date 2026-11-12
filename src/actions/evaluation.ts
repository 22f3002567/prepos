// src/actions/evaluation.ts
'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { ErrorCategory } from '@prisma/client';

export async function logQuestionError(userId: string, questionId: string, category: ErrorCategory, quality: number = 2) {
  // SM-2 Quality: 0-5 scale. 0 = complete blackout, 5 = perfect recall. 
  // Since this is logging an error, default quality is 2 (Incorrect, but remembered the concept vaguely).
  
  const existingLog = await prisma.errorLog.findFirst({
    where: { userId, questionId }
  });

  let repetitionCount = 0;
  let easeFactor = 2.5;
  let intervalDays = 1;

  if (existingLog) {
    // SM-2 Math
    repetitionCount = existingLog.repetitionCount + 1;
    easeFactor = existingLog.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    if (quality < 3) {
      intervalDays = 1; // Reset memory interval if failed again
      repetitionCount = 0;
    } else {
      if (repetitionCount === 1) intervalDays = 6;
      else intervalDays = Math.round(existingLog.intervalDays * easeFactor);
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

    await prisma.errorLog.update({
      where: { id: existingLog.id },
      data: { category, repetitionCount, easeFactor, intervalDays, nextReviewDate, isMastered: quality >= 4 }
    });

  } else {
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + 1); // First review is always tomorrow

    await prisma.errorLog.create({
      data: { userId, questionId, category, repetitionCount, easeFactor, intervalDays, nextReviewDate }
    });
  }

  revalidatePath('/errors');
  revalidatePath('/dashboard');
  
  return { success: true };
}