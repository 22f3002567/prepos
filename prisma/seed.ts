// prisma/seed.ts
// prisma/seed.ts
import 'dotenv/config';

import { PrismaClient, TrackType, DependencyType, PriorityTier, CognitiveLoad, QuestionType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Initialize the Postgres adapter with your Supabase pooler URL
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in your .env file.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Initiating PrepOS Knowledge Graph Seeding...');
  console.log('🌱 Initiating PrepOS Knowledge Graph Seeding...');
  console.log('🌱 Initiating PrepOS Knowledge Graph Seeding...');

  // ==========================================================================
  // 1. CREATE LEARNING TRACKS & CURRICULUM VERSIONS
  // ==========================================================================
  
  // Track A: GATE CS 2027
  const gateTrack = await prisma.learningTrack.upsert({
    where: { code: 'GATE_CS_2027' },
    update: {},
    create: {
      code: 'GATE_CS_2027',
      title: 'GATE Computer Science & IT',
      type: TrackType.COMPETITIVE_EXAM,
      versions: {
        create: { versionTag: 'v2027-official', isOfficial: true }
      }
    }
  });
  const gateVersion = await prisma.curriculumVersion.findUnique({ where: { trackId_versionTag: { trackId: gateTrack.id, versionTag: 'v2027-official' } } });

  // Track B: FAANG SDE Placement
  const faangTrack = await prisma.learningTrack.upsert({
    where: { code: 'FAANG_SDE_2027' },
    update: {},
    create: {
      code: 'FAANG_SDE_2027',
      title: 'FAANG SDE-1 Placement Prep',
      type: TrackType.PLACEMENT_CAREER,
      industryRole: 'Software Development Engineer',
      versions: {
        create: { versionTag: 'top-150-patterns', isOfficial: true }
      }
    }
  });
  const faangVersion = await prisma.curriculumVersion.findUnique({ where: { trackId_versionTag: { trackId: faangTrack.id, versionTag: 'top-150-patterns' } } });

  // ==========================================================================
  // 2. CREATE SHARED CONCEPTS (The Cross-Pollination Engine)
  // ==========================================================================
  const conceptPointers = await prisma.concept.upsert({
    where: { slug: 'memory-pointers' },
    update: {},
    create: { slug: 'memory-pointers', name: 'Memory & Pointers', description: 'Address manipulation and referencing.' }
  });

  const conceptTrees = await prisma.concept.upsert({
    where: { slug: 'binary-trees' },
    update: {},
    create: { slug: 'binary-trees', name: 'Binary Trees', description: 'Hierarchical tree traversals and views.' }
  });

  // ==========================================================================
  // 3. SEED GATE CS SUBJECTS, MODULES & TOPICS
  // ==========================================================================
  if (gateVersion) {
    // Subject: C Programming
    const cProg = await prisma.subject.upsert({
      where: { curriculumVersionId_code: { curriculumVersionId: gateVersion.id, code: 'GATE_C_PROG' } },
      update: {},
      create: {
        curriculumVersionId: gateVersion.id, code: 'GATE_C_PROG', name: 'C Programming', trackGroup: 'Programming',
        historicalWeight: 6.0, estimatedHours: 45, sequence: 1, defaultPriority: PriorityTier.TIER_1,
        modules: {
          create: [{
            title: 'Module 1: Memory & Pointers', sequence: 1, estimatedMins: 300,
            topics: {
              create: [
                { title: 'Pointer Arithmetic', sequence: 1, estimatedMins: 120, cognitiveLoad: CognitiveLoad.HIGH },
                { title: 'Arrays & Pointers', sequence: 2, estimatedMins: 90, cognitiveLoad: CognitiveLoad.MEDIUM }
              ]
            }
          }]
        }
      }
    });

    // Subject: Data Structures
    const ds = await prisma.subject.upsert({
      where: { curriculumVersionId_code: { curriculumVersionId: gateVersion.id, code: 'GATE_DS' } },
      update: {},
      create: {
        curriculumVersionId: gateVersion.id, code: 'GATE_DS', name: 'Data Structures', trackGroup: 'Programming',
        historicalWeight: 8.0, estimatedHours: 50, sequence: 2, defaultPriority: PriorityTier.TIER_1,
        modules: {
          create: [{
            title: 'Module 1: Trees & Graphs', sequence: 1, estimatedMins: 400,
            topics: {
              create: [
                { title: 'Binary Search Trees', sequence: 1, estimatedMins: 150, cognitiveLoad: CognitiveLoad.HIGH },
                { title: 'Tree Traversals', sequence: 2, estimatedMins: 120, cognitiveLoad: CognitiveLoad.MEDIUM }
              ]
            }
          }]
        }
      }
    });

    // Subject Dependency: C Programming -> Data Structures
    await prisma.subjectDependency.upsert({
      where: { subjectId_prerequisiteId: { subjectId: ds.id, prerequisiteId: cProg.id } },
      update: {},
      create: { subjectId: ds.id, prerequisiteId: cProg.id, type: DependencyType.HARD, minMasteryReq: 70.0 }
    });
    
    // Map Concept to Topic (GATE)
    const pointerTopic = await prisma.topic.findFirst({ where: { title: 'Pointer Arithmetic' } });
    if (pointerTopic) {
      await prisma.topicConceptMap.upsert({
        where: { topicId_conceptId: { topicId: pointerTopic.id, conceptId: conceptPointers.id } },
        update: {}, create: { topicId: pointerTopic.id, conceptId: conceptPointers.id }
      });
    }
  }

  // ==========================================================================
  // 4. SEED FAANG PLACEMENT SUBJECTS (SKILL DOMAINS)
  // ==========================================================================
  if (faangVersion) {
    const dsaCore = await prisma.subject.upsert({
      where: { curriculumVersionId_code: { curriculumVersionId: faangVersion.id, code: 'FAANG_CORE_DSA' } },
      update: {},
      create: {
        curriculumVersionId: faangVersion.id, code: 'FAANG_CORE_DSA', name: 'Core DSA (LeetCode)', trackGroup: 'Algorithms',
        historicalWeight: 100, estimatedHours: 120, sequence: 1, defaultPriority: PriorityTier.TIER_1,
        modules: {
          create: [{
            title: 'Module 1: Two Pointers & Arrays', sequence: 1, estimatedMins: 600,
            topics: {
              create: [
                { title: 'Fast & Slow Pointers', sequence: 1, estimatedMins: 180, cognitiveLoad: CognitiveLoad.HIGH, isHighYield: true }
              ]
            }
          }]
        }
      }
    });

    // Map Concept to Topic (FAANG)
    const fastSlowTopic = await prisma.topic.findFirst({ where: { title: 'Fast & Slow Pointers' } });
    if (fastSlowTopic) {
      await prisma.topicConceptMap.upsert({
        where: { topicId_conceptId: { topicId: fastSlowTopic.id, conceptId: conceptPointers.id } },
        update: {}, create: { topicId: fastSlowTopic.id, conceptId: conceptPointers.id }
      });
    }
  }

  console.log('✅ Knowledge Graph Seeded Successfully.');
  console.log('🌐 Cross-Pollination Linked: [Pointer Arithmetic (GATE)] <--> [Memory Pointers (Concept)] <--> [Fast & Slow Pointers (FAANG)]');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });