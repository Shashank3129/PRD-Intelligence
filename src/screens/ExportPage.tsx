import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/hooks/useAppStore';
import { ArrowLeft, Check, Copy, Download, RotateCcw, Share2 } from 'lucide-react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
}

export function ExportPage() {
  const { prd, productCtx, setScreen, addToast } = useAppStore();
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [copied, setCopied] = useState(false);
  const [showPrd, setShowPrd] = useState(false);
  
  // Guard: redirect if no PRD or product context
  useEffect(() => {
    if (!prd || !productCtx) {
      setScreen('setup');
    }
  }, [prd, productCtx, setScreen]);

  useEffect(() => {
    // Generate confetti with 3D positions
    const colors = ['#6366f1', '#22d3ee', '#f472b6', '#34d399', '#fbbf24', '#fde047', '#a78bfa', '#fb923c'];
    const pieces: ConfettiPiece[] = [];
    
    for (let i = 0; i < 80; i++) {
      pieces.push({
        id: i,
        x: Math.random() * 100,
        y: 100 + Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.8
      });
    }
    
    setConfetti(pieces);
    
    // Clean up confetti after animation
    const timeout = setTimeout(() => {
      setConfetti([]);
    }, 6000);
    
    return () => clearTimeout(timeout);
  }, []);
  
  const handleDownload = () => {
    try {
      const blob = new Blob([prd], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PRD_${productCtx?.productName.replace(/\s+/g, '_') || 'Product'}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast({ type: 'success', message: 'PRD downloaded' });
    } catch {
      addToast({ type: 'error', message: 'Failed to download PRD' });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
      addToast({ type: 'success', message: 'PRD copied to clipboard' });
    } catch {
      addToast({ type: 'error', message: 'Clipboard unavailable. Try download instead.' });
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${productCtx?.productName || 'Product'} PRD`,
      text: prd.slice(0, 500) + '...'
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        addToast({ type: 'success', message: 'Share dialog opened' });
      } else {
        await navigator.clipboard.writeText(prd);
        addToast({ type: 'success', message: 'Share unsupported — copied to clipboard instead' });
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      addToast({ type: 'error', message: 'Failed to share' });
    }
  };
  
  const handleStartOver = () => {
    // Clear PRD-specific state but keep company selection
    const store = useAppStore.getState();
    store.setProductCtx(null);
    store.setIdea('');
    store.setPrd('');
    store.setPrdVersion(1);
    store.resetPersonaStatuses();
    store.resetDiscussionState();

    // Navigate to dashboard
    setScreen('dashboard');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
      {/* Top nav bar with back button */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 md:px-8 py-4">
        <motion.button
          onClick={handleStartOver}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium text-sm px-3 py-2 rounded-xl hover:bg-white/60 backdrop-blur-sm transition-all"
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </motion.button>
      </div>
    <div className="flex items-center justify-center min-h-screen py-16 md:py-24 px-4">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full"
          style={{ 
            background: 'radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%)',
            filter: 'blur(60px)'
          }}
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, 30, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] md:w-[400px] md:h-[400px] rounded-full"
          style={{ 
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            filter: 'blur(60px)'
          }}
          animate={{ 
            scale: [1, 1.4, 1],
            x: [0, -20, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        />
      </div>
      
      {/* 3D Confetti */}
      <AnimatePresence>
        {confetti.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute w-2 h-2 md:w-3 md:h-3 rounded-sm pointer-events-none"
            style={{
              left: `${piece.x}%`,
              backgroundColor: piece.color,
            }}
            initial={{ 
              y: `${piece.y}vh`, 
              opacity: 1, 
              rotateX: 0, 
              rotateY: 0, 
              rotateZ: piece.rotation,
              scale: piece.scale
            }}
            animate={{ 
              y: '-20vh', 
              opacity: 0,
              rotateX: 720,
              rotateY: 360,
              rotateZ: piece.rotation + 720
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 4 + Math.random() * 2,
              ease: 'easeOut',
              delay: Math.random() * 0.5
            }}
          />
        ))}
      </AnimatePresence>
      
      <motion.div 
        className="relative z-10 max-w-4xl mx-auto w-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Success Icon */}
        <motion.div 
          className="text-center mb-8 md:mb-10"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <motion.div 
            className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-xl shadow-green-200"
            animate={{ 
              boxShadow: [
                '0 0 30px rgba(52,211,153,0.3)',
                '0 0 50px rgba(52,211,153,0.5)',
                '0 0 30px rgba(52,211,153,0.3)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Check className="w-10 h-10 md:w-12 md:h-12 text-green-600" />
          </motion.div>
          
          <motion.h1 
            className="font-bold text-3xl md:text-4xl lg:text-5xl text-slate-900 mb-3 md:mb-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            PRD Approved!
          </motion.h1>
          
          <motion.p 
            className="text-slate-500 text-lg md:text-xl max-w-lg mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Your PRD has been reviewed and approved by all stakeholders. 
            Ready to ship!
          </motion.p>
        </motion.div>
        
        {/* Export Options */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            onClick={handleDownload}
            className="glass rounded-xl p-6 md:p-8 text-center hover:shadow-xl transition-all group bg-white"
            whileHover={{ 
              y: -8, 
              scale: 1.02,
            }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div 
              className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:bg-indigo-200 transition-colors"
              whileHover={{ rotate: 5 }}
            >
              <Download className="w-7 h-7 md:w-8 md:h-8 text-indigo-600" />
            </motion.div>
            <h3 className="font-bold text-lg md:text-xl text-slate-900 mb-1">
              Download TXT
            </h3>
            <p className="text-slate-500 text-sm">
              Save as text file
            </p>
          </motion.button>
          
          <motion.button
            onClick={handleCopy}
            className="glass rounded-xl p-6 md:p-8 text-center hover:shadow-xl transition-all group bg-white"
            whileHover={{ 
              y: -8, 
              scale: 1.02,
            }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div 
              className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:bg-green-200 transition-colors"
              whileHover={{ rotate: 5 }}
            >
              {copied ? (
                <Check className="w-7 h-7 md:w-8 md:h-8 text-green-600" />
              ) : (
                <Copy className="w-7 h-7 md:w-8 md:h-8 text-green-600" />
              )}
            </motion.div>
            <h3 className="font-bold text-lg md:text-xl text-slate-900 mb-1">
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </h3>
            <p className="text-slate-500 text-sm">
              {copied ? 'Ready to paste' : 'Copy full PRD'}
            </p>
          </motion.button>
          
          <motion.button
            onClick={handleShare}
            className="glass rounded-xl p-6 md:p-8 text-center hover:shadow-xl transition-all group bg-white"
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-pink-100 flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:bg-pink-200 transition-colors"
              whileHover={{ rotate: 5 }}
            >
              <Share2 className="w-7 h-7 md:w-8 md:h-8 text-pink-600" />
            </motion.div>
            <h3 className="font-bold text-lg md:text-xl text-slate-900 mb-1">
              Share
            </h3>
            <p className="text-slate-500 text-sm">
              Native share or copy
            </p>
          </motion.button>
        </motion.div>
        
        {/* PRD Preview */}
        <motion.div 
          className="glass rounded-xl md:rounded-2xl overflow-hidden mb-6 md:mb-8 bg-white shadow-lg shadow-slate-200/50"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-green-600 font-semibold text-sm">APPROVED</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-900 font-medium text-sm truncate max-w-[150px] md:max-w-none">{productCtx?.productName}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPrd(!showPrd)}
                className="text-slate-500 hover:text-slate-900 text-sm font-medium"
              >
                {showPrd ? 'Hide' : 'Show'}
              </button>
              <button
                onClick={handleCopy}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <AnimatePresence>
            {showPrd && (
              <motion.div 
                className="p-4 md:p-6 max-h-[300px] md:max-h-[400px] overflow-auto"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <pre className="text-sm text-slate-600 whitespace-pre-wrap font-mono">
                  {prd.slice(0, 2000)}...
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Start Over */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <motion.button
            onClick={handleStartOver}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm md:text-base font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RotateCcw className="w-4 h-4" />
            Create another PRD
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
    </div>
  );
}