import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/hooks/useAppStore';
import { UserMenu } from '@/components/UserMenu';
import { refinePRD } from '@/services/aiService';
import { resolveCurrentUserId, savePRDWithTimeout, updatePRDWithTimeout } from '@/services/supabase';
import { ArrowRight, Send, Copy, Check, Menu, X, Bot, User, Download, Sparkles, AlertCircle, PenLine } from 'lucide-react';
import { CompletenessModal } from './CompletenessModal';

// ─── Markdown renderer ────────────────────────────────────────────────────────

function formatInline(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-slate-100 text-indigo-700 px-1 py-0.5 rounded text-xs font-mono">$1</code>');
}

function renderTable(tableLines: string[]): string {
  // Filter out separator rows (lines with only dashes/colons/pipes)
  const dataLines = tableLines.filter(l => !l.replace(/[|\s:]/g, '').match(/^[-]+$/));
  if (dataLines.length === 0) return '';

  const rows = dataLines.map(l =>
    l.split('|').slice(1, -1).map(c => c.trim())
  );

  const [header, ...body] = rows;
  const headerHtml = `<thead><tr>${
    header.map(h => `<th class="px-3 py-2 text-left text-xs font-bold text-slate-700 bg-indigo-50/60 border-b border-slate-200 uppercase tracking-wide">${formatInline(h)}</th>`).join('')
  }</tr></thead>`;
  const bodyHtml = `<tbody>${
    body.map((row, ri) => `<tr class="${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-100 hover:bg-indigo-50/30 transition-colors">${
      row.map(c => `<td class="px-3 py-2 text-sm text-slate-600 leading-relaxed">${formatInline(c)}</td>`).join('')
    }</tr>`).join('')
  }</tbody>`;

  return `<div class="overflow-x-auto my-4 rounded-xl border border-slate-200 shadow-sm"><table class="w-full text-left border-collapse">${headerHtml}${bodyHtml}</table></div>`;
}

