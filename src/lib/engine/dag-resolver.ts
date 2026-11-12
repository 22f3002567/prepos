// src/lib/engine/dag-resolver.ts
import { prisma } from '../db';
import { DependencyType } from '@prisma/client';

export interface SubjectNodeState {
  subjectId: string;
  code: string;
  name: string;
  isLocked: boolean;
  lockReasons: string[]; // Explains exactly WHY a subject is locked
  masteryScore: number;
}

export async function resolveUserSubjectGraph(userId: string, trackCode: string): Promise<SubjectNodeState[]> {
  // 1. Fetch the enrolled curriculum version for this track
  const enrollment = await prisma.userTrackEnrollment.findFirst({
    where: { userId, track: { code: trackCode } },
    include: { curriculumVersion: true }
  });

  if (!enrollment) throw new Error("User is not enrolled in this track.");

  // 2. Fetch ALL subjects in this curriculum and their prerequisite rules
  const subjects = await prisma.subject.findMany({
    where: { curriculumVersionId: enrollment.curriculumVersionId },
    include: { prerequisites: { include: { prerequisite: true } } }
  });

  // 3. Fetch the User's isolated progress for these subjects
  const userConfigs = await prisma.userSubjectConfig.findMany({
    where: { userId }
  });

  // Create a map for $O(1)$ lookups of user mastery scores
  const masteryMap = new Map<string, number>();
  userConfigs.forEach(config => {
    masteryMap.set(config.subjectId, config.masteryScore);
  });

  const resolvedGraph: SubjectNodeState[] = [];

  // 4. Resolve the DAG (Check every subject against its prerequisites)
  for (const subject of subjects) {
    let isLocked = false;
    const lockReasons: string[] = [];
    const currentMastery = masteryMap.get(subject.id) || 0.0;

    for (const dep of subject.prerequisites) {
      const prereqMastery = masteryMap.get(dep.prerequisiteId) || 0.0;

      // HARD LOCK: Must exceed minimum mastery requirement to unlock
      if (dep.type === DependencyType.HARD && prereqMastery < dep.minMasteryReq) {
        isLocked = true;
        lockReasons.push(`Requires ${dep.minMasteryReq}% mastery in ${dep.prerequisite.name} (Currently at ${prereqMastery}%)`);
      }
      
      // SOFT LOCK: Generates a warning but doesn't strictly block execution
      if (dep.type === DependencyType.SOFT && prereqMastery < dep.minMasteryReq) {
        lockReasons.push(`Recommended to complete ${dep.prerequisite.name} first.`);
      }
    }

    resolvedGraph.push({
      subjectId: subject.id,
      code: subject.code,
      name: subject.name,
      isLocked,
      lockReasons,
      masteryScore: currentMastery
    });
  }

  return resolvedGraph;
}