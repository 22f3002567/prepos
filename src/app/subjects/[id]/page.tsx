// src/app/subjects/[id]/page.tsx
import { prisma } from "@/lib/db";
import { Lock, PlayCircle, FileText, CheckCircle2, Activity } from "lucide-react";
import Link from "next/link";

export default async function SubjectOverview({ params }: { params: Promise<{ id: string }> }) {
  // Await the params object (Next.js 15 requirement)
  const resolvedParams = await params;
  const subjectId = resolvedParams.id;

  // 1. Fetch User (Mock auth)
  const user = await prisma.user.findFirst({ where: { email: "test@prepos.dev" } });
  if (!user) return <div>User not found.</div>;

  // 2. Fetch the Subject, its Modules, and Topics
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      modules: {
        orderBy: { sequence: 'asc' },
        include: {
          topics: {
            orderBy: { sequence: 'asc' }
          }
        }
      }
    }
  });

  if (!subject) return <div className="p-8 text-rose-500">Subject not found.</div>;

  // 3. Fetch User Progress for these topics
  const topicStates = await prisma.userTopicState.findMany({
    where: { userId: user.id }
  });
  const stateMap = new Map(topicStates.map(ts => [ts.topicId, ts]));

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      {/* SUBJECT HEADER */}
      <header className="border-b border-[#27272a] bg-[#0f0f11] p-8">
        <div className="max-w-5xl mx-auto flex justify-between items-end">
          <div>
            <div className="text-xs font-mono text-blue-500 mb-2">{subject.trackGroup}</div>
            <h1 className="text-3xl font-bold text-zinc-100">{subject.name}</h1>
            <p className="text-sm text-zinc-400 mt-2">Estimated Workload: {subject.estimatedHours} Hours</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono text-zinc-100">0.0%</div>
            <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Mastery Score</div>
          </div>
        </div>
      </header>

      {/* MODULES & TOPICS (IITM Style) */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {subject.modules.map((module) => (
            <div key={module.id} className="border border-[#27272a] bg-[#141417] rounded-lg overflow-hidden">
              {/* Module Header */}
              <div className="bg-[#1c1c1f] p-4 border-b border-[#27272a] flex justify-between items-center">
                <h2 className="text-sm font-semibold text-zinc-200">{module.title}</h2>
                <span className="text-xs font-mono text-zinc-500">{module.estimatedMins} Mins</span>
              </div>
              
              {/* Topics List */}
              <div className="divide-y divide-[#27272a]">
                {module.topics.map((topic) => {
                  const state = stateMap.get(topic.id);
                  const isMastered = state?.isMastered || false;
                  
                  return (
                    <div key={topic.id} className="p-4 flex items-center justify-between hover:bg-[#1c1c1f] transition-colors group">
                      <div className="flex items-center gap-4">
                        {isMastered ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Activity className="w-5 h-5 text-zinc-600 group-hover:text-blue-500 transition-colors" />
                        )}
                        <div>
                          <h3 className="text-sm font-medium text-zinc-300">{topic.title}</h3>
                          <div className="flex gap-3 mt-1">
                            <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                              <PlayCircle className="w-3 h-3" /> Concept Video
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                              <FileText className="w-3 h-3" /> PYQs
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <Link 
                        href={`/learn/${topic.id}`}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Enter Workspace
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}