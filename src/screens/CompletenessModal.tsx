import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkCompleteness } from '@/services/aiService';
import { ArrowRight, Check, AlertTriangle, X, TrendingUp, Shield, Target, Zap } from 'lucide-react';
import type { CompletenessResult } from '@/types';
import { DEFAULT_COMPLETENESS_RESULT } from '@/constants';

interface CompletenessModalProps {
  prd: string;
  onClose: () => void;
  onProceed: () => void;
}

function getScoreColor(score: number) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

function getScoreBg(status: string) {
  if (status === 'strong') return 'bg-green-50 border-green-200';
  if (status === 'needs_work') return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'strong': return <Check className="w-4 h-4 text-green-500" />;
    case 'needs_work': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case 'weak': return <X className="w-4 h-4 text-red-500" />;
    default: return null;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'strong': return 'Strong';
    case 'needs_work': return 'Needs work';
    case 'weak': return 'Weak';
    default: return '';
  }
}

export function CompletenessModal({ prd, onClose, onProceed }: CompletenessModalProps) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<CompletenessResult>(DEFAULT_COMPLETENESS_RESULT);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const analyze = async () => {
      try {
        const analysis = await checkCompleteness(prd);
        if (cancelled) return;
        if (analysis.success && analysis.result) {
          setResult(analysis.result);
        } else {
          setError(analysis.error || 'Failed to analyze completeness');
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    analyze();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const circumference = 2 * Math.PI * 55;
  const strokeDashoffset = circumference - (result.score / 100) * circumference;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200/60 overflow-hidden"
        initial={{ scale: 0.92, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 24 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Completeness Check</h2>
              <p className="text-slate-400 text-xs">PRD quality audit before discussion</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!loading && (
              result.verdict === 'READY' ? (
                <motion.button
                  onClick={onProceed}
                  className="flex items-center gap-1.5 text-xs md:text-sm py-2 px-3 md:px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium shadow-lg shadow-indigo-200 hover:shadow-xl transition-all"
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="hidden sm:inline">Select Reviewers</span>
                  <span className="sm:hidden">Reviewers</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              ) : (
                <motion.button
                  onClick={onProceed}
                  className="flex items-center gap-1.5 text-xs md:text-sm py-2 px-3 md:px-4 rounded-xl border-2 border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-all font-medium"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="hidden sm:inline">Proceed anyway</span>
                  <span className="sm:hidden">Proceed</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              )
            )}
            <motion.button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Loading state — 3D animated */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8 min-h-[320px] relative overflow-hidden">
            {/* Background ambient glow */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            >
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', filter: 'blur(50px)' }}
                animate={{ scale: [1, 1.4, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>

            <div className="text-center relative z-10">
              {/* 3D spinning rings */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                {[
                  { inset: 'inset-0', color: '#6366f1', dur: 2.8 },
                  { inset: 'inset-3', color: '#22d3ee', dur: 2.2 },
                  { inset: 'inset-6', color: '#a78bfa', dur: 1.8 },
                ].map(({ inset, color, dur }, idx) => (
                  <motion.div
                    key={idx}
                    className={`absolute ${inset} rounded-full border-2 border-slate-200/40`}
                    style={{ [idx === 0 ? 'borderTopColor' : idx === 1 ? 'borderRightColor' : 'borderBottomColor']: color }}
                    animate={{ rotate: idx % 2 === 0 ? 360 : -360 }}
                    transition={{ duration: dur, repeat: Infinity, ease: 'linear' }}
                  />
                ))}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-300/40">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                </motion.div>
              </div>

              <motion.p
                className="text-slate-700 text-base font-semibold mb-1"
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Analyzing your PRD…
              </motion.p>
              <p className="text-slate-400 text-sm">Checking all sections for completeness</p>

              {/* Progress dots */}
              <div className="flex justify-center gap-1.5 mt-5">
                {[0, 0.25, 0.5, 0.75].map((delay, k) => (
                  <motion.span
                    key={k}
                    className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                    animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <motion.div
                className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </motion.div>
              <h3 className="font-bold text-slate-900 mb-2">Analysis Failed</h3>
              <p className="text-slate-500 text-sm">{error}</p>
            </div>
          </div>
        ) : (
          /* Results */
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
            {/* Left — score summary */}
            <div className="w-full lg:w-[320px] border-b lg:border-b-0 lg:border-r border-slate-200/60 bg-slate-50/40 p-5 md:p-6 overflow-auto flex-shrink-0">
              {/* Score circle */}
              <div className="text-center mb-5">
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="50%" cy="50%" r="55" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                    <motion.circle
                      cx="50%" cy="50%" r="55" fill="none"
                      stroke={getScoreColor(result.score)}
                      strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset }}
                      transition={{ duration: 1.5, delay: 0.2, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                      className="font-bold text-4xl text-slate-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                    >
                      {result.score}
                    </motion.span>
                    <span className="text-slate-400 text-xs font-medium">/100</span>
                  </div>
                </div>

                <motion.div className="mt-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  {result.verdict === 'READY' ? (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-semibold border border-green-200">
                      <Shield className="w-3.5 h-3.5" />
                      Ready for review
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold border border-amber-200">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Fix blockers first
                    </span>
                  )}
                </motion.div>
              </div>

              <motion.p
                className="text-slate-600 text-sm mb-4 leading-relaxed"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              >
                {result.summary}
              </motion.p>

              {result.blockers.length > 0 && (
                <motion.div className="mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                  <h3 className="text-red-600 font-semibold text-xs uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5" /> Blockers
                  </h3>
                  <ul className="space-y-1.5">
                    {result.blockers.map((b, i) => (
                      <li key={i} className="text-slate-600 text-xs pl-3 border-l-2 border-red-400 py-0.5">{b}</li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {result.suggestions.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                  <h3 className="text-amber-600 font-semibold text-xs uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Suggestions
                  </h3>
                  <ul className="space-y-1.5">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="text-slate-600 text-xs pl-3 border-l-2 border-amber-400 py-0.5">{s}</li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>

            {/* Right — section breakdown */}
            <div className="flex-1 overflow-auto p-5 md:p-6 min-h-0">
              <h3 className="font-bold text-slate-900 text-sm md:text-base mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-500" />
                Section Breakdown
              </h3>
              <div className="space-y-2">
                {result.sections.map((section, i) => (
                  <motion.div
                    key={i}
                    className={`rounded-xl p-3.5 flex items-center justify-between cursor-pointer border transition-all hover:shadow-md ${getScoreBg(section.status)}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.04 }}
                    whileHover={{ scale: 1.01, x: 3 }}
                    onClick={() => setSelectedSection(selectedSection === i ? null : i)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        section.status === 'strong' ? 'bg-green-100' :
                        section.status === 'needs_work' ? 'bg-amber-100' : 'bg-red-100'
                      }`}>
                        {getStatusIcon(section.status)}
                      </div>
                      <div>
                        <p className="text-slate-900 font-medium text-sm">{section.name}</p>
                        <AnimatePresence>
                          {selectedSection === i && section.issue && (
                            <motion.p
                              className="text-slate-500 text-xs mt-0.5"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                            >
                              {section.issue}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        section.status === 'strong' ? 'bg-green-100 text-green-700' :
                        section.status === 'needs_work' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {getStatusLabel(section.status)}
                      </span>
                      <span className="text-slate-700 text-sm font-bold w-8 text-right">{section.score}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
