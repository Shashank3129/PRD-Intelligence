import { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, LogOut, Sparkles, FileText, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { cn } from '@/lib/utils';
import { signOut } from '@/services/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserMenuProps {
  className?: string;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

function getInitials(name: string, email: string): string {
  const source = name.trim() || email.trim() || 'User';
  const parts = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts.map((part) => part[0]).join('').toUpperCase();
}

export function UserMenu({
  className,
  align = 'end',
  sideOffset = 12,
}: UserMenuProps) {
  const { user, clearSession, addToast, companies } = useAppStore();
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [prdCount, setPrdCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const storedPRDs = localStorage.getItem('prd_prds');
      const storedProducts = localStorage.getItem('prd_products');
      setPrdCount(storedPRDs ? (JSON.parse(storedPRDs) as unknown[]).length : 0);
      setProductCount(storedProducts ? (JSON.parse(storedProducts) as unknown[]).length : 0);
    } catch { /* non-fatal */ }
  }, [open]);

  const initials = useMemo(() => {
    if (!user) return 'U';
    return getInitials(user.name, user.email);
  }, [user]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [user?.avatarUrl]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!user) return null;

  const showAvatar = Boolean(user.avatarUrl && !avatarFailed);

  const handleLogout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setOpen(false);
    clearSession();

    try {
      await signOut();
      addToast({ type: 'success', message: 'Signed out successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to log out. Please try again.';
      addToast({ type: 'warning', message: `${message} You may need to refresh once.` });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* ── TRIGGER BUTTON ── */}
      <motion.button
        type="button"
        disabled={isSigningOut}
        aria-label="Open account menu"
        onClick={() => setOpen(!open)}
        className={cn(
          'group relative isolate flex items-center gap-3 overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-[0_8px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgba(99,102,241,0.18)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
          className || 'px-3 py-2.5'
        )}
        whileHover={{ rotateX: -4, rotateY: 4 }}
        style={{ transformStyle: 'preserve-3d', perspective: '600px' }}
      >
        {/* Animated background layers */}
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.25),transparent_50%),radial-gradient(circle_at_70%_0%,rgba(34,211,238,0.18),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.95),rgba(238,242,255,0.85))]" />
        <span className="absolute inset-x-3 top-1 h-2.5 rounded-full bg-white/50 blur-sm transition-opacity duration-300 group-hover:opacity-80" />
        
        {/* Floating glow orbs */}
        <motion.span 
          className="absolute -right-3 -top-3 h-10 w-10 rounded-full bg-cyan-300/25 blur-xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.span 
          className="absolute -bottom-3 -left-3 h-10 w-10 rounded-full bg-indigo-400/20 blur-xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        />

        {/* Avatar */}
        <div className="relative z-10">
          <Avatar className="h-9 w-9 rounded-xl border-2 border-white/80 shadow-[0_6px_16px_rgba(79,70,229,0.25)]">
            {showAvatar && (
              <AvatarImage
                src={user.avatarUrl ?? undefined}
                alt={user.name}
                className="rounded-xl object-cover"
                onError={() => setAvatarFailed(true)}
              />
            )}
            <AvatarFallback className="relative rounded-xl bg-gradient-to-br from-slate-900 via-indigo-700 to-cyan-500 text-[11px] font-black tracking-wider text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          {/* Online indicator */}
          <motion.span 
            className="absolute -bottom-0.5 -right-0.5 z-20 h-2.5 w-2.5 rounded-full border-[2px] border-white bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {/* Name + Chevron (hidden on very small screens) */}
        <div className="relative z-10 hidden sm:flex flex-col items-start leading-none">
          <span className="text-[13px] font-bold text-slate-800 truncate max-w-[100px]">{user.name}</span>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5">Account</span>
        </div>
        
        <motion.div 
          className="relative z-10 hidden sm:block text-slate-400"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronRight className="w-4 h-4 -rotate-90" />
        </motion.div>

        {/* Loading spinner overlay */}
        <AnimatePresence>
          {isSigningOut && (
            <motion.div 
              className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── DROPDOWN MENU ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.92, rotateX: -8 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: 8, scale: 0.95, rotateX: -4 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            style={{ 
              transformOrigin: 'top right',
              transformStyle: 'preserve-3d',
              perspective: '800px'
            }}
            className={cn(
              'absolute mt-3 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-[24px] border border-white/70 bg-white/85 shadow-[0_32px_80px_rgba(15,23,42,0.18)] backdrop-blur-2xl z-50',
              align === 'end' ? 'right-0' : align === 'start' ? 'left-0' : 'left-1/2 -translate-x-1/2'
            )}
          >
            {/* Background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_45%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_35%),linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.92))]" />
            <motion.div 
              className="absolute left-6 top-4 h-28 w-28 rounded-full bg-indigo-300/15 blur-3xl"
              animate={{ scale: [1, 1.3, 1], x: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
            <motion.div 
              className="absolute right-2 top-2 h-24 w-24 rounded-full bg-cyan-300/15 blur-3xl"
              animate={{ scale: [1, 1.2, 1], y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            />

            <div className="relative z-10 px-5 pb-5 pt-5">
              {/* User Header */}
              <div className="flex items-start gap-4 mb-5">
                <motion.div
                  className="relative h-[60px] w-[60px] shrink-0"
                  whileHover={{ rotate: -6, scale: 1.05, y: -2 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Avatar className="h-[60px] w-[60px] rounded-[20px] border-[3px] border-white shadow-[0_12px_32px_rgba(79,70,229,0.28)]">
                    {showAvatar && (
                      <AvatarImage
                        src={user.avatarUrl ?? undefined}
                        alt={user.name}
                        className="rounded-[20px] object-cover"
                        onError={() => setAvatarFailed(true)}
                      />
                    )}
                    <AvatarFallback className="relative rounded-[20px] bg-gradient-to-br from-slate-950 via-indigo-700 to-cyan-500 text-base font-black tracking-wider text-white">
                      <span className="absolute inset-x-3 top-2 h-2.5 rounded-full bg-white/30 blur-sm" />
                      <span className="relative z-10">{initials}</span>
                    </AvatarFallback>
                  </Avatar>
                  <motion.span 
                    className="absolute -bottom-1 -right-1 z-20 h-3 w-3 rounded-full border-[2px] border-white bg-emerald-400"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>

                <div className="min-w-0 flex-1 space-y-1 pt-1">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/70 bg-white/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600 shadow-sm">
                    <Sparkles className="h-3 w-3" />
                    Pro Member
                  </div>
                  <p className="truncate text-[15px] font-bold text-slate-900">{user.name}</p>
                  <p className="truncate text-[13px] text-slate-500">{user.email}</p>
                </div>
              </div>

              {/* Stats mini row */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: 'PRDs', value: String(prdCount), icon: Sparkles },
                  { label: 'Products', value: String(productCount || companies.length), icon: FileText },
                ].map((stat, i) => (
                  <motion.div 
                    key={stat.label}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/50 border border-white/60"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <span className="text-[15px] font-bold text-slate-900">{stat.value}</span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                  </motion.div>
                ))}
              </div>

              {/* Session Status */}
              <motion.div 
                className="mb-4 rounded-[18px] border border-white/70 bg-white/60 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_24px_rgba(15,23,42,0.04)]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                      <motion.div
                        className="w-2.5 h-2.5 rounded-full bg-emerald-500"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-900">Active Session</p>
                      <p className="text-[11px] text-slate-500">Secure access on this device</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600">
                    Live
                  </span>
                </div>
              </motion.div>

              {/* Logout Button */}
              <motion.button
                type="button"
                onClick={() => void handleLogout()}
                disabled={isSigningOut}
                className="group flex w-full items-center justify-center gap-2.5 rounded-[18px] border border-rose-200/70 bg-gradient-to-br from-white via-rose-50/50 to-white px-4 py-3.5 text-[13px] font-bold text-rose-600 shadow-[0_8px_24px_rgba(244,63,94,0.1)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(244,63,94,0.16)] disabled:cursor-not-allowed disabled:opacity-60 relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-rose-100/0 via-rose-100/40 to-rose-100/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                {isSigningOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                    Logout
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}