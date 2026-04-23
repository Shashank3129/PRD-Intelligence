import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/hooks/useAppStore';
import { signInWithGoogle } from '@/services/supabase';
import { Loader2, ArrowLeft, Sparkles, AlertCircle, Shield, Zap, Star } from 'lucide-react';

const cardVariants = {
  hidden: { opacity: 0, y: 60, rotateX: -20, scale: 0.85 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }
  }
};

const floatingVariants = {
  animate: {
    y: [0, -15, 0],
    rotate: [0, 5, -5, 0],
    transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' }
  }
} as any;

// Inline Google logo SVG
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function AuthPage() {
  const { setScreen } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
      setError(msg);
      setLoading(false);
    }
  };

  const features = [
    { icon: Zap, text: 'AI-generated PRDs in minutes', color: 'text-amber-500', bg: 'bg-amber-50' },
    { icon: Star, text: 'Chat-based refinement', color: 'text-violet-500', bg: 'bg-violet-50' },
    { icon: Shield, text: '9 stakeholder personas review', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { icon: Sparkles, text: 'Export, share, and iterate', color: 'text-cyan-500', bg: 'bg-cyan-50' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Animated Background Layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', filter: 'blur(100px)' }}
          animate={{ scale: [1, 1.3, 1], x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)', filter: 'blur(100px)' }}
          animate={{ scale: [1, 1.4, 1], x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)', filter: 'blur(120px)' }}
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Floating geometric shapes */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-4 rounded-lg bg-gradient-to-br from-indigo-400/20 to-purple-400/20 backdrop-blur-sm border border-white/30"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            variants={floatingVariants}
            animate="animate"
            transition={{ delay: i * 0.8, duration: 4 + i }}
          />
        ))}
        
        <div className="absolute inset-0 grid-pattern opacity-[0.03]" />
      </div>

      <motion.button
        onClick={() => setScreen('landing')}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium group px-3 py-2 rounded-xl hover:bg-white/60 backdrop-blur-sm border border-transparent hover:border-white/60"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05, x: -2 }}
        whileTap={{ scale: 0.97 }}
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to home
      </motion.button>

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial="hidden"
        animate="visible"
        style={{ perspective: '1200px' }}
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
      >
        {/* Logo */}
        <motion.div className="text-center mb-10" variants={cardVariants}>
          <motion.div
            className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl mb-6 shadow-2xl shadow-indigo-300/50 relative overflow-hidden"
            animate={{ 
              boxShadow: ['0 20px 40px rgba(99,102,241,0.3)', '0 30px 60px rgba(99,102,241,0.5)', '0 20px 40px rgba(99,102,241,0.3)'],
              rotateY: [0, 10, 0, -10, 0]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            whileHover={{ scale: 1.08, rotateY: 15 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
            <Sparkles className="w-10 h-10 relative z-10" />
          </motion.div>
          <motion.h1 
            className="font-bold text-3xl text-slate-900 mb-3 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Welcome to PRD Intelligence
          </motion.h1>
          <motion.p 
            className="text-slate-500 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Sign in to start building stakeholder-proof PRDs
          </motion.p>
        </motion.div>

        {/* Card */}
        <motion.div
          className="glass rounded-2xl p-8 border border-white/60 shadow-2xl shadow-slate-300/30 relative overflow-hidden"
          variants={cardVariants}
          style={{
            transformStyle: 'preserve-3d',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 50%, rgba(248,250,252,0.9) 100%)'
          }}
          whileHover={{ rotateX: 3, rotateY: -3, translateZ: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
            animate={{ x: ['-200%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          />

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50/80 border border-red-200/60 text-red-700 backdrop-blur-sm"
                initial={{ opacity: 0, height: 0, scale: 0.9 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.9 }}
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 animate-pulse" />
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google Sign In */}
          <motion.button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-white border-2 border-slate-200 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-100/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed font-semibold text-slate-700 text-base relative overflow-hidden group"
            whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/0 via-indigo-50/50 to-indigo-50/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            ) : (
              <GoogleIcon className="w-5 h-5" />
            )}
            <span className="relative z-10">{loading ? 'Redirecting to Google...' : 'Continue with Google'}</span>
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
            <span className="text-slate-400 text-xs uppercase tracking-widest font-semibold">What you get</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
          </div>

          {/* Features preview */}
          <div className="space-y-3">
            {features.map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-4 text-slate-600 text-sm p-3 rounded-xl hover:bg-slate-50/50 transition-colors cursor-default"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                whileHover={{ x: 4, scale: 1.02 }}
              >
                <motion.div 
                  className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}
                  whileHover={{ rotate: 10, scale: 1.1 }}
                >
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </motion.div>
                <span className="font-medium">{item.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Privacy note */}
          <motion.p 
            className="text-center text-slate-400 text-xs mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            By signing in you agree to our{' '}
            <span className="text-indigo-500 cursor-pointer hover:underline font-medium">Terms</span>
            {' & '}
            <span className="text-indigo-500 cursor-pointer hover:underline font-medium">Privacy Policy</span>
          </motion.p>
        </motion.div>

      </motion.div>
    </div>
  );
}