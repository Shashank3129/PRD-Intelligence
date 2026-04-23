import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/hooks/useAppStore';
import { UserMenu } from '@/components/UserMenu';
import { generatePersonaMessage, parseAIResponse } from '@/services/aiService';
import { resolveCurrentUserId, savePRDWithTimeout, updatePRDWithTimeout } from '@/services/supabase';
import { ArrowRight, ArrowLeft, Send, SkipForward, Check, X, FileText, Menu, ChevronLeft, User, AlertCircle, Bot, Sparkles } from 'lucide-react';
import type { Persona } from '@/types';

// ─── Simple inline markdown renderer ─────────────────────────────────────────
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1 py-0.5 rounded bg-slate-100 text-xs font-mono text-indigo-700">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function MarkdownView({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let tableBuffer: string[] = [];
  let i = 0;

  const flushTable = () => {
    if (tableBuffer.length === 0) return;
    const rows = tableBuffer.filter(r => !/^\|[-| :]+\|/.test(r.trim()));
    elements.push(
      <div key={`table-${i}`} className="overflow-x-auto my-3 rounded-lg border border-slate-200">
        <table className="min-w-full text-xs text-left border-collapse">
          <tbody>
            {rows.map((row, ri) => {
              const cells = row.split('|').filter((_, ci) => ci > 0 && ci < row.split('|').length - 1);
              return (
                <tr key={ri} className={ri === 0 ? 'bg-slate-50 font-semibold text-slate-700' : 'border-t border-slate-100 text-slate-600 hover:bg-slate-50/50'}>
                  {cells.map((cell, ci) => (
                    <td key={ci} className="px-3 py-1.5 whitespace-nowrap">{cell.trim()}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
    tableBuffer = [];
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('| ') || trimmed.startsWith('|-')) {
      tableBuffer.push(trimmed);
      i++;
      continue;
    } else {
      flushTable();
    }

    if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-xl font-bold text-slate-900 mt-6 mb-2">{renderInline(trimmed.slice(2))}</h1>);
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-base font-bold text-slate-800 mt-5 mb-1.5 pb-1 border-b border-slate-200">{renderInline(trimmed.slice(3))}</h2>);
    } else if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-sm font-semibold text-slate-800 mt-4 mb-1">{renderInline(trimmed.slice(4))}</h3>);
    } else if (trimmed.startsWith('#### ')) {
      elements.push(<h4 key={i} className="text-sm font-semibold text-indigo-700 mt-3 mb-0.5">{renderInline(trimmed.slice(5))}</h4>);
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex gap-2 ml-4 my-0.5">
          <span className="text-indigo-400 mt-0.5 flex-shrink-0">•</span>
          <span className="text-slate-600 text-sm">{renderInline(trimmed.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)\./)?.[1];
      elements.push(
        <div key={i} className="flex gap-2 ml-4 my-0.5">
          <span className="text-indigo-500 font-semibold text-sm flex-shrink-0">{num}.</span>
          <span className="text-slate-600 text-sm">{renderInline(trimmed.replace(/^\d+\.\s/, ''))}</span>
        </div>
      );
    } else if (trimmed === '' || trimmed === '---') {
      elements.push(<div key={i} className={trimmed === '---' ? 'border-t border-slate-200 my-3' : 'h-2'} />);
    } else if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-l-4 border-indigo-200 pl-4 py-1 my-2 bg-indigo-50/50 rounded-r-lg">
          <p className="text-slate-600 text-sm italic">{renderInline(trimmed.slice(2))}</p>
        </blockquote>
      );
    } else if (trimmed) {
      elements.push(<p key={i} className="text-slate-600 text-sm leading-relaxed">{renderInline(trimmed)}</p>);
    }
    i++;
  }
  flushTable();
  return <div className="space-y-0.5">{elements}</div>;
}

// ─── Persona avatar — image with emoji fallback ───────────────────────────────
function PersonaAvatar({
  persona,
  size = 'md',
  className = ''
}: {
  persona: Persona;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const sizeMap = {
    sm: 'w-6 h-6 text-xs rounded-md',
    md: 'w-9 h-9 text-base rounded-lg',
    lg: 'w-11 h-11 md:w-12 md:h-12 text-xl md:text-2xl rounded-xl'
  };
  const cls = `${sizeMap[size]} flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden ${className}`;

  if (persona.avatar && !imgError) {
    return (
      <div
        className={cls}
        style={{ border: `1.5px solid ${persona.borderColor}` }}
      >
        <img
          src={persona.avatar}
          alt={persona.name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cls}
      style={{ backgroundColor: persona.bgColor, color: persona.color }}
    >
      {persona.icon}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DiscussionPage() {
  const {
    selectedPersonas,
    personaStatuses,
    setPersonaStatus,
    conversations,
    addMessage,
    prd,
    setPrd,
    currentPrdId,
    setCurrentPrdId,
    prdVersion,
    productCtx,
    prdDeltaCount,
    incrementPrdDelta,
    setScreen,
    addToast,
    resetDiscussionState,
    user,
    selectedCompany
  } = useAppStore();

  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [showPrdModal, setShowPrdModal] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [isLgScreen, setIsLgScreen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const requestVersionRef = useRef(0);
  const activeRequestIdRef = useRef<number | null>(null);
  // Track how many messages existed when we opened each persona — only animate new ones
  const personaInitialMsgCount = useRef<Record<string, number>>({});
  // In-flight guard to prevent StrictMode double-invocation of openPersona
  const openingPersonaId = useRef<string | null>(null);

  const sortedPersonas = [...selectedPersonas].sort((a, b) => a.order - b.order);

  useEffect(() => {
    const handleResize = () => setIsLgScreen(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!productCtx || !prd) {
      setScreen('setup');
      return;
    }
  }, [productCtx, prd, setScreen]);

  // Auto-open first pending persona — StrictMode safe
  useEffect(() => {
    let cancelled = false;

    const firstPending = sortedPersonas.find(p => !personaStatuses[p.id]);
    if (firstPending && !activePersonaId) {
      openPersona(firstPending.id, () => cancelled);
    }

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activePersonaId, streamingText]);

  useEffect(() => {
    return () => {
      requestVersionRef.current += 1;
      activeRequestIdRef.current = null;
    };
  }, []);

  const beginRequest = () => {
    const requestId = ++requestVersionRef.current;
    activeRequestIdRef.current = requestId;
    setLoading(true);
    setStreamingText('');
    return requestId;
  };

  const isCurrentRequest = (requestId: number) => activeRequestIdRef.current === requestId;

  const finishRequest = (requestId: number) => {
    if (!isCurrentRequest(requestId)) return false;
    activeRequestIdRef.current = null;
    setLoading(false);
    setStreamingText(null);
    return true;
  };

  const cancelActiveRequest = () => {
    requestVersionRef.current += 1;
    activeRequestIdRef.current = null;
    setLoading(false);
    setStreamingText(null);
  };

  // openPersona accepts an optional isCancelled getter for StrictMode safety
  const openPersona = useCallback(async (
    personaId: string,
    isCancelled?: () => boolean
  ) => {
    const persona = sortedPersonas.find(p => p.id === personaId);
    if (!persona || !productCtx) return;

    if (activePersonaId && activePersonaId !== personaId && activeRequestIdRef.current !== null) {
      cancelActiveRequest();
    }

    setActivePersonaId(personaId);
    setShowQueue(false);
    setError(null);

    const existing = conversations[personaId] || [];
    // Snapshot current message count so we don't animate existing messages
    personaInitialMsgCount.current[personaId] = existing.length;

    if (existing.length === 0) {
      // In-flight guard: if another call for this personaId is already in flight, skip
      if (openingPersonaId.current === personaId) return;
      openingPersonaId.current = personaId;

      const requestId = beginRequest();
      setPersonaStatus(personaId, 'active');

      try {
        const result = await generatePersonaMessage(
          persona, productCtx, prd, [], true,
          (accumulated) => {
            if (isCancelled?.() || !isCurrentRequest(requestId)) return;
            setStreamingText(accumulated);
          }
        );

        // If StrictMode cancelled this invocation, bail out without side-effects
        if (isCancelled?.() || !isCurrentRequest(requestId)) {
          openingPersonaId.current = null;
          return;
        }

        if (result.success) {
          personaInitialMsgCount.current[personaId] = 0;
          addMessage(personaId, { role: 'assistant', content: result.text || '' });
        } else {
          throw new Error(result.error || 'Failed to get opening message');
        }
      } catch (err) {
        if (isCancelled?.() || !isCurrentRequest(requestId)) {
          openingPersonaId.current = null;
          return;
        }
        const msg = err instanceof Error ? err.message : 'Failed to start conversation';
        setError(msg);
        addToast({ type: 'error', message: msg });
      }

      openingPersonaId.current = null;
      finishRequest(requestId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedPersonas, productCtx, prd, conversations, activePersonaId]);

  const handleSend = async () => {
    if (!input.trim() || !activePersonaId || loading || !productCtx) return;

    const persona = sortedPersonas.find(p => p.id === activePersonaId);
    if (!persona) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    const currentConvo = conversations[activePersonaId] || [];
    const conversationForModel = [...currentConvo, { role: 'user', content: userMessage }];
    personaInitialMsgCount.current[activePersonaId] = currentConvo.length + 1;
    addMessage(activePersonaId, { role: 'user', content: userMessage });
    const requestId = beginRequest();

    try {
      const result = await generatePersonaMessage(
        persona, productCtx, prd, conversationForModel, false,
        (accumulated) => {
          if (isCurrentRequest(requestId)) setStreamingText(accumulated);
        }
      );

      if (!isCurrentRequest(requestId)) return;

      if (result.success) {
        const parsed = parseAIResponse(result.text || '');
        addMessage(activePersonaId, { role: 'assistant', content: parsed.cleanText });

        if (parsed.updates.length > 0) {
          let updatedPrd = prd;
          parsed.updates.forEach(update => {
            updatedPrd += `\n\n## Update from ${persona.name}\n${update.content}`;
          });
          setPrd(updatedPrd);
          incrementPrdDelta();

          try {
            if (currentPrdId) {
              await updatePRDWithTimeout(currentPrdId, {
                prd_content: updatedPrd,
                product_name: productCtx.productName,
                version: prdVersion
              });
            } else if (selectedCompany?.id && user?.email) {
              const userId = await resolveCurrentUserId(user.id);
              const savedPrd = await savePRDWithTimeout({
                user_id: userId,
                company_id: selectedCompany.id,
                product_name: productCtx.productName,
                prd_content: updatedPrd,
                version: prdVersion
              });
              setCurrentPrdId(savedPrd.id ?? null);
            }
          } catch (saveError) {
            console.error('[DiscussionPage] Failed to sync PRD update:', saveError);
            addToast({
              type: 'warning',
              message: saveError instanceof Error
                ? saveError.message
                : 'Discussion updates were applied, but syncing the PRD failed.'
            });
          }
        }

        if (parsed.approved) {
          setPersonaStatus(activePersonaId, 'approved');
          setTimeout(() => {
            const currentIndex = sortedPersonas.findIndex(p => p.id === activePersonaId);
            const nextPending = sortedPersonas.slice(currentIndex + 1).find(p =>
              !personaStatuses[p.id] || personaStatuses[p.id] === 'pending'
            );
            if (nextPending) openPersona(nextPending.id);
          }, 1400);
        }
      } else {
        throw new Error(result.error || 'Failed to get response');
      }
    } catch (err) {
      if (!isCurrentRequest(requestId)) return;
      const msg = err instanceof Error ? err.message : 'Failed to send message';
      setError(msg);
      addToast({ type: 'error', message: msg });
    } finally {
      finishRequest(requestId);
    }
  };

  const handleSkip = () => {
    if (!activePersonaId) return;
    cancelActiveRequest();
    setError(null);
    setPersonaStatus(activePersonaId, 'skipped');
    const currentIndex = sortedPersonas.findIndex(p => p.id === activePersonaId);
    const nextPending = sortedPersonas.slice(currentIndex + 1).find(p =>
      !personaStatuses[p.id] || personaStatuses[p.id] === 'pending'
    );
    if (nextPending) openPersona(nextPending.id);
    else setActivePersonaId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'approved': return <Check className="w-4 h-4 text-green-500" />;
      case 'skipped': return <X className="w-4 h-4 text-slate-400" />;
      case 'active': return (
        <motion.div className="w-2.5 h-2.5 rounded-full bg-indigo-500"
          animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
      );
      default: return <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-300" />;
    }
  };

  const activePersona = activePersonaId ? sortedPersonas.find(p => p.id === activePersonaId) : null;
  const allApproved = sortedPersonas.every(p =>
    personaStatuses[p.id] === 'approved' || personaStatuses[p.id] === 'skipped'
  );
  const allApprovedOnly = sortedPersonas.every(p => personaStatuses[p.id] === 'approved');

  if (!productCtx || !prd) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-slate-500">Loading…</motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)', filter: 'blur(80px)' }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
      </div>

      {/* Header */}
      <header className="glass border-b border-slate-200/60 px-4 md:px-6 py-3 md:py-4 flex-shrink-0 z-20 backdrop-blur-xl bg-white/70">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setShowQueue(!showQueue)}
              className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <Menu className="w-4 h-4 text-slate-600" />
            </button>
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200"
              whileHover={{ scale: 1.05, rotateY: 10 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              P
            </motion.div>
            <h1 className="font-bold text-sm md:text-lg text-slate-900 hidden sm:block">Stakeholder Discussion</h1>
            {allApprovedOnly && (
              <motion.span
                className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs md:text-sm font-semibold border border-green-200"
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
              >
                All done
              </motion.span>
            )}
          </div>

          <div className="flex items-center gap-1.5 md:gap-3">
            <motion.button
              onClick={() => { cancelActiveRequest(); resetDiscussionState(); setScreen('refine'); }}
              className="flex items-center gap-1.5 text-xs md:text-sm text-slate-500 hover:text-slate-900 transition-colors px-2 md:px-3 py-2 rounded-xl hover:bg-slate-100"
              whileHover={{ scale: 1.02, x: -2 }} whileTap={{ scale: 0.98 }}
              title="Go back to refine your PRD and restart the review"
            >
              <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Refine PRD</span>
            </motion.button>
            <motion.button
              onClick={() => setShowPrdModal(true)}
              className="flex items-center gap-1.5 text-xs md:text-sm text-slate-500 hover:text-slate-900 transition-colors px-2 md:px-3 py-2 rounded-xl hover:bg-slate-100"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            >
              <FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">View PRD</span>
            </motion.button>
            {allApproved && (
              <motion.button
                onClick={() => setScreen('export')}
                className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm py-2 px-3 md:px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium shadow-lg shadow-indigo-200 hover:shadow-xl transition-all"
                whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
              >
                <span className="hidden sm:inline">Export PRD</span>
                <span className="sm:hidden">Export</span>
                <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </motion.button>
            )}
            <UserMenu className="h-9 w-9 rounded-xl" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative z-10 min-h-0">
        {/* Left Panel - Reviewer Queue */}
        <AnimatePresence>
          {(showQueue || isLgScreen) && (
            <motion.div
              className={`${showQueue && !isLgScreen ? 'flex absolute inset-y-0 left-0 z-30 w-[260px] shadow-2xl' : isLgScreen ? 'flex w-[240px] xl:w-[260px]' : 'hidden'} border-r border-slate-200/60 bg-white/80 backdrop-blur-xl flex-col flex-shrink-0`}
              initial={{ x: -260, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -260, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="flex-1 overflow-auto p-4">
                <div className="flex items-center justify-between lg:hidden mb-4">
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Reviewers</h3>
                  <button onClick={() => setShowQueue(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="hidden lg:block text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">Reviewers</h3>

                <div className="space-y-1">
                  {sortedPersonas.map((persona) => {
                    const status = personaStatuses[persona.id];
                    const isActive = activePersonaId === persona.id;
                    return (
                      <motion.button
                        key={persona.id}
                        onClick={() => { if (!status || status === 'pending') openPersona(persona.id); }}
                        disabled={status === 'approved' || status === 'skipped'}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-indigo-50 border-2 border-indigo-200 shadow-md shadow-indigo-100/50' : 'hover:bg-slate-50 border-2 border-transparent'} ${status === 'approved' || status === 'skipped' ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
                        whileHover={status !== 'approved' && status !== 'skipped' ? { x: 4, scale: 1.02 } : {}}
                        whileTap={status !== 'approved' && status !== 'skipped' ? { scale: 0.98 } : {}}
                      >
                        <PersonaAvatar persona={persona} size="md" />
                        <div className="flex-1 text-left min-w-0">
                          <p className={`text-sm truncate font-medium ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>{persona.name}</p>
                          <p className="text-xs text-slate-400 truncate">{persona.role}</p>
                        </div>
                        {getStatusIcon(status)}
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {prdDeltaCount > 0 && (
                    <motion.div
                      className="mt-6 p-4 rounded-xl bg-green-50 border border-green-200"
                      initial={{ scale: 0.9, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                    >
                      <p className="text-green-700 text-sm font-semibold flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        {prdDeltaCount} PRD update{prdDeltaCount > 1 ? 's' : ''}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile queue overlay */}
        <AnimatePresence>
          {showQueue && (
            <motion.div
              className="absolute inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowQueue(false)}
            />
          )}
        </AnimatePresence>

        {/* Center Panel - Chat */}
        <div className="flex-1 flex flex-col bg-white/40 backdrop-blur-sm min-w-0 min-h-0 overflow-hidden">
          {activePersona ? (
            <>
              {/* Persona Header */}
              <div className="p-4 border-b border-slate-200/60 flex items-center justify-between bg-gradient-to-r from-slate-50/80 to-white/80 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-center gap-3 md:gap-4">
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <PersonaAvatar persona={activePersona} size="lg" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-sm md:text-base text-slate-900">{activePersona.name}</h3>
                    <p style={{ color: activePersona.color }} className="text-xs md:text-sm font-semibold">{activePersona.role}</p>
                  </div>
                  {loading && (
                    <div className="flex items-center gap-1.5 ml-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      <span className="text-xs text-slate-400">Reviewing…</span>
                    </div>
                  )}
                </div>

                {personaStatuses[activePersona.id] !== 'approved' && (
                  <motion.button
                    onClick={handleSkip}
                    className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-slate-500 hover:text-slate-900 transition-colors px-3 py-2 rounded-xl hover:bg-slate-100"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  >
                    <SkipForward className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Skip</span>
                  </motion.button>
                )}
              </div>

              {/* Error Banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="mx-4 mt-3 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 flex-shrink-0"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages */}
              <div className="flex-1 overflow-auto p-4 space-y-4 min-h-0">
                {(conversations[activePersona.id] || []).map((msg, i) => {
                  const baseline = personaInitialMsgCount.current[activePersona.id] ?? 0;
                  const isNew = i >= baseline;
                  return (
                    <motion.div
                      key={i}
                      {...(isNew ? { initial: { opacity: 0, y: 12, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0.25 } } : {})}
                      className={msg.role === 'user' ? 'ml-auto max-w-[85%]' : 'mr-auto max-w-[90%]'}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        {msg.role === 'assistant' && (
                          <>
                            <PersonaAvatar persona={activePersona} size="sm" />
                            <span className="text-xs text-slate-500 font-medium">{activePersona.name}</span>
                          </>
                        )}
                        {msg.role === 'user' && (
                          <>
                            <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                              <User className="w-3 h-3 text-slate-600" />
                            </div>
                            <span className="text-xs text-slate-500 font-medium">You</span>
                          </>
                        )}
                      </div>
                      <div className={`p-3.5 rounded-xl md:rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200/50' : 'bg-white/90 text-slate-700 border border-slate-200/60 shadow-sm'}`}>
                        {msg.content.split('\n').map((line, j) => (
                          <p key={j} className={j > 0 ? 'mt-2' : ''}>{line}</p>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}

                {/* Streaming / typing bubble */}
                {loading && streamingText !== null && (
                  <motion.div className="mr-auto max-w-[90%]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <PersonaAvatar persona={activePersona} size="sm" />
                      <span className="text-xs text-slate-500 font-medium">{activePersona.name}</span>
                      <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                    </div>
                    {streamingText.length > 0 ? (
                      <div className="bg-white/90 text-slate-700 border border-indigo-200 shadow-sm p-3.5 rounded-xl md:rounded-2xl text-sm leading-relaxed">
                        {streamingText.split('\n').map((line, j) => (
                          <p key={j} className={j > 0 ? 'mt-2' : ''}>{line}</p>
                        ))}
                        <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 animate-pulse align-middle" />
                      </div>
                    ) : (
                      /* Typing indicator bubble */
                      <div className="bg-white/90 border border-slate-200/60 shadow-sm p-4 rounded-xl md:rounded-2xl inline-flex items-center gap-3">
                        <div className="flex gap-1">
                          {[0, 0.18, 0.36].map((delay, k) => (
                            <motion.span key={k} className="w-2 h-2 rounded-full bg-slate-400"
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.55, repeat: Infinity, delay, ease: 'easeInOut' }}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-400">{activePersona.name} is reviewing…</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {personaStatuses[activePersona.id] === 'approved' && (
                  <motion.div className="flex justify-center" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
                    <div className="rounded-xl px-6 py-3 flex items-center gap-3 border border-green-200 bg-green-50/80 shadow-md">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-200">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-green-700 font-semibold">{activePersona.name} approved</span>
                    </div>
                  </motion.div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              {personaStatuses[activePersona.id] !== 'approved' && (
                <div className="p-4 border-t border-slate-200/60 bg-gradient-to-b from-white to-slate-50/50 flex-shrink-0">
                  <div className="flex items-end gap-2 max-w-3xl mx-auto">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Respond to ${activePersona.name}…`}
                      rows={2}
                      disabled={loading}
                      className="flex-1 resize-none px-4 py-3 rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm hover:border-slate-300 disabled:opacity-50"
                    />
                    <motion.button
                      onClick={handleSend}
                      disabled={!input.trim() || loading}
                      className="w-11 h-11 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 flex items-center justify-center text-white hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                      whileHover={input.trim() && !loading ? { scale: 1.08, rotate: 5 } : {}}
                      whileTap={input.trim() && !loading ? { scale: 0.92 } : {}}
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              )}
            </>
          ) : allApproved ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <motion.div className="text-center" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
                <motion.div
                  className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-200"
                  animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}
                >
                  <Check className="w-12 h-12 text-green-600" />
                </motion.div>
                <h3 className="font-bold text-2xl md:text-3xl text-slate-900 mb-3">All reviewers approved!</h3>
                <p className="text-slate-500 mb-8 text-lg">Your PRD has been reviewed by all stakeholders.</p>
                <motion.button
                  onClick={() => setScreen('export')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl transition-all"
                  whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                >
                  Export Approved PRD
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Bot className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">Select a reviewer to start</p>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* PRD Modal */}
      <AnimatePresence>
        {showPrdModal && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPrdModal(false)}
          >
            <motion.div
              className="rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col bg-white/95 shadow-2xl border border-white/60"
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-200/60 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
                <h3 className="font-bold text-base md:text-lg text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  PRD
                </h3>
                <motion.button
                  onClick={() => setShowPrdModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
              <div className="flex-1 overflow-auto p-4 md:p-6 min-h-0">
                {prd ? <MarkdownView content={prd} /> : (
                  <p className="text-slate-400 text-sm">No PRD content available.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
