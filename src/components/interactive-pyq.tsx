// src/components/interactive-pyq.tsx
'use client';

import { useState, useTransition } from 'react';
import { logQuestionError } from '@/actions/evaluation';
import { ErrorCategory } from '@prisma/client';
import { BrainCircuit, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function InteractivePYQ({ 
  userId, 
  questionId, 
  content, 
  options, 
  correctAnswer 
}: { 
  userId: string, questionId: string, content: string, options: string[], correctAnswer: string 
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [errorLogged, setErrorLogged] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleOptionClick = (opt: string) => {
    if (selected) return; // Prevent changing answer
    setSelected(opt);
    setIsCorrect(opt === correctAnswer);
  };

  const handleLogError = (formData: FormData) => {
    const category = formData.get('category') as ErrorCategory;
    startTransition(async () => {
      await logQuestionError(userId, questionId, category);
      setErrorLogged(true);
    });
  };

  return (
    <div className="p-4 border border-[#27272a] bg-[#141417] rounded-md">
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-mono bg-[#27272a] px-2 py-1 rounded text-zinc-300">GATE PYQ</span>
        <span className="text-xs font-medium text-amber-500">2 Marks</span>
      </div>
      
      {/* Question Content */}
      <div className="text-sm text-zinc-200 leading-relaxed font-mono whitespace-pre-wrap mb-4">
        {content}
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-2 gap-2">
        {options.map(opt => {
          let btnClass = "p-2 border rounded text-sm font-medium transition-colors ";
          if (!selected) {
            btnClass += "border-[#27272a] text-zinc-400 hover:bg-[#27272a] hover:text-zinc-200";
          } else if (opt === correctAnswer) {
            btnClass += "border-emerald-500 bg-emerald-950/30 text-emerald-400"; // Always highlight correct
          } else if (opt === selected && opt !== correctAnswer) {
            btnClass += "border-rose-500 bg-rose-950/30 text-rose-400"; // Highlight wrong choice
          } else {
            btnClass += "border-[#27272a] text-zinc-600 opacity-50"; // Dim others
          }

          return (
            <button 
              key={opt} 
              onClick={() => handleOptionClick(opt)}
              disabled={!!selected}
              className={btnClass}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* Error Logging UI (Only shows if answered incorrectly) */}
      {selected && isCorrect === false && !errorLogged && (
        <div className="mt-4 p-3 bg-rose-950/20 border border-rose-900/50 rounded flex flex-col gap-3">
          <div className="flex items-center gap-2 text-rose-400 text-sm font-medium">
            <AlertCircle className="w-4 h-4" /> Incorrect. Log the root cause:
          </div>
          <form action={handleLogError} className="flex gap-2">
            <select name="category" className="flex-1 bg-[#09090b] border border-[#27272a] text-sm text-zinc-300 rounded p-1.5 outline-none focus:border-blue-500">
              <option value="CONCEPTUAL_GAP">Conceptual Gap</option>
              <option value="CALCULATION_ERROR">Silly / Calculation Error</option>
              <option value="FORMULA_FORGOTTEN">Formula Forgotten</option>
              <option value="MISREAD_QUESTION">Misread Question</option>
            </select>
            <button disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50 flex items-center justify-center min-w-[80px]">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log Error"}
            </button>
          </form>
        </div>
      )}

      {/* Success State */}
      {errorLogged && (
        <div className="mt-4 p-3 bg-amber-950/20 border border-amber-900/50 rounded flex items-center gap-2 text-amber-500 text-sm">
          <BrainCircuit className="w-4 h-4" /> Error logged to Spaced Repetition queue.
        </div>
      )}
      
      {isCorrect === true && (
        <div className="mt-4 p-3 bg-emerald-950/20 border border-emerald-900/50 rounded flex items-center gap-2 text-emerald-500 text-sm">
          <CheckCircle2 className="w-4 h-4" /> Correct! Neural pathway strengthened.
        </div>
      )}
    </div>
  );
}