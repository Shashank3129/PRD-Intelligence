import { useEffect, useState, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/hooks/useAppStore';
import { supabase, upsertProfile, getUserCompanies } from '@/services/supabase';
import { LandingPage } from '@/screens/LandingPage';
import { AuthPage } from '@/screens/AuthPage';
import { CompanyOnboardingPage } from '@/screens/CompanyOnboardingPage';
import { DashboardPage } from '@/screens/DashboardPage';
import { SetupPage } from '@/screens/SetupPage';
import { GeneratingPage } from '@/screens/GeneratingPage';
import { RefinePage } from '@/screens/RefinePage';
import { CompletenessPage } from '@/screens/CompletenessPage';
import { DiscussionSetupPage } from '@/screens/DiscussionSetupPage';
import { DiscussionPage } from '@/screens/DiscussionPage';
import { ExportPage } from '@/screens/ExportPage';
import { ToastContainer } from '@/components/ToastContainer';
import { UserMenu } from '@/components/UserMenu';
import type { Screen } from '@/types';
import './App.css';

// ─── Global Error Boundary ────────────────────────────────────────────────────
interface EBState { hasError: boolean; error?: Error }
class AppErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-500 mb-6 break-words">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: undefined }); }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors mr-3"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }
  }
};

const PROTECTED_SCREENS: Screen[] = [
  'dashboard', 'setup', 'generating', 'refine', 'completeness', 'disc-setup', 'discussion', 'export', 'company-setup'
];

function getAuthAvatarUrl(metadata: Record<string, unknown> | undefined): string | null {
  const fromMetadata =
    typeof metadata?.avatar_url === 'string' ? metadata.avatar_url :
    typeof metadata?.picture === 'string' ? metadata.picture :
    null;

  if (!fromMetadata) return null;

  const cleaned = fromMetadata.trim();
  if (!cleaned) return null;

  if (cleaned.startsWith('//')) {
    return `https:${cleaned}`;
  }

  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return cleaned;
  }

  return null;
}

export default function App() {
  const { screen, setScreen, setUser, setCompanies, setSelectedCompany, clearSession, user, addToast } = useAppStore();
  // If we already have a persisted user show the app immediately; validate session in background
  const [authChecking, setAuthChecking] = useState(() => !useAppStore.getState().user);
  // Only screens that don't render their own UserMenu in a header
  const floatingMenuScreens: Screen[] = ['setup', 'generating', 'export'];

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;

      if (session?.user) {
        const u = session.user;
        const email = u.email || '';
        const name = (u.user_metadata?.full_name as string | undefined) || u.email || 'User';
        setUser({
          id: u.id,
          name,
          email,
          avatarUrl: getAuthAvatarUrl(u.user_metadata as Record<string, unknown> | undefined)
        });

        try {
          const userCompanies = await getUserCompanies(u.id);
          if (cancelled) return;
          setCompanies(userCompanies);

          const persistedScreen = useAppStore.getState().screen;
          const persistedCompany = useAppStore.getState().selectedCompany;

          if (userCompanies.length === 0) {
            setScreen('dashboard');
          } else {
            if (persistedCompany && userCompanies.find(c => c.id === persistedCompany.id)) {
              // keep as is
            } else {
              setSelectedCompany(userCompanies[0]);
            }
            if (!PROTECTED_SCREENS.includes(persistedScreen) || persistedScreen === 'company-setup') {
              setScreen('dashboard');
            }
          }
        } catch {
          setScreen('dashboard');
        }
      } else {
        const persistedScreen = useAppStore.getState().screen;
        if (PROTECTED_SCREENS.includes(persistedScreen)) {
          setScreen('landing');
        }
      }

      if (!cancelled) setAuthChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const u = session.user;
        const name = (u.user_metadata?.full_name as string | undefined) || u.email || 'User';
        const email = u.email || '';
        const avatarUrl = getAuthAvatarUrl(u.user_metadata as Record<string, unknown> | undefined);

        setUser({ id: u.id, name, email, avatarUrl });

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          try {
            const [, userCompanies] = await Promise.all([
              upsertProfile({
                id: u.id,
                email,
                full_name: name,
                avatar_url: (u.user_metadata?.avatar_url as string | undefined) ?? null
              }).catch(() => undefined),
              getUserCompanies(u.id)
            ]);

            setCompanies(userCompanies);

            if (userCompanies.length === 0) {
              setScreen('dashboard');
              if (event === 'SIGNED_IN') {
                addToast({ type: 'success', message: `Welcome, ${name.split(' ')[0]}!` });
              }
            } else {
              const persistedCompany = useAppStore.getState().selectedCompany;
              if (!persistedCompany || !userCompanies.find(c => c.id === persistedCompany.id)) {
                setSelectedCompany(userCompanies[0]);
              }
              if (event === 'SIGNED_IN') {
                setScreen('dashboard');
                addToast({ type: 'success', message: `Welcome back, ${name.split(' ')[0]}!` });
              }
            }
          } catch {
            setScreen('dashboard');
            if (event === 'SIGNED_IN') {
              addToast({ type: 'success', message: `Welcome, ${name.split(' ')[0]}!` });
            }
          }
        }
      } else if (event === 'SIGNED_OUT') {
        clearSession();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (authChecking) return;
    if (!user && PROTECTED_SCREENS.includes(screen)) {
      setScreen('landing');
    }
  }, [user, screen, setScreen, authChecking]);

  const renderScreen = () => {
    switch (screen) {
      case 'landing': return <LandingPage />;
      case 'auth': return <AuthPage />;
      case 'company-setup': return <CompanyOnboardingPage />;
      case 'dashboard': return <DashboardPage />;
      case 'setup': return <SetupPage />;
      case 'generating': return <GeneratingPage />;
      case 'refine': return <RefinePage />;
      case 'completeness': return <CompletenessPage />;
      case 'disc-setup': return <DiscussionSetupPage />;
      case 'discussion': return <DiscussionPage />;
      case 'export': return <ExportPage />;
      default: return <LandingPage />;
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-200/30 blur-3xl"
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-200/30 blur-3xl"
          animate={{ scale: [1, 1.3, 1], x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute top-1/2 right-1/3 w-[300px] h-[300px] rounded-full bg-pink-200/30 blur-3xl"
          animate={{ scale: [1, 1.1, 1], x: [0, 20, 0], y: [0, -10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />
      </div>

      <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none z-0" />

      {authChecking ? (
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/70 shadow-lg animate-pulse" />
            <div className="w-40 h-3 rounded-full bg-white/60 backdrop-blur-xl border border-white/70 animate-pulse" />
          </div>
        </div>
      ) : (
        <AppErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative z-10"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </AppErrorBoundary>
      )}

      {!authChecking && user && floatingMenuScreens.includes(screen) && (
        <div className="fixed top-4 right-4 z-40 md:top-6 md:right-6">
          <UserMenu className="h-11 w-11 rounded-2xl" />
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