function renderMarkdown(text: string): string {
  const lines = text.split('\n');
  const output: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // ── Table (3 or more consecutive lines starting with |) ──────────────
    if (trimmed.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      output.push(renderTable(tableLines));
      continue;
    }

    // ── Horizontal rule ───────────────────────────────────────────────────
    if (/^[-*_]{3,}$/.test(trimmed)) {
      output.push('<hr class="border-slate-200 my-5" />');
      i++;
      continue;
    }

    // ── ATX headings ──────────────────────────────────────────────────────
    if (/^# /.test(line)) {
      output.push(`<h1 class="font-bold text-xl md:text-2xl mt-6 mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">${formatInline(line.slice(2))}</h1>`);
      i++; continue;
    }
    if (/^## /.test(line)) {
      output.push(`<h2 class="font-bold text-lg md:text-xl text-indigo-700 border-b border-indigo-100 pb-1.5 mt-6 mb-3">${formatInline(line.slice(3))}</h2>`);
      i++; continue;
    }
    if (/^### /.test(line)) {
      output.push(`<h3 class="font-semibold text-base md:text-lg text-slate-800 mt-4 mb-2">${formatInline(line.slice(4))}</h3>`);
      i++; continue;
    }
    if (/^#### /.test(line)) {
      output.push(`<h4 class="font-semibold text-sm text-slate-700 mt-3 mb-1.5">${formatInline(line.slice(5))}</h4>`);
      i++; continue;
    }

    // ── Unordered list ────────────────────────────────────────────────────
    if (/^[-*+] /.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+] /.test(lines[i].trim())) {
        items.push(`<li class="pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-indigo-400 mb-1 leading-relaxed">${formatInline(lines[i].trim().slice(2))}</li>`);
        i++;
      }
      output.push(`<ul class="my-3 space-y-0.5 text-sm text-slate-700">${items.join('')}</ul>`);
      continue;
    }

    // ── Ordered list ──────────────────────────────────────────────────────
    if (/^\d+\. /.test(trimmed)) {
      const items: string[] = [];
      let num = 1;
      while (i < lines.length && /^\d+\. /.test(lines[i].trim())) {
        const content = lines[i].trim().replace(/^\d+\. /, '');
        items.push(`<li class="pl-1 mb-1 leading-relaxed">${formatInline(content)}</li>`);
        i++;
        num++;
      }
      output.push(`<ol class="my-3 space-y-0.5 text-sm text-slate-700 list-decimal list-inside">${items.join('')}</ol>`);
      void num;
      continue;
    }

    // ── Blockquote ────────────────────────────────────────────────────────
    if (/^> /.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^> /.test(lines[i].trim())) {
        items.push(formatInline(lines[i].trim().slice(2)));
        i++;
      }
      output.push(`<blockquote class="border-l-4 border-indigo-300 pl-4 my-3 text-slate-500 italic text-sm">${items.join('<br />')}</blockquote>`);
      continue;
    }

    // ── Empty line ────────────────────────────────────────────────────────
    if (trimmed === '') {
      i++;
      continue;
    }

    // ── Regular paragraph ─────────────────────────────────────────────────
    output.push(`<p class="mb-2.5 text-sm md:text-base leading-relaxed text-slate-700">${formatInline(trimmed)}</p>`);
    i++;
  }

  return output.join('\n');
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RefinePage() {
  const {
    prd,
    setPrd,
    currentPrdId,
    setCurrentPrdId,
    prdVersion,
    setPrdVersion,
    productCtx,
    setScreen,
    addPrdVersion,
    addToast,
    user,
    selectedCompany
  } = useAppStore();

  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: 'Your PRD is ready! I can help you refine it. Try asking me to:\n\n• Strengthen the problem statement with evidence\n• Add detailed mobile requirements\n• Make metrics more measurable with baselines\n• Expand the risk section\n• Add more functional requirements with acceptance criteria\n• Or anything else you want to improve'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [refineStatus, setRefineStatus] = useState<'idle' | 'writing' | 'completed'>('idle');
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPrd, setShowPrd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompletenessModal, setShowCompletenessModal] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const initialMsgCount = useRef(1);

  useEffect(() => {
    if (!prd || !productCtx) {
      setScreen('setup');
      return;
    }
  }, [prd, productCtx, setScreen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const handleSend = async () => {
    if (!input.trim() || loading || !productCtx) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    setMessages((prev) => {
      initialMsgCount.current = prev.length + 1;
      return [...prev, { role: 'user', content: userMessage }];
    });
    setLoading(true);
    setRefineStatus('writing');
    setStreamingText('');

    try {
      const result = await refinePRD(prd, userMessage, productCtx, (accumulated) => {
        setStreamingText(accumulated);
        if (accumulated.length > 100) setPrd(accumulated);
      });

      setStreamingText(null);

      if (result.success && result.text) {
        const nextVersion = prdVersion + 1;
        setPrd(result.text);
        setPrdVersion(nextVersion);
        addPrdVersion({
          version: nextVersion,
          date: new Date().toISOString(),
          summary: result.changes || 'Refined based on feedback'
        });

        try {
          if (currentPrdId) {
            await updatePRDWithTimeout(currentPrdId, {
              prd_content: result.text,
              product_name: productCtx.productName,
              version: nextVersion
            });
          } else if (selectedCompany?.id && user?.email) {
            const userId = await resolveCurrentUserId(user.id);
            const savedPrd = await savePRDWithTimeout({
              user_id: userId,
              company_id: selectedCompany.id,
              product_name: productCtx.productName,
              prd_content: result.text,
              version: nextVersion
            });
            setCurrentPrdId(savedPrd.id ?? null);
          }
        } catch (saveError) {
          console.error('[RefinePage] Failed to sync PRD:', saveError);
          addToast({
            type: 'warning',
            message: saveError instanceof Error
              ? saveError.message
              : 'PRD was refined, but syncing it to the dashboard failed.'
          });
        }

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: result.changes
              ? `PRD updated ✓\n\n${result.changes}`
              : 'PRD refined based on your request.'
          }
        ]);

        setRefineStatus('completed');
        setTimeout(() => setRefineStatus('idle'), 3500);

        if (result.error) addToast({ type: 'warning', message: result.error });
      } else {
        throw new Error(result.error || 'Failed to refine PRD');
      }
    } catch (err) {
      setStreamingText(null);
      setRefineStatus('idle');
      const msg = err instanceof Error ? err.message : 'Failed to refine PRD';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, I encountered an error: ${msg}. Please try again.` }
      ]);
      setError(msg);
      addToast({ type: 'error', message: msg });
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
      addToast({ type: 'success', message: 'PRD copied to clipboard!' });
    } catch {
      addToast({ type: 'error', message: 'Failed to copy PRD. Please try download instead.' });
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([prd], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PRD_${productCtx?.productName.replace(/\s+/g, '_') || 'Product'}_v${prdVersion}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast({ type: 'success', message: 'PRD downloaded!' });
    } catch {
      addToast({ type: 'error', message: 'Failed to download PRD' });
    }
  };

  const quickActions = [
    'Strengthen problem statement',
    'Add mobile requirements',
    'Make metrics measurable',
    'Add more risks'
  ];

  if (!prd || !productCtx) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-slate-500">Loading…</motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="glass border-b border-slate-200/60 px-4 md:px-6 py-3 md:py-4 flex-shrink-0 z-20 backdrop-blur-xl bg-white/70">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200"
              whileHover={{ scale: 1.05, rotateY: 10 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              P
            </motion.div>
            <div>
              <span className="text-slate-500 text-xs md:text-sm font-medium">Refine PRD</span>
              <h1 className="font-bold text-sm md:text-lg text-slate-900 truncate max-w-[150px] md:max-w-xs">
                {productCtx.productName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <motion.span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs md:text-sm font-semibold" whileHover={{ scale: 1.05 }}>
              v{prdVersion}
            </motion.span>
            <button
              onClick={() => setShowPrd(!showPrd)}
              className="md:hidden flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors p-2 rounded-lg hover:bg-slate-100"
            >
              {showPrd ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              PRD
            </button>
            <motion.button
              onClick={() => setShowCompletenessModal(true)}
              className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm py-2 px-3 md:px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium shadow-lg shadow-indigo-200 hover:shadow-xl transition-all"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="hidden sm:inline">Check Completeness</span>
              <span className="sm:hidden">Check</span>
              <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
            </motion.button>
            <UserMenu className="h-9 w-9 rounded-xl" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel - PRD View */}
        <div className={`${showPrd ? 'absolute inset-0 z-10 bg-white/95 backdrop-blur-xl' : 'hidden md:flex'} flex-1 flex-col overflow-hidden`}>
          <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-200/40 bg-white/60 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">v{prdVersion}</span>
              <span className="text-slate-500 text-xs truncate max-w-[160px] md:max-w-xs">{productCtx.productName}</span>
            </div>
            <div className="flex items-center gap-2">
              {showPrd && (
                <button onClick={() => setShowPrd(false)} className="md:hidden text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              )}
              <motion.button onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                {copied ? <><Check className="w-3.5 h-3.5 text-green-500" /><span className="text-green-600 font-medium hidden sm:inline">Copied</span></> : <><Copy className="w-3.5 h-3.5" /><span className="hidden sm:inline">Copy</span></>}
              </motion.button>
              <motion.button onClick={handleDownload}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Download className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </div>
          {/* Scrollable PRD content */}
          <div className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-3xl mx-auto">
              <motion.div
                className="prose prose-slate max-w-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                dangerouslySetInnerHTML={{ __html: (() => { try { return renderMarkdown(prd); } catch { return '<p class="text-red-500 text-sm">Failed to render PRD content.</p>'; } })() }}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - AI Chat */}
        <div className="w-full md:w-[420px] border-l border-slate-200/60 bg-white/80 backdrop-blur-lg flex flex-col shadow-xl shadow-slate-200/30 flex-shrink-0">
          {/* Chat Header */}
          <div className="p-3 md:p-4 border-b border-slate-200/60 flex items-center gap-3 bg-gradient-to-r from-indigo-50/50 to-violet-50/50 flex-shrink-0">
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200"
              animate={refineStatus === 'writing' ? { rotate: [0, 10, -10, 0] } : { rotate: [0, 5, -5, 0] }}
              transition={{ duration: refineStatus === 'writing' ? 0.8 : 4, repeat: Infinity }}
            >
              <Bot className="w-5 h-5 text-white" />
            </motion.div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 text-sm md:text-base">PRD Assistant</h3>
              <div className="flex items-center gap-2">
                <AnimatePresence mode="wait">
                  {refineStatus === 'writing' ? (
                    <motion.div key="writing" className="flex items-center gap-1.5"
                      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}>
                      <PenLine className="w-3 h-3 text-indigo-500 animate-pulse" />
                      <span className="text-xs text-indigo-600 font-medium">Writing PRD…</span>
                    </motion.div>
                  ) : refineStatus === 'completed' ? (
                    <motion.div key="completed" className="flex items-center gap-1.5"
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                      <motion.div
                        className="w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 0.5 }}
                      >
                        <Check className="w-2 h-2 text-white" />
                      </motion.div>
                      <span className="text-xs text-green-600 font-semibold">PRD Updated!</span>
                    </motion.div>
                  ) : (
                    <motion.div key="online" className="flex items-center gap-1.5"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <motion.span className="w-2 h-2 rounded-full bg-green-500" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                      <span className="text-xs text-slate-500">Online</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div className="mx-3 mt-3 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 flex-shrink-0"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <div className="flex-1 overflow-auto p-3 md:p-4 space-y-4 min-h-0">
            {messages.map((msg, i) => {
              const isNew = i >= initialMsgCount.current;
              return (
                <motion.div
                  key={i}
                  {...(isNew ? { initial: { opacity: 0, y: 12, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0.25 } } : {})}
                  className={msg.role === 'user' ? 'ml-auto max-w-[85%]' : 'mr-auto max-w-[90%]'}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {msg.role === 'assistant' ? (
                      <><div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center"><Bot className="w-3 h-3 text-indigo-600" /></div><span className="text-xs text-slate-500 font-medium">Assistant</span></>
                    ) : (
                      <><div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center"><User className="w-3 h-3 text-slate-600" /></div><span className="text-xs text-slate-500 font-medium">You</span></>
                    )}
                  </div>
                  <div className={`p-3.5 rounded-xl md:rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200/50' : 'bg-white/80 text-slate-700 border border-slate-200/60 shadow-sm'}`}>
                    {msg.content.split('\n').map((line, j) => (
                      <p key={j} className={j > 0 ? 'mt-2' : ''}>{line}</p>
                    ))}
                  </div>
                </motion.div>
              );
            })}

            {/* Streaming bubble */}
            {loading && streamingText !== null && (
              <motion.div className="mr-auto max-w-[90%]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center"><Bot className="w-3 h-3 text-indigo-600" /></div>
                  <span className="text-xs text-slate-500 font-medium">Assistant</span>
                  <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                </div>
                {streamingText.length > 0 ? (
                  <div className="bg-white/80 text-slate-700 border border-indigo-200 shadow-sm p-3.5 rounded-xl md:rounded-2xl text-sm leading-relaxed">
                    {streamingText.split('\n').slice(-4).map((line, j) => (
                      <p key={j} className={j > 0 ? 'mt-1' : ''}>{line}</p>
                    ))}
                    <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 animate-pulse align-middle" />
                  </div>
                ) : (
                  <div className="bg-white/80 border border-slate-200/60 shadow-sm p-4 rounded-xl md:rounded-2xl inline-flex items-center gap-3">
                    <div className="flex gap-1">
                      {[0, 0.2, 0.4].map((delay, k) => (
                        <motion.span key={k} className="w-2 h-2 rounded-full bg-indigo-400"
                          animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay }} />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">Thinking…</span>
                  </div>
                )}
              </motion.div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-3 md:px-4 py-2 flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
            {quickActions.map((action, i) => (
              <motion.button key={i} onClick={() => setInput(action)} disabled={loading}
                className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all shadow-sm disabled:opacity-40"
                whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
                {action}
              </motion.button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 md:p-4 border-t border-slate-200/60 bg-gradient-to-b from-white to-slate-50/50 flex-shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me to refine your PRD…"
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
        </div>
      </div>

      {/* Completeness Modal */}
      <AnimatePresence>
        {showCompletenessModal && (
          <CompletenessModal
            prd={prd}
            onClose={() => setShowCompletenessModal(false)}
            onProceed={() => { setShowCompletenessModal(false); setScreen('disc-setup'); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
