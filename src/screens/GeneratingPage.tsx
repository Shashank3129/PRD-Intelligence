import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/hooks/useAppStore';
import { generatePRD } from '@/services/aiService';
import { GENERATION_STEPS } from '@/constants';
import { Check, Zap, Sparkles, FileText, Brain, Lightbulb, AlertCircle, AlertTriangle } from 'lucide-react';

const STEP_ICONS = [Lightbulb, Brain, FileText, Sparkles, Check];

// Roughly how many chars correspond to each step completing
const STEP_THRESHOLDS = [200, 600, 1200, 2200, 3500];

function charsToProgress(chars: number): number {
  // 0–95% tied to streaming output; final 5% on completion
  return Math.min(Math.round((chars / 4000) * 90), 90);
}

function charsToStep(chars: number): number {
  for (let i = STEP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (chars >= STEP_THRESHOLDS[i]) return Math.min(i + 1, GENERATION_STEPS.length - 1);
  }
  return 0;
}

export function GeneratingPage() {
  const { productCtx, idea, setPrd, setScreen, addPrdVersion, addToast, user } = useAppStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [aiWarning, setAiWarning] = useState<string | null>(null);

  // StrictMode-safe: use a cleanup flag per effect invocation, NOT a ref that persists across remounts
  const isMounted = useRef(true);

  useEffect(() => {
    if (!productCtx) {
      setScreen('setup');
      return;
    }

    // cancelled flag lives in this closure — each mount gets its own copy
    let cancelled = false;
    isMounted.current = true;

    const generate = async () => {
      try {
        const result = await generatePRD(productCtx, idea, (accumulated) => {
          if (cancelled) return; // StrictMode first-mount cleanup happened — ignore

          const chars = accumulated.length;
          setCharCount(chars);
          setProgress(charsToProgress(chars));

          const step = charsToStep(chars);
          setCurrentStep(step);
          setCompletedSteps(Array.from({ length: step }, (_, i) => i));
        }, user?.name || undefined);

        if (cancelled) return;

        if (result.success && result.text) {
          setPrd(result.text);
          addPrdVersion({
            version: 1,
            date: new Date().toISOString(),
            summary: 'Initial PRD generation'
          });

          // Mark any 'generating' PRDs in localStorage as 'completed'
          try {
            const stored = localStorage.getItem('prd_prds');
            if (stored) {
              const localPRDs = JSON.parse(stored) as Array<{ status: string; content: string }>;
              const updated = localPRDs.map(p =>
                p.status === 'generating' ? { ...p, status: 'completed', content: result.text } : p
              );
              localStorage.setItem('prd_prds', JSON.stringify(updated));
            }
          } catch { /* non-fatal */ }

          if (result.error) {
            addToast({ type: 'warning', message: result.error });
            setAiWarning(result.error);
          }

          // Complete all steps
          setProgress(100);
          setCompletedSteps(GENERATION_STEPS.map((_, i) => i));
          setCurrentStep(GENERATION_STEPS.length - 1);

          setTimeout(() => {
            if (!cancelled) setScreen('refine');
          }, result.error ? 3500 : 1500);
        } else {
          throw new Error(result.error || 'Failed to generate PRD');
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(message);
        addToast({ type: 'error', message });
        setTimeout(() => {
          if (!cancelled) setScreen('setup');
        }, 4000);
      }
    };

    generate();

    return () => {
      cancelled = true;
      isMounted.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
        <motion.div
          className="text-center max-w-md"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <AlertCircle className="w-10 h-10 text-red-500" />
          </motion.div>
          <h2 className="font-bold text-xl text-slate-900 mb-2">Generation Failed</h2>
          <p className="text-slate-500 mb-2 text-sm">{error}</p>
          <p className="text-slate-400 text-sm">Redirecting back to setup…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center relative overflow-hidden p-4">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[900px] md:h-[900px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', filter: 'blur(100px)' }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-gradient-to-br from-indigo-400/30 to-purple-400/30"
            style={{ left: '50%', top: '50%' }}
            animate={{
              x: [0, Math.cos((i * 45) * Math.PI / 180) * 180, 0],
              y: [0, Math.sin((i * 45) * Math.PI / 180) * 180, 0],
              opacity: [0.2, 0.7, 0.2],
            }}
            transition={{ duration: 5 + i * 0.4, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Warning banner */}
      <AnimatePresence>
        {aiWarning && (
          <motion.div
            className="absolute top-4 left-4 right-4 z-20 bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3 shadow-md"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-amber-800 text-sm">{aiWarning}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="relative z-10 text-center w-full max-w-lg"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Spinning rings */}
        <div className="relative w-28 h-28 md:w-36 md:h-36 mx-auto mb-6">
          {[
            { inset: 'inset-0', color: '#6366f1', border: 'borderTop', dur: 3 },
            { inset: 'inset-3 md:inset-4', color: '#22d3ee', border: 'borderBottom', dur: 2.5 },
            { inset: 'inset-6 md:inset-8', color: '#a78bfa', border: 'borderLeft', dur: 2 },
          ].map(({ inset, color, dur }, idx) => (
            <motion.div
              key={idx}
              className={`absolute ${inset} rounded-full border-2 border-slate-200/30`}
              style={{ [idx === 0 ? 'borderTopColor' : idx === 1 ? 'borderBottomColor' : 'borderLeftColor']: color }}
              animate={{ rotate: idx % 2 === 0 ? 360 : -360 }}
              transition={{ duration: dur, repeat: Infinity, ease: 'linear' }}
            />
          ))}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-300/50">
              <Zap className="w-7 h-7 text-white" />
            </div>
          </motion.div>
        </div>

        <motion.h2
          className="font-bold text-2xl md:text-3xl text-slate-900 mb-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Creating your PRD…
        </motion.h2>
        <motion.p
          className="text-slate-500 mb-6 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {charCount > 0 ? 'Crafting your PRD, this may take a moment…' : 'AI is starting…'}
        </motion.p>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-2.5 bg-slate-200/80 rounded-full overflow-hidden shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 rounded-full relative overflow-hidden"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-slate-500 text-xs font-medium">{progress}% complete</span>
            <span className="text-slate-400 text-xs">{completedSteps.length}/{GENERATION_STEPS.length} steps</span>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2 max-w-md mx-auto mb-5">
          {GENERATION_STEPS.map((step, i) => {
            const isCompleted = completedSteps.includes(i);
            const isActive = i === currentStep && !isCompleted;
            const Icon = STEP_ICONS[i] || Sparkles;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-indigo-50/90 border border-indigo-200/70 shadow-sm'
                    : isCompleted
                    ? 'bg-green-50/80 border border-green-200/60'
                    : 'bg-white/40 border border-slate-200/50 opacity-40'
                }`}
              >
                <motion.div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCompleted ? 'bg-green-500' : isActive ? 'bg-indigo-500' : 'bg-slate-200'
                  }`}
                  animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : isActive ? (
                    <Icon className="w-4 h-4 text-white" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                  )}
                </motion.div>
                <span className={`text-xs font-medium flex-1 text-left ${isActive ? 'text-slate-900' : isCompleted ? 'text-slate-600' : 'text-slate-400'}`}>
                  {step}
                </span>
                {isActive && (
                  <motion.div className="flex gap-0.5">
                    {[0, 0.15, 0.3].map((d, k) => (
                      <motion.span key={k} className="w-1 h-1 rounded-full bg-indigo-400"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: d }}
                      />
                    ))}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

      </motion.div>
    </div>
  );
}
