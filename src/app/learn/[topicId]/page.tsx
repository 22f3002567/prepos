// src/app/learn/[topicId]/page.tsx
import { prisma } from "@/lib/db";
import { markTopicCompleted } from "@/actions/learn";
import { ArrowLeft, PlayCircle, FileText, CheckCircle2, ChevronRight, BrainCircuit, Clock } from "lucide-react";
import Link from "next/link";
import InteractivePYQ from "@/components/interactive-pyq";


export default async function LearnWorkspace({ params }: { params: Promise<{ topicId: string }> }) {
  // Await the params object (Next.js 15 requirement)
  const resolvedParams = await params;
  const topicId = resolvedParams.topicId;

  // 1. Authenticate (Mock)
  const user = await prisma.user.findFirst({ where: { email: "test@prepos.dev" } });
  if (!user) return <div>User not found.</div>;

  // 2. Fetch Topic and Subject Data
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { module: { include: { subject: true } }, questions: true }
  });

  if (!topic) return <div className="p-8 text-rose-500">Topic not found.</div>;

  // 3. Fetch User Progress
  const progress = await prisma.userTopicState.findUnique({
    where: { userId_topicId: { userId: user.id, topicId: topic.id } }
  });

  const isMastered = progress?.isMastered || false;

  // Helper action to bind arguments for the server action
  const completeTopic = markTopicCompleted.bind(null, user.id, topic.id);

  return (
    <div className="h-screen flex flex-col bg-[#09090b] overflow-hidden">
      
      {/* TOP NAVBAR */}
      <header className="h-14 border-b border-[#27272a] flex items-center px-4 shrink-0 bg-[#0f0f11]">
        <Link href={`/subjects/${topic.module.subjectId}`} className="flex items-center text-zinc-400 hover:text-zinc-100 transition-colors mr-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">Back to {topic.module.subject.code}</span>
        </Link>
        <div className="h-4 w-px bg-[#27272a] mx-2"></div>
        <div className="flex items-center text-sm">
          <span className="text-zinc-500">{topic.module.title}</span>
          <ChevronRight className="w-4 h-4 mx-2 text-zinc-600" />
          <span className="text-zinc-100 font-semibold">{topic.title}</span>
        </div>
      </header>

      {/* 3-PANE WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANE: Navigation (20%) */}
        <aside className="w-[20%] border-r border-[#27272a] bg-[#09090b] flex flex-col">
          <div className="p-4 border-b border-[#27272a]">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Up Next</h3>
          </div>
          <div className="p-2 space-y-1 overflow-y-auto">
            <div className="p-3 bg-[#141417] border border-[#27272a] rounded cursor-pointer">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-400">1. {topic.title}</span>
              </div>
            </div>
            <div className="p-3 hover:bg-[#141417] rounded cursor-pointer transition-colors border border-transparent">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-400">2. Arrays & Pointers</span>
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER PANE: Content Player (50%) */}
        <main className="w-[50%] border-r border-[#27272a] bg-black flex flex-col relative">
          {/* Mock Video Player Area */}
          <div className="aspect-video bg-[#050505] border-b border-[#27272a] flex items-center justify-center">
            <div className="text-center">
              <PlayCircle className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 text-sm font-mono">VIDEO PLAYER MOUNT POINT</p>
              <p className="text-zinc-600 text-xs mt-2">Lecture: {topic.title}</p>
            </div>
          </div>
          
          {/* Controls & Completion */}
          <div className="p-6 flex-1 flex flex-col justify-between bg-[#0f0f11]">
            <div>
              <h2 className="text-2xl font-bold text-zinc-100">{topic.title}</h2>
              <p className="text-zinc-400 text-sm mt-2">
                Pay close attention to how memory addresses are manipulated. This is a high-yield concept for GATE NAT questions.
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-[#27272a] pt-4 mt-8">
              <div className="flex items-center gap-2 text-sm text-zinc-400 font-mono">
                <Clock className="w-4 h-4" /> 120 Mins Estimated
              </div>
              
              <form action={completeTopic}>
                <button 
                  disabled={isMastered}
                  className={`flex items-center gap-2 px-6 py-2 rounded font-medium transition-colors ${
                    isMastered 
                      ? "bg-emerald-950/50 text-emerald-500 border border-emerald-900/50 cursor-default"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isMastered ? (
                    <><CheckCircle2 className="w-4 h-4" /> Mastered</>
                  ) : (
                    "Mark Completed"
                  )}
                </button>
              </form>
            </div>
          </div>
        </main>

        {/* RIGHT PANE: Interactive Tools (30%) */}
        <aside className="w-[30%] bg-[#09090b] flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-[#27272a]">
            <button className="flex-1 py-3 text-sm font-medium border-b-2 border-blue-500 text-blue-400">
              PYQs (3)
            </button>
            <button className="flex-1 py-3 text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors">
              Notes
            </button>
            <button className="flex-1 py-3 text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-2">
              <BrainCircuit className="w-4 h-4" /> AI Tutor
            </button>
          </div>

          {/* Tab Content: PYQs */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-4">
              {topic.questions.map((q) => (
                <InteractivePYQ 
                  key={q.id}
                  userId={user.id}
                  questionId={q.id}
                  content={q.content}
                  options={(q.options as string[]) || []}
                  correctAnswer={q.correctAnswer}
                />
              ))}
              
              {topic.questions.length === 0 && (
                <div className="text-sm text-zinc-500 font-mono text-center mt-10">
                  No PYQs available for this topic yet.
                </div>
              )}
            </div>
          
          </div>
        </aside>

      </div>
    </div>
  );
}