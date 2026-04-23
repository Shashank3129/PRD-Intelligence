import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/hooks/useAppStore';
import { UserMenu } from '@/components/UserMenu';
import { checkCompleteness } from '@/services/aiService';
import { ArrowLeft, ArrowRight, Check, AlertTriangle, X, Loader2, TrendingUp, Shield, Target } from 'lucide-react';
import type { CompletenessResult } from '@/types';
import { DEFAULT_COMPLETENESS_RESULT } from '@/constants';

export function CompletenessPage() {
  const { prd, setScreen, addToast } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<CompletenessResult>(DEFAULT_COMPLETENESS_RESULT);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  
  useEffect(() => {
    if (!prd) {
      setScreen('setup');
      return;
    }
    
    const analyze = async () => {
      try {
        const analysis = await checkCompleteness(prd);
        
        if (analysis.success && analysis.result) {
          setResult(analysis.result);
        } else {
          const errMsg = analysis.error || 'Failed to analyze completeness';
          setError(errMsg);
          addToast({ type: 'error', message: errMsg });
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'An error occurred while analyzing completeness';
        console.error('Error analyzing completeness:', error);
        setError(errMsg);
        addToast({ type: 'error', message: errMsg });
      } finally {
        setLoading(false);
      }
    };
    
    analyze();
  }, [prd, setScreen, addToast]);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };
  
  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'strong':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'needs_work':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'weak':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'strong':
        return 'Strong';
      case 'needs_work':
        return 'Needs work';
      case 'weak':
        return 'Weak';
      default:
        return '';
    }
  };
  
  const circumference = 2 * Math.PI * 55;
  const strokeDashoffset = circumference - (result.score / 100) * circumference;
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', filter: 'blur(80px)' }}
            animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </motion.div>
        
        <motion.div 
          className="text-center relative z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
          </motion.div>
          <p className="text-slate-500 text-base font-medium">Analyzing completeness...</p>
          <p className="text-slate-400 text-sm mt-2">This may take a moment</p>
        </motion.div>
      </div>
    );
  }
  
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
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </motion.div>
          <h2 className="font-bold text-xl text-slate-900 mb-2">Analysis Failed</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <motion.button
            onClick={() => setScreen('refine')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 mx-auto"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Refine
          </motion.button>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }}
          animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }}
          animate={{ scale: [1, 1.3, 1], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, delay: 3 }}
        />
      </div>

      {/* Header */}
      <header className="glass border-b border-slate-200/60 px-4 md:px-6 py-3 md:py-4 sticky top-0 z-10 backdrop-blur-xl bg-white/70">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <motion.div 
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200"
              whileHover={{ scale: 1.05, rotateY: 10 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              P
            </motion.div>
            <h1 className="font-bold text-sm md:text-lg text-slate-900">
              Completeness Check
            </h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <motion.button
              onClick={() => setScreen('refine')}
              className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors px-3 py-2 rounded-xl hover:bg-slate-100"
              whileHover={{ scale: 1.02, x: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Refine more</span>
              <span className="sm:hidden">Back</span>
            </motion.button>
            
            {result.verdict === 'READY' ? (
              <motion.button
                onClick={() => setScreen('disc-setup')}
                className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm py-2 px-3 md:px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium shadow-lg shadow-indigo-200 hover:shadow-xl transition-all"
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="hidden sm:inline">Select Reviewers</span>
                <span className="sm:hidden">Reviewers</span>
                <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </motion.button>
            ) : (
              <motion.button
                onClick={() => setScreen('disc-setup')}
                className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm py-2 px-3 md:px-4 rounded-xl border-2 border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-all font-medium"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                title="Proceed to reviewers despite the warning"
              >
                <span className="hidden sm:inline">Proceed anyway</span>
                <span className="sm:hidden">Proceed</span>
                <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </motion.button>
            )}
            <UserMenu className="h-9 w-9 rounded-xl" />
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10">
        {/* Left Panel - Score */}
        <div className="w-full lg:w-[380px] border-b lg:border-b-0 lg:border-r border-slate-200/60 bg-white/50 backdrop-blur-sm p-4 md:p-6 overflow-auto">
          {/* Score Circle */}
          <div className="text-center mb-6 md:mb-8">
            <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="55"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="10"
                />
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="55"
                  fill="none"
                  stroke={getScoreColor(result.score)}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span 
                  className="font-bold text-4xl md:text-5xl text-slate-900"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                >
                  {result.score}
                </motion.span>
                <span className="text-slate-400 text-sm font-medium">/100</span>
              </div>
            </div>
            
            {/* Verdict Badge */}
            <motion.div 
              className="mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {result.verdict === 'READY' ? (
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold border border-green-200 shadow-sm">
                  <Shield className="w-4 h-4" />
                  Ready for review
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold border border-amber-200 shadow-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Fix blockers first
                </span>
              )}
            </motion.div>
          </div>
          
          {/* Summary */}
          <motion.p 
            className="text-slate-600 text-sm mb-6 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {result.summary}
          </motion.p>
          
          {/* Blockers */}
          <AnimatePresence>
            {result.blockers.length > 0 && (
              <motion.div 
                className="mb-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <h3 className="text-red-600 font-semibold text-sm mb-3 flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Blockers
                </h3>
                <ul className="space-y-2">
                  {result.blockers.map((blocker, i) => (
                    <motion.li 
                      key={i} 
                      className="text-slate-600 text-sm pl-4 border-l-2 border-red-400 py-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + i * 0.1 }}
                    >
                      {blocker}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Suggestions */}
          <AnimatePresence>
            {result.suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
              >
                <h3 className="text-amber-600 font-semibold text-sm mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Suggestions
                </h3>
                <ul className="space-y-2">
                  {result.suggestions.map((suggestion, i) => (
                    <motion.li 
                      key={i} 
                      className="text-slate-600 text-sm pl-4 border-l-2 border-amber-400 py-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.1 + i * 0.1 }}
                    >
                      {suggestion}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Right Panel - Sections */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-3xl">
            <h2 className="font-bold text-lg md:text-xl text-slate-900 mb-4 md:mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" />
              Section Breakdown
            </h2>
            
            <div className="space-y-3">
              {result.sections.map((section, i) => (
                <motion.div
                  key={i}
                  className={`glass rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${getScoreBg(section.score)} hover:shadow-lg`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  onClick={() => setSelectedSection(selectedSection === i ? null : i)}
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      section.status === 'strong' ? 'bg-green-100' :
                      section.status === 'needs_work' ? 'bg-amber-100' :
                      'bg-red-100'
                    }`}>
                      {getStatusIcon(section.status)}
                    </div>
                    <div>
                      <h3 className="text-slate-900 font-semibold text-sm">
                        {section.name}
                      </h3>
                      <AnimatePresence>
                        {selectedSection === i && section.issue && (
                          <motion.p 
                            className="text-slate-500 text-xs mt-1"
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
                  
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      section.status === 'strong' ? 'bg-green-100 text-green-700' :
                      section.status === 'needs_work' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {getStatusLabel(section.status)}
                    </span>
                    <span className="text-slate-700 text-sm font-bold w-10 text-right">
                      {section.score}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
