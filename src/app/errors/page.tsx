// src/app/errors/page.tsx
import { prisma } from "@/lib/db";
import { BrainCircuit, AlertOctagon, RotateCcw, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default async function ErrorNotebook() {
  // 1. Authenticate (Mock)
  const user = await prisma.user.findFirst({ where: { email: "test@prepos.dev" } });
  if (!user) return <div>User not found.</div>;

  // 2. Fetch Error Logs with Question Data
  const errorLogs = await prisma.errorLog.findMany({
    where: { userId: user.id },
    include: { question: { include: { topic: { include: { module: { include: { subject: true } } } } } } },
    orderBy: { nextReviewDate: 'asc' }
  });

  const today = new Date();
  const dueToday = errorLogs.filter(log => log.nextReviewDate <= today && !log.isMastered);
  const upcoming = errorLogs.filter(log => log.nextReviewDate > today && !log.isMastered);

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      {/* HEADER */}
      <header className="border-b border-[#27272a] bg-[#0f0f11] p-8">
        <div className="max-w-5xl mx-auto flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 text-rose-500 mb-2 font-mono text-xs">
              <BrainCircuit className="w-4 h-4" /> Spaced Repetition Engine
            </div>
            <h1 className="text-3xl font-bold text-zinc-100">Error Notebook</h1>
            <p className="text-sm text-zinc-400 mt-2">Concepts currently decaying in your short-term memory.</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono text-rose-500">{dueToday.length}</div>
            <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Due for Review</div>
          </div>
        </div>
      </header>

      {/* ERROR QUEUE */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* SECTION: DUE TODAY */}
          <section>
            <h2 className="text-sm font-semibold text-zinc-400 tracking-wider uppercase mb-4 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-500" /> Critical Review (Due Today)
            </h2>
            
            {dueToday.length === 0 ? (
              <div className="p-8 border border-[#27272a] border-dashed rounded-lg text-center text-zinc-500 text-sm font-mono bg-[#141417]/50">
                Memory retention optimal. No errors due for review today.
              </div>
            ) : (
              <div className="grid gap-4">
                {dueToday.map(log => (
                  <div key={log.id} className="p-5 border border-rose-900/30 bg-rose-950/10 rounded-lg flex justify-between items-center group hover:border-rose-900/60 transition-colors">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-mono bg-rose-900/30 text-rose-400 px-2 py-0.5 rounded uppercase">
                          {log.category.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-zinc-500 font-mono">
                          {log.question.topic?.module.subject.code} → {log.question.topic?.title}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-200 line-clamp-2">{log.question.content}</p>
                    </div>
                    
                    <button className="px-4 py-2 bg-[#27272a] hover:bg-rose-600 hover:text-white text-zinc-300 text-xs font-medium rounded transition-colors flex items-center gap-2 shrink-0 ml-6">
                      <RotateCcw className="w-3 h-3" /> Re-Attempt
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SECTION: UPCOMING */}
          <section>
            <h2 className="text-sm font-semibold text-zinc-400 tracking-wider uppercase mb-4 mt-8">
              Upcoming Decay (Next 7 Days)
            </h2>
            <div className="grid gap-3 opacity-75">
              {upcoming.length === 0 ? (
                <div className="text-xs text-zinc-600 font-mono">No upcoming reviews scheduled.</div>
              ) : (
                upcoming.map(log => (
                  <div key={log.id} className="p-4 border border-[#27272a] bg-[#141417] rounded flex justify-between items-center">
                    <span className="text-sm text-zinc-400 line-clamp-1 flex-1 pr-4">{log.question.content}</span>
                    <span className="text-xs font-mono text-zinc-500 shrink-0">
                      Due: {log.nextReviewDate.toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}