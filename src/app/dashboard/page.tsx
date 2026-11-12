// src/app/dashboard/page.tsx
import { prisma } from "@/lib/db";
import { getDashboardGraph, enrollInTrack } from "@/actions/curriculum";
import { CheckCircle2, Lock, AlertCircle, BookOpen, Clock, Activity } from "lucide-react";
import { revalidatePath } from "next/cache";
import Link from "next/link";



// Server Action to create a test user if none exists (for dev purposes)
async function bootstrapTestUser() {
  'use server';
  let user = await prisma.user.findFirst({ where: { email: "test@prepos.dev" } });
  if (!user) {
    user = await prisma.user.create({
      data: { name: "Siddharth (Test)", email: "test@prepos.dev", passwordHash: "mock" }
    });
  }
  await enrollInTrack(user.id, "GATE_CS_2027");
  revalidatePath('/dashboard');
}

export default async function Dashboard() {
  // 1. Authenticate (Mocking auth for Phase 3)
  const user = await prisma.user.findFirst({ where: { email: "test@prepos.dev" } });
  
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b]">
        <div className="border border-[#27272a] bg-[#141417] p-8 rounded-lg max-w-md w-full text-center space-y-4">
          <Activity className="w-12 h-12 text-blue-500 mx-auto" />
          <h1 className="text-xl font-semibold">Initialize PrepOS Workspace</h1>
          <p className="text-sm text-zinc-400">No active user session found. Create a test identity to mount the GATE CS DAG.</p>
          <form action={bootstrapTestUser}>
            <button className="w-full bg-zinc-100 text-zinc-900 py-2 rounded font-medium hover:bg-zinc-200 transition-colors">
              Mount Workspace
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Fetch the dynamically resolved Knowledge Graph
  const graphRes = await getDashboardGraph(user.id, "GATE_CS_2027");
  const subjects = graphRes.success ? graphRes.data : [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* TOP NAVIGATION BAR */}
      <header className="h-14 border-b border-[#27272a] bg-[#09090b] flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <span className="font-bold text-lg tracking-tight">PrepOS</span>
            <span className="text-xs px-2 py-1 bg-[#27272a] text-zinc-300 rounded-md font-mono">GATE_CS_2027</span>
          </div>
          <div className="h-4 w-px bg-[#27272a]"></div>
          <Link href="/errors" className="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors">
            Error Notebook
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-zinc-400 font-mono">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span>02:45 / 10:00 HRS</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">
            SS
          </div>
        </div>
      </header>

      {/* 60/40 SPLIT WORKSPACE */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLUMN: THE EXECUTION ZONE (60%) */}
        <section className="w-[60%] border-r border-[#27272a] p-8 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-6">Today's Execution Queue</h2>
          
          <div className="space-y-4">
            {/* OVERDUE / CRITICAL */}
            <div className="border border-rose-900/50 bg-rose-950/10 rounded-md p-4 flex gap-4 items-start">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-rose-400">Critical Backlog: Theory of Computation</h3>
                <p className="text-xs text-zinc-400 mt-1">Lec 4 & 5 (Context-Free Grammars) were missed yesterday. This is blocking Compiler Design.</p>
              </div>
            </div>

            {/* ACTIVE HEAVY LOAD */}
            <div className="border border-blue-900/50 bg-blue-950/10 rounded-md p-4 flex gap-4 items-start">
              <BookOpen className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="w-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-blue-400">Deep Work: Data Structures</h3>
                  <span className="text-xs font-mono text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">150 MINS</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">Binary Search Trees: Concept Learning + 15 PYQs</p>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: ANALYTICS & DAG STATE (40%) */}
        <section className="w-[40%] bg-[#0f0f11] p-8 overflow-y-auto">
          <h2 className="text-sm font-semibold text-zinc-400 tracking-wider uppercase mb-6">Curriculum Graph State</h2>
          
          <div className="space-y-3">
            {subjects?.map((subject: any) => (
              <Link href={`/subjects/${subject.subjectId}`} key={subject.subjectId} className="block">
                <div className={`p-3 rounded-md border transition-colors hover:border-zinc-500 ${
                  subject.isLocked 
                    ? 'border-[#27272a] bg-[#141417]/50 opacity-75' 
                    : 'border-[#27272a] bg-[#141417]'
                }`}>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {subject.isLocked ? (
                        <Lock className="w-4 h-4 text-zinc-500" />
                      ) : subject.masteryScore > 90 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Activity className="w-4 h-4 text-blue-500" />
                      )}
                      <span className={`text-sm font-medium ${subject.isLocked ? 'text-zinc-500' : 'text-zinc-200'}`}>
                        {subject.name}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-zinc-500">{subject.masteryScore.toFixed(1)}%</span>
                  </div>

                  {subject.isLocked && subject.lockReasons.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#27272a]/50">
                      <ul className="space-y-1">
                        {subject.lockReasons.map((reason: string, i: number) => (
                          <li key={i} className="text-[11px] text-amber-500/80 font-mono leading-tight">
                            → {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}