// src/actions/curriculum.ts
'use server';

import { prisma } from '@/lib/db';
import { resolveUserSubjectGraph } from '@/lib/engine/dag-resolver';

// 1. Enroll a user into a track (e.g., GATE CS)
export async function enrollInTrack(userId: string, trackCode: string) {
  const track = await prisma.learningTrack.findUnique({
    where: { code: trackCode },
    include: { versions: { where: { isOfficial: true }, take: 1 } }
  });

  if (!track || track.versions.length === 0) {
    throw new Error("Track or official curriculum version not found.");
  }

  const enrollment = await prisma.userTrackEnrollment.upsert({
    where: { userId_trackId: { userId, trackId: track.id } },
    update: {},
    create: {
      userId,
      trackId: track.id,
      curriculumVersionId: track.versions[0].id,
      isPrimary: true
    }
  });

  return { success: true, enrollmentId: enrollment.id };
}

// 2. Fetch the dynamically resolved DAG state for the Dashboard
export async function getDashboardGraph(userId: string, trackCode: string) {
  try {
    const graphState = await resolveUserSubjectGraph(userId, trackCode);
    return { success: true, data: graphState };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}