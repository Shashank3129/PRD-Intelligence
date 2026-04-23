import React, { useRef, useState, useEffect, useCallback, Suspense } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence, useMotionValue } from 'framer-motion';
import { useAppStore } from '@/hooks/useAppStore';
import { Navigation } from '@/components/Navigation';
import { Card3D } from '@/components/Card3D';
import ScrollMorphHero from '@/components/ui/scroll-morph-hero';
import { FEATURES, HOW_IT_WORKS, PERSONAS } from '@/constants';
import { 
  ArrowRight, Play, Zap, Hexagon, Circle, Triangle, Diamond, Star, Sparkles, 
  ChevronDown, Shield, Rocket, Users, FileText, BarChart3, Globe, Cpu,
  MousePointer2, Layers, ArrowUpRight, AlertCircle, MessageSquare, 
  Download, Lightbulb, PenTool, CheckCircle2, ArrowDown, BrainCircuit,
  Target, Workflow, Send, FileCheck, Code2, Palette, LineChart, Scale, 
  HeartHandshake, TrendingUp, Megaphone, Briefcase, Crown, Award, 
  Quote, BadgeCheck, Sparkle, GitBranch, Figma, Database, Gavel, 
  HeadphonesIcon, ShoppingCart, BarChart, Compass, ChevronRight,
  ZapIcon, Flame, Gem, RocketIcon, ArrowBigRight
} from 'lucide-react';

// ==========================================
// ERROR BOUNDARY
// ==========================================
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class LandingErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LandingPage Error Boundary caught:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(to bottom right, #f8fafc, #ffffff, #f1f5f9)',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <AlertCircle style={{ width: '32px', height: '32px', color: '#dc2626' }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>
              {this.state.error?.message || 'The landing page failed to load.'}
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 24px',
                background: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// STYLE CONSTANTS
// ==========================================
const S = {
  glass: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  } as React.CSSProperties,
  glassStrong: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255,255,255,0.1) inset',
  } as React.CSSProperties,
  gradientText: {
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #06b6d4 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  } as React.CSSProperties,
  gradientTextAnimated: {
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 25%, #06b6d4 50%, #a855f7 75%, #6366f1 100%)',
    backgroundSize: '400% 400%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    animation: 'gradient-shift 8s ease infinite',
  } as React.CSSProperties,
  pageBg: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%)',
    overflowX: 'hidden',
    position: 'relative',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  } as React.CSSProperties,
  section: {
    position: 'relative',
    zIndex: 10,
    padding: '80px 16px',
  } as React.CSSProperties,
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
    width: '100%',
  } as React.CSSProperties,
};

// ==========================================
// ANIMATION VARIANTS
// ==========================================
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.23, 1, 0.32, 1] as any }
  }
} as any;

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

// ==========================================
// CUSTOM HOOKS
// ==========================================
const useMousePosition = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isReady, setIsReady] = useState(false);
  const rafRef = useRef<number>();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setPosition({
          x: (e.clientX / window.innerWidth - 0.5) * 2,
          y: (e.clientY / window.innerHeight - 0.5) * 2
        });
      });
    };
    
    const hasPointer = window.matchMedia('(pointer: fine)').matches;
    if (hasPointer) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      setIsReady(true);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return { ...position, isReady };
};

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  
  return reduced;
};

// ==========================================
// ENHANCED STEP DATA
// ==========================================
interface StepData {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  secondaryColor: string;
  bgColor: string;
  glowColor: string;
  features: string[];
}

const STEPS_DATA: StepData[] = [
  {
    number: '01',
    title: 'Set Context',
    description: 'Tell us about your product, target users, and the feature idea you want to build.',
    icon: <Lightbulb size={32} />,
    color: '#6366f1',
    secondaryColor: '#818cf8',
    bgColor: '#eef2ff',
    glowColor: 'rgba(99,102,241,0.3)',
    features: ['Product Overview', 'User Personas', 'Feature Scope', 'Success Criteria']
  },
  {
    number: '02',
    title: 'Generate & Refine',
    description: 'AI creates your PRD draft. Chat with it to perfect every section in real-time.',
    icon: <PenTool size={32} />,
    color: '#06b6d4',
    secondaryColor: '#22d3ee',
    bgColor: '#ecfeff',
    glowColor: 'rgba(6,182,212,0.3)',
    features: ['AI Draft Generation', 'Interactive Chat', 'Section Refinement', 'Version History']
  },
  {
    number: '03',
    title: 'Expert Discussion',
    description: '9 AI stakeholders review your PRD, challenge assumptions, and approve.',
    icon: <MessageSquare size={32} />,
    color: '#ec4899',
    secondaryColor: '#f472b6',
    bgColor: '#fdf2f8',
    glowColor: 'rgba(236,72,153,0.3)',
    features: ['Multi-Agent Review', 'Challenge Mode', 'Consensus Building', 'Gap Analysis']
  },
  {
    number: '04',
    title: 'Export & Ship',
    description: 'Download your stakeholder-approved PRD in multiple formats and share.',
    icon: <FileCheck size={32} />,
    color: '#10b981',
    secondaryColor: '#34d399',
    bgColor: '#ecfdf5',
    glowColor: 'rgba(16,185,129,0.3)',
    features: ['PDF Export', 'Markdown', 'Notion Sync', 'Share Link']
  }
];

// ==========================================
// ENHANCED PERSONA DATA WITH IMAGES & EXPERTISE
// ==========================================
interface PersonaData {
  id: string;
  name: string;
  role: string;
  icon: string;
  color: string;
  borderColor: string;
  image: string;
  expertise: string[];
  quote: string;
  iconComponent: React.ReactNode;
}

const PERSONAS_DATA: PersonaData[] = [
  {
    id: 'arun',
    name: 'Arun Kapoor',
    role: 'Engineering Lead',
    icon: '⚙',
    color: '#6366f1',
    borderColor: 'rgba(99,102,241,0.3)',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    expertise: ['System Architecture', 'Scalability', 'Tech Stack', 'API Design', 'Performance'],
    quote: 'Can this scale to 10M users?',
    iconComponent: <Code2 size={20} />
  },
  {
    id: 'priya',
    name: 'Priya Sharma',
    role: 'Head of Design',
    icon: '◈',
    color: '#ec4899',
    borderColor: 'rgba(236,72,153,0.3)',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
    expertise: ['UX Research', 'Design Systems', 'Accessibility', 'Prototyping', 'Visual Design'],
    quote: 'The user journey needs more empathy here.',
    iconComponent: <Palette size={20} />
  },
  {
    id: 'sam',
    name: 'Sam Torres',
    role: 'Analytics Lead',
    icon: '◉',
    color: '#06b6d4',
    borderColor: 'rgba(6,182,212,0.3)',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
    expertise: ['Data Modeling', 'KPI Framework', 'A/B Testing', 'Metrics', 'Attribution'],
    quote: 'What metrics prove this hypothesis?',
    iconComponent: <LineChart size={20} />
  },
  {
    id: 'dana',
    name: 'Dana Okonkwo',
    role: 'Legal Counsel',
    icon: '⚖',
    color: '#f59e0b',
    borderColor: 'rgba(245,158,11,0.3)',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face',
    expertise: ['GDPR Compliance', 'IP Rights', 'Contracts', 'Privacy', 'Risk Assessment'],
    quote: 'Have we considered liability exposure?',
    iconComponent: <Scale size={20} />
  },
  {
    id: 'mei',
    name: 'Mei Zhang',
    role: 'Head of Customer Success',
    icon: '◎',
    color: '#10b981',
    borderColor: 'rgba(16,185,129,0.3)',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face',
    expertise: ['Onboarding', 'Retention', 'NPS', 'Support', 'Customer Journey'],
    quote: 'Will customers actually adopt this?',
    iconComponent: <HeartHandshake size={20} />
  },
  {
    id: 'marcus',
    name: 'Marcus Bell',
    role: 'Head of Sales',
    icon: '◆',
    color: '#8b5cf6',
    borderColor: 'rgba(139,92,246,0.3)',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    expertise: ['Deal Strategy', 'Pipeline', 'Objection Handling', 'Demo', 'Closing'],
    quote: 'Can I sell this to enterprise?',
    iconComponent: <TrendingUp size={20} />
  },
  {
    id: 'jordan',
    name: 'Jordan Lee',
    role: 'VP Marketing',
    icon: '▲',
    color: '#f97316',
    borderColor: 'rgba(249,115,22,0.3)',
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop&crop=face',
    expertise: ['GTM Strategy', 'Positioning', 'Content', 'Demand Gen', 'Brand'],
    quote: 'Whats the narrative for launch?',
    iconComponent: <Megaphone size={20} />
  },
  {
    id: 'alex',
    name: 'Alex Morgan',
    role: 'Chief Product Officer',
    icon: '◐',
    color: '#ef4444',
    borderColor: 'rgba(239,68,68,0.3)',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face',
    expertise: ['Roadmapping', 'Strategy', 'Prioritization', 'Vision', 'Metrics'],
    quote: 'Does this align with our Q3 OKRs?',
    iconComponent: <Compass size={20} />
  },
  {
    id: 'ceo',
    name: 'The CEO',
    role: 'Chief Executive Officer',
    icon: '★',
    color: '#eab308',
    borderColor: 'rgba(234,179,8,0.3)',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face',
    expertise: ['Board Relations', 'Fundraising', 'Culture', 'P&L', 'Vision'],
    quote: 'Why should the board care?',
    iconComponent: <Crown size={20} />
  }
];

// ==========================================
// 3D CARD COMPONENT
// ==========================================
const DemoCard3D = () => {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const smoothX = useSpring(rx, { stiffness: 150, damping: 20 });
  const smoothY = useSpring(ry, { stiffness: 150, damping: 20 });
  const [isHovered, setIsHovered] = useState(false);
  const reducedMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientY - rect.top - rect.height / 2) / 20;
    const y = (e.clientX - rect.left - rect.width / 2) / 20;
    rx.set(-x);
    ry.set(y);
  };

  const handleMouseLeave = () => {
    rx.set(0);
    ry.set(0);
    setIsHovered(false);
  };

  return (
    <div 
      style={{ perspective: '1000px', width: '100%', maxWidth: '500px', margin: '0 auto' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{
          width: '100%',
          aspectRatio: '4/3',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '24px',
          transformStyle: 'preserve-3d',
          rotateX: smoothX,
          rotateY: smoothY,
          transition: reducedMotion ? 'none' : 'transform 0.1s ease-out',
          boxShadow: isHovered 
            ? '0 25px 50px -12px rgba(102, 126, 234, 0.4), 0 0 0 1px rgba(255,255,255,0.1) inset'
            : '0 20px 40px -15px rgba(102, 126, 234, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 45%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.2) 55%, transparent 60%)',
          transform: `translateX(${isHovered ? '100%' : '-100%'})`,
          transition: 'transform 0.6s ease',
        }} />
        
        <div style={{ transform: 'translateZ(40px)', textAlign: 'center', padding: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '28px',
          }}>
            📋
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            PRD Intelligence
          </h3>
          <p style={{ opacity: 0.9, fontSize: '14px' }}>
            AI-powered PRD generation with multi-stakeholder review
          </p>
        </div>

        {!reducedMotion && (
          <>
            <motion.div
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.15)',
                transform: 'translateZ(60px)',
              }}
              animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
              style={{
                position: 'absolute',
                bottom: '30px',
                left: '30px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                transform: 'translateZ(30px)',
              }}
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            />
          </>
        )}
      </motion.div>
    </div>
  );
};

// ==========================================
// FEATURE CARD COMPONENT
// ==========================================
const FeatureCard = ({ feature, index }: { feature: typeof FEATURES[0]; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const reducedMotion = useReducedMotion();

  const colorSets = [
    { bg: '#eef2ff', border: '#c7d2fe', accent: '#6366f1', iconBg: '#e0e7ff' },
    { bg: '#fdf2f8', border: '#fbcfe8', accent: '#ec4899', iconBg: '#fce7f3' },
    { bg: '#ecfeff', border: '#a5f3fc', accent: '#06b6d4', iconBg: '#cffafe' },
    { bg: '#fefce8', border: '#fde047', accent: '#eab308', iconBg: '#fef9c3' },
    { bg: '#ecfdf5', border: '#6ee7b7', accent: '#10b981', iconBg: '#d1fae5' },
    { bg: '#f5f3ff', border: '#ddd6fe', accent: '#8b5cf6', iconBg: '#ede9fe' },
  ];
  const colors = colorSets[index % 6];

  const iconMap: Record<string, React.ReactNode> = {
    '⚡': <Zap size={24} color={colors.accent} />,
    '◈': <Hexagon size={24} color={colors.accent} />,
    '◉': <Circle size={24} color={colors.accent} />,
    '★': <Star size={24} color={colors.accent} />,
    '▲': <Triangle size={24} color={colors.accent} />,
    '◆': <Diamond size={24} color={colors.accent} />,
    '◎': <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${colors.accent}` }} />,
    '⚙': <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: `2px dashed ${colors.accent}` }} />,
    '🛡️': <Shield size={24} color={colors.accent} />,
    '🚀': <Rocket size={24} color={colors.accent} />,
    '👥': <Users size={24} color={colors.accent} />,
    '📄': <FileText size={24} color={colors.accent} />,
    '📊': <BarChart3 size={24} color={colors.accent} />,
    '🌍': <Globe size={24} color={colors.accent} />,
    '💻': <Cpu size={24} color={colors.accent} />,
  };

  return (
    <motion.div
      ref={ref}
      initial={reducedMotion ? {} : { opacity: 0, y: 50, rotateX: 10 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.23, 1, 0.32, 1] }}
      whileHover={reducedMotion ? {} : { 
        y: -8, 
        scale: 1.02,
        transition: { duration: 0.3 }
      }}
      style={{
        ...S.glass,
        borderRadius: '20px',
        padding: '32px',
        cursor: 'pointer',
        borderColor: colors.border,
        background: `linear-gradient(135deg, ${colors.bg} 0%, rgba(255,255,255,0.9) 100%)`,
        transformStyle: 'preserve-3d',
      }}
    >
      <motion.div 
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: colors.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          border: `1px solid ${colors.border}`,
        }}
        whileHover={reducedMotion ? {} : { rotate: 10, scale: 1.1 }}
      >
        {iconMap[feature.icon] || <span style={{ fontSize: '24px' }}>{feature.icon}</span>}
      </motion.div>
      
      <h3 style={{ 
        fontSize: '20px', 
        fontWeight: 'bold', 
        color: '#0f172a', 
        marginBottom: '12px',
        letterSpacing: '-0.01em'
      }}>
        {feature.title}
      </h3>
      <p style={{ color: '#475569', lineHeight: 1.7, fontSize: '15px' }}>
        {feature.description}
      </p>
    </motion.div>
  );
};

// ==========================================
// FLOW CONNECTOR COMPONENT
// ==========================================
const FlowConnector = ({ 
  isActive, 
  color, 
  nextColor, 
  delay = 0 
}: { 
  isActive: boolean; 
  color: string; 
  nextColor: string;
  delay?: number;
}) => {
  const reducedMotion = useReducedMotion();
  
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: 'calc(100% + 8px)',
      width: 'calc(100% - 16px)',
      height: '3px',
      transform: 'translateY(-50%)',
      zIndex: 0,
      display: 'none',
    }} className="flow-connector-desktop">
      {/* Background line */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: '#e2e8f0',
        borderRadius: '2px',
      }} />
      
      {/* Animated fill line */}
      <motion.div
        initial={reducedMotion ? {} : { scaleX: 0 }}
        animate={isActive ? { scaleX: 1 } : {}}
        transition={{ duration: 0.8, delay, ease: [0.23, 1, 0.32, 1] }}
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to right, ${color}, ${nextColor})`,
          borderRadius: '2px',
          transformOrigin: 'left',
        }}
      />
      
      {/* Flowing particles */}
      {!reducedMotion && isActive && (
        <motion.div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${color}, ${nextColor})`,
            boxShadow: `0 0 12px ${color}60`,
            marginTop: '-6px',
          }}
          animate={{ left: ['0%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      
      {/* Arrow head */}
      <motion.div
        initial={reducedMotion ? {} : { opacity: 0, scale: 0 }}
        animate={isActive ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: delay + 0.6 }}
        style={{
          position: 'absolute',
          right: '-8px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: nextColor,
        }}
      >
        <ChevronRight size={20} />
      </motion.div>
    </div>
  );
};

// ==========================================
// ENHANCED STEP CARD - FLOW STYLE
// ==========================================
const StepCardFlow = ({ 
  step, 
  index, 
  isLast,
  totalSteps 
}: { 
  step: StepData; 
  index: number; 
  isLast: boolean;
  totalSteps: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const reducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smoothX = useSpring(mx, { stiffness: 150, damping: 20 });
  const smoothY = useSpring(my, { stiffness: 150, damping: 20 });
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / 25;
    const y = (e.clientY - rect.top - rect.height / 2) / 25;
    mx.set(x);
    my.set(y);
  };

  return (
    <motion.div 
      ref={ref}
      initial={reducedMotion ? {} : { opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.15, ease: [0.23, 1, 0.32, 1] }}
      style={{ 
        position: 'relative',
        perspective: '1000px',
      }}
    >
      {/* Desktop Connector to next step */}
      {!isLast && (
        <FlowConnector 
          isActive={isInView} 
          color={step.color} 
          nextColor={STEPS_DATA[index + 1].color}
          delay={index * 0.15 + 0.5}
        />
      )}

      <motion.div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); mx.set(0); my.set(0); }}
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={reducedMotion ? {} : { scale: 1.02, y: -5 }}
        whileTap={{ scale: 0.98 }}
        style={{
          ...S.glassStrong,
          borderRadius: '24px',
          overflow: 'hidden',
          borderColor: step.color + '30',
          background: `linear-gradient(135deg, ${step.bgColor}60 0%, rgba(255,255,255,0.95) 100%)`,
          rotateX: useTransform(smoothX, v => -v),
          rotateY: smoothY,
          transition: reducedMotion ? 'none' : 'transform 0.15s ease-out',
          transformStyle: 'preserve-3d',
          cursor: 'pointer',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Top gradient bar */}
        <motion.div
          style={{
            height: '4px',
            background: `linear-gradient(to right, ${step.color}, ${step.secondaryColor})`,
            width: '100%',
          }}
          animate={isHovered ? { scaleX: [1, 1.02, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        />

        {/* Glow effect */}
        <motion.div
          style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: `radial-gradient(circle at 50% 0%, ${step.glowColor} 0%, transparent 50%)`,
            opacity: isHovered ? 0.6 : 0,
            transition: 'opacity 0.3s',
            pointerEvents: 'none',
          }}
        />

        <div style={{ padding: '32px', position: 'relative', zIndex: 1 }}>
          {/* Header: Number + Icon */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            marginBottom: '20px' 
          }}>
            {/* Step Number */}
            <motion.div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: `linear-gradient(135deg, ${step.color} 0%, ${step.secondaryColor} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 10px 30px -5px ${step.glowColor}`,
                flexShrink: 0,
              }}
              whileHover={reducedMotion ? {} : { 
                rotateY: 180,
                scale: 1.1,
              }}
              transition={{ duration: 0.5 }}
            >
              <span style={{ 
                fontSize: '22px', 
                fontWeight: 'bold',
                color: 'white',
              }}>
                {step.number}
              </span>
            </motion.div>

            {/* Icon */}
            <motion.div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: step.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: step.color,
              }}
              animate={isHovered ? { rotate: [0, -10, 10, 0], scale: 1.1 } : {}}
              transition={{ duration: 0.5 }}
            >
              {step.icon}
            </motion.div>

            {/* Progress indicator */}
            <div style={{ 
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{ 
                fontSize: '12px', 
                color: '#94a3b8',
                fontWeight: 600,
              }}>
                Step {index + 1} of {totalSteps}
              </span>
              <div style={{
                width: '40px',
                height: '4px',
                background: '#e2e8f0',
                borderRadius: '2px',
                overflow: 'hidden',
              }}>
                <motion.div
                  initial={reducedMotion ? {} : { width: 0 }}
                  animate={isInView ? { width: '100%' } : {}}
                  transition={{ duration: 0.8, delay: index * 0.15 + 0.3 }}
                  style={{
                    height: '100%',
                    background: `linear-gradient(to right, ${step.color}, ${step.secondaryColor})`,
                    borderRadius: '2px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <h3 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#0f172a', 
            marginBottom: '10px',
            letterSpacing: '-0.01em',
          }}>
            {step.title}
          </h3>

          {/* Description */}
          <p style={{ 
            color: '#475569', 
            fontSize: '16px', 
            lineHeight: 1.7,
            marginBottom: '20px',
          }}>
            {step.description}
          </p>

          {/* Expandable Features */}
          <AnimatePresence>
            {(isExpanded || isHovered) && (
              <motion.div
                initial={reducedMotion ? {} : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={reducedMotion ? {} : { opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  padding: '16px',
                  background: `${step.bgColor}40`,
                  borderRadius: '16px',
                  border: `1px solid ${step.color}20`,
                }}>
                  <p style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: step.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '12px',
                  }}>
                    Key Features
                  </p>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}>
                    {step.features.map((feature, i) => (
                      <motion.span
                        key={i}
                        initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                          padding: '6px 12px',
                          background: 'white',
                          color: step.color,
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          border: `1px solid ${step.color}20`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <CheckCircle2 size={14} />
                        {feature}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom action hint */}
          <motion.div
            style={{
              marginTop: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: step.color,
              fontSize: '13px',
              fontWeight: 600,
            }}
            animate={isHovered ? { x: 5 } : {}}
          >
            <span>Click to explore</span>
            <ChevronRight size={16} />
          </motion.div>
        </div>

        {/* Floating particles on hover */}
        {!reducedMotion && isHovered && (
          <>
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: step.color,
                  top: '20%',
                  left: `${20 + i * 20}%`,
                }}
                initial={{ opacity: 0, y: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  y: [0, -40 - i * 10],
                  x: [(i - 2) * 10, (i - 2) * 20],
                }}
                transition={{ duration: 1.2, delay: i * 0.1 }}
              />
            ))}
          </>
        )}
      </motion.div>

      {/* Mobile connector (vertical) */}
      {!isLast && (
        <motion.div
          initial={reducedMotion ? {} : { scaleY: 0 }}
          animate={isInView ? { scaleY: 1 } : {}}
          transition={{ duration: 0.5, delay: index * 0.15 + 0.4 }}
          style={{
            display: 'none',
            height: '40px',
            width: '3px',
            background: `linear-gradient(to bottom, ${step.color}, ${STEPS_DATA[index + 1].color})`,
            margin: '0 auto',
            transformOrigin: 'top',
            borderRadius: '2px',
          }}
          className="flow-connector-mobile"
        >
          <motion.div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: step.color,
              marginLeft: '-3.5px',
              marginTop: '-5px',
            }}
            animate={{ y: [0, 40, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

// ==========================================
// ENHANCED PERSONA CARD WITH PROFILE IMAGE
// ==========================================
const PersonaCardEnhanced = ({ persona, index }: { persona: PersonaData; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });
  const reducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const smoothX = useSpring(rx, { stiffness: 150, damping: 20 });
  const smoothY = useSpring(ry, { stiffness: 150, damping: 20 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientY - rect.top - rect.height / 2) / 30;
    const y = (e.clientX - rect.left - rect.width / 30);
    rx.set(-x);
    ry.set(y);
  };

  const initials = persona.name.split(' ').map(n => n[0]).join('').substring(0, 2);

  return (
    <motion.div
      ref={ref}
      initial={reducedMotion ? {} : { opacity: 0, y: 50, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.23, 1, 0.32, 1] }}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); rx.set(0); ry.set(0); }}
        style={{
          ...S.glassStrong,
          borderRadius: '24px',
          overflow: 'hidden',
          borderColor: persona.borderColor,
          background: `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, ${persona.borderColor.replace('0.3', '0.05')} 100%)`,
          rotateX: smoothX,
          rotateY: smoothY,
          transition: reducedMotion ? 'none' : 'transform 0.15s ease-out',
          transformStyle: 'preserve-3d',
          cursor: 'pointer',
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <motion.div
          style={{
            position: 'absolute',
            inset: '-2px',
            borderRadius: '26px',
            background: `radial-gradient(circle at 50% 0%, ${persona.borderColor.replace('0.3', '0.2')} 0%, transparent 70%)`,
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.3s',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div style={{
          height: '4px',
          background: `linear-gradient(to right, ${persona.color}, ${persona.color}80)`,
          width: '100%',
        }} />

        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
            <motion.div
              style={{
                position: 'relative',
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                overflow: 'hidden',
                flexShrink: 0,
                border: `3px solid ${persona.color}30`,
                boxShadow: `0 4px 12px ${persona.color}20`,
              }}
              whileHover={reducedMotion ? {} : { scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.3 }}
            >
              {!imageError ? (
                <img
                  src={persona.image}
                  alt={persona.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: imageLoaded ? 1 : 0,
                    transition: 'opacity 0.3s',
                  }}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              ) : null}
              
              <div style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(135deg, ${persona.color}20 0%, ${persona.color}40 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: imageLoaded && !imageError ? 0 : 1,
                transition: 'opacity 0.3s',
              }}>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: persona.color }}>
                  {initials}
                </span>
              </div>

              <div style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#10b981',
                border: '2px solid white',
              }} />
            </motion.div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <h4 style={{ 
                  fontWeight: 700, 
                  color: '#0f172a', 
                  fontSize: '16px',
                  margin: 0,
                }}>
                  {persona.name}
                </h4>
                <BadgeCheck size={16} color={persona.color} style={{ flexShrink: 0 }} />
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                background: `${persona.color}15`,
                borderRadius: '6px',
                color: persona.color,
                fontSize: '12px',
                fontWeight: 600,
              }}>
                {persona.iconComponent}
                {persona.role}
              </div>
            </div>
          </div>

          <motion.div
            style={{
              background: `${persona.color}08`,
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '16px',
              borderLeft: `3px solid ${persona.color}40`,
            }}
            animate={isHovered ? { scale: 1.02 } : {}}
            transition={{ duration: 0.2 }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <Quote size={14} color={persona.color} style={{ marginTop: '2px', flexShrink: 0 }} />
              <p style={{
                fontSize: '13px',
                color: '#475569',
                fontStyle: 'italic',
                lineHeight: 1.5,
                margin: 0,
              }}>
                "{persona.quote}"
              </p>
            </div>
          </motion.div>

          <div style={{ marginTop: 'auto' }}>
            <p style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
            }}>
              Expertise
            </p>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
            }}>
              {persona.expertise.map((skill, i) => (
                <motion.span
                  key={i}
                  initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: index * 0.08 + i * 0.05 }}
                  style={{
                    padding: '4px 10px',
                    background: `${persona.color}12`,
                    color: persona.color,
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: `1px solid ${persona.color}20`,
                  }}
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid rgba(226, 232, 240, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.5)',
          }}
          animate={isHovered ? { background: `${persona.color}08` } : {}}
          transition={{ duration: 0.2 }}
        >
          <span style={{
            fontSize: '12px',
            color: '#64748b',
            fontWeight: 500,
          }}>
            AI Persona
          </span>
          <motion.div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: persona.color,
              fontSize: '12px',
              fontWeight: 600,
            }}
            animate={isHovered ? { x: 3 } : {}}
          >
            Review
            <ChevronRight size={14} />
          </motion.div>
        </motion.div>

        {!reducedMotion && isHovered && (
          <>
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  color: persona.color,
                }}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: (i - 1.5) * 40,
                  y: -20 - Math.random() * 20,
                }}
                transition={{ duration: 1.5, delay: i * 0.1 }}
              >
                <Sparkle size={12 + i * 2} />
              </motion.div>
            ))}
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

// ==========================================
// STAT COUNTER COMPONENT
// ==========================================
const StatCounter = ({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isInView) return;
    if (reducedMotion) {
      setCount(value);
      return;
    }
    let current = 0;
    const increment = value / 30;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 50);
    return () => clearInterval(timer);
  }, [isInView, value, reducedMotion]);

  return (
    <motion.div 
      ref={ref}
      whileHover={{ scale: 1.05 }}
      style={{ textAlign: 'center' }}
    >
      <div style={{ 
        fontSize: '32px', 
        fontWeight: 'bold',
        ...S.gradientText,
        lineHeight: 1.2
      }}>
        {count}{suffix}
      </div>
      <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>
        {label}
      </div>
    </motion.div>
  );
};

// ==========================================
// FLOATING PARTICLE COMPONENT
// ==========================================
const FloatingParticle = ({ index, mouseX, mouseY }: { index: number; mouseX: number; mouseY: number }) => {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return null;

  return (
    <motion.div
      style={{
        position: 'absolute',
        width: `${6 + index * 2}px`,
        height: `${6 + index * 2}px`,
        borderRadius: '50%',
        background: `rgba(99, 102, 241, ${0.15 + index * 0.05})`,
        left: `${10 + index * 12}%`,
        top: `${15 + (index % 4) * 20}%`,
        filter: 'blur(1px)',
      }}
      animate={{
        y: [0, -30 - index * 10, 0],
        x: [0, mouseX * (10 + index * 5), 0],
        opacity: [0.2, 0.6, 0.2],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 4 + index * 0.8,
        repeat: Infinity,
        delay: index * 0.4,
        ease: "easeInOut"
      }}
    />
  );
};

// ==========================================
// MAIN LANDING PAGE COMPONENT
// ==========================================
export function LandingPage() {
  const { setScreen, user } = useAppStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  const mousePosition = useMousePosition();
  const reducedMotion = useReducedMotion();
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });
  
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const backgroundY = useTransform(smoothProgress, [0, 1], ['0%', '20%']);
  const heroOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(smoothProgress, [0, 0.15], [1, 0.98]);

  useEffect(() => {
    try {
      const timer = setTimeout(() => setIsLoaded(true), 200);
      return () => clearTimeout(timer);
    } catch (err) {
      console.error('LandingPage initialization error:', err);
      setInitError(err instanceof Error ? err.message : 'Unknown initialization error');
    }
  }, []);

  const handleStartBuilding = useCallback(() => {
    try {
      if (typeof setScreen === 'function') {
        setScreen(user ? 'setup' : 'auth');
      } else {
        throw new Error('Navigation function not available');
      }
    } catch (err) {
      console.error('Navigation error:', err);
      window.location.href = user ? '/setup' : '/auth';
    }
  }, [setScreen, user]);

  const handleScrollToDemo = useCallback(() => {
    try {
      const element = document.getElementById('how-it-works');
      if (element) {
        element.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
      }
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }, [reducedMotion]);

  if (initError) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h1 style={{ color: '#dc2626', marginBottom: '16px', fontSize: '24px' }}>Failed to load</h1>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>{initError}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: '#4f46e5',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <LandingErrorBoundary>
      <div ref={containerRef} style={S.pageBg}>
        {/* GLOBAL STYLES */}
        <style>{`
          html {
            scroll-padding-top: 104px;
          }
          section[id] {
            scroll-margin-top: 104px;
          }
          @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes pulse-ring {
            0% { transform: scale(1); opacity: 0.5; }
            100% { transform: scale(1.3); opacity: 0; }
          }
          .gradient-animate {
            background-size: 400% 400%;
            animation: gradient-shift 8s ease infinite;
          }
          @media (min-width: 1024px) {
            .hero-grid { grid-template-columns: 1fr 1fr !important; }
            .step-grid { grid-template-columns: repeat(4, 1fr) !important; }
            .feature-grid { grid-template-columns: repeat(3, 1fr) !important; }
            .persona-grid { grid-template-columns: repeat(3, 1fr) !important; }
            .flow-connector-desktop { display: block !important; }
            .flow-connector-mobile { display: none !important; }
          }
          @media (min-width: 640px) and (max-width: 1023px) {
            .cta-row { flex-direction: row !important; }
            .step-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .feature-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .persona-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .flow-connector-desktop { display: none !important; }
            .flow-connector-mobile { display: block !important; }
          }
          @media (max-width: 639px) {
            .flow-connector-desktop { display: none !important; }
            .flow-connector-mobile { display: block !important; }
          }
        `}</style>

        <Navigation />
        
        {/* BACKGROUND LAYER */}
        <motion.div 
          style={{
            position: 'fixed',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 0,
            y: reducedMotion ? 0 : backgroundY,
          }}
        >
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
            filter: 'blur(80px)',
            transform: `translate(${mousePosition.x * 40}px, ${mousePosition.y * 40}px)`,
            transition: 'transform 0.3s ease-out',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '20%',
            right: '10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)',
            filter: 'blur(80px)',
            transform: `translate(${mousePosition.x * -30}px, ${mousePosition.y * -30}px)`,
            transition: 'transform 0.3s ease-out',
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            right: '30%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(244,114,182,0.1) 0%, transparent 70%)',
            filter: 'blur(80px)',
            transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * -20}px)`,
            transition: 'transform 0.3s ease-out',
          }} />

          <div style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.4,
            backgroundImage: `linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }} />

          {[...Array(6)].map((_, i) => (
            <FloatingParticle 
              key={i} 
              index={i} 
              mouseX={mousePosition.x} 
              mouseY={mousePosition.y} 
            />
          ))}
        </motion.div>

        {/* HERO SECTION */}
        <section style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          paddingTop: '104px',
          zIndex: 10,
          overflow: 'hidden',
        }}>
          <motion.div 
            style={{
              ...S.container,
              padding: '48px 16px',
              opacity: reducedMotion ? 1 : heroOpacity,
              scale: reducedMotion ? 1 : heroScale,
            }}
          >
            <div className="hero-grid" style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '48px',
              alignItems: 'center',
            }}>
              <motion.div 
                style={{ maxWidth: '600px' }}
                initial="hidden"
                animate={isLoaded ? "visible" : "hidden"}
                variants={staggerContainer}
              >
                <motion.div 
                  style={{
                    ...S.glass,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    marginBottom: '24px',
                  }}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05 }}
                >
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#22d3ee',
                    display: 'inline-block',
                    boxShadow: '0 0 10px #22d3ee',
                  }} />
                  <span style={{ fontSize: '14px', color: '#475569', fontWeight: 500 }}>
                    AI-powered PRD creation
                  </span>
                  <Sparkles size={16} color="#6366f1" />
                </motion.div>

                <motion.h1 
                  style={{
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                    fontWeight: 800,
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                    marginBottom: '24px',
                    color: '#0f172a',
                  }}
                  variants={fadeInUp}
                >
                  <span 
                    className="gradient-animate"
                    style={{
                      ...S.gradientText,
                      display: 'block',
                      marginBottom: '8px',
                    }}
                  >
                    PRDs that actually
                  </span>
                  <span style={{ position: 'relative', display: 'inline-block' }}>
                    hold up.
                    <motion.span
                      style={{
                        position: 'absolute',
                        bottom: '-4px',
                        left: 0,
                        height: '4px',
                        background: 'linear-gradient(to right, #6366f1, #06b6d4)',
                        borderRadius: '2px',
                      }}
                      initial={{ width: 0 }}
                      animate={isLoaded ? { width: '100%' } : {}}
                      transition={{ duration: 0.8, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
                    />
                  </span>
                </motion.h1>

                <motion.p 
                  style={{
                    fontSize: '18px',
                    color: '#475569',
                    lineHeight: 1.7,
                    marginBottom: '32px',
                    maxWidth: '500px',
                  }}
                  variants={fadeInUp}
                >
                  From rough idea to 9-stakeholder-approved PRD. Challenge mode. 
                  Live doc updates. CEO sign-off required.
                </motion.p>

                <motion.div 
                  className="cta-row"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginBottom: '40px',
                  }}
                  variants={fadeInUp}
                >
                  <motion.button
                    onClick={handleStartBuilding}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '16px 32px',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: 'white',
                      borderRadius: '14px',
                      fontWeight: 600,
                      fontSize: '16px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 10px 30px -5px rgba(99, 102, 241, 0.4)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <span style={{ position: 'relative', zIndex: 1 }}>Start building</span>
                    <ArrowRight size={20} style={{ position: 'relative', zIndex: 1 }} />
                    <motion.div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                      }}
                      initial={{ x: '100%' }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>

                  <motion.button
                    onClick={handleScrollToDemo}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '16px 24px',
                      background: 'white',
                      color: '#334155',
                      borderRadius: '14px',
                      fontWeight: 600,
                      fontSize: '16px',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#eef2ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Play size={14} color="#6366f1" fill="#6366f1" />
                    </div>
                    Watch demo
                  </motion.button>
                </motion.div>

                <motion.div 
                  style={{
                    display: 'flex',
                    gap: '40px',
                    flexWrap: 'wrap',
                  }}
                  variants={staggerContainer}
                >
                  <StatCounter value={10} label="Faster PRDs" suffix="x" />
                  <StatCounter value={9} label="Expert Reviewers" />
                  <StatCounter value={100} label="AI-hardened" suffix="%" />
                </motion.div>
              </motion.div>

              <motion.div 
                style={{ perspective: '1000px' }}
                initial={reducedMotion ? {} : { opacity: 0, x: 60, rotateY: -15 }}
                animate={isLoaded ? { opacity: 1, x: 0, rotateY: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
              >
                <Suspense fallback={
                  <div style={{
                    width: '100%',
                    aspectRatio: '4/3',
                    borderRadius: '24px',
                    background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                  }} />
                }>
                  {typeof Card3D !== 'undefined' ? <Card3D /> : <DemoCard3D />}
                </Suspense>

                {!reducedMotion && (
                  <>
                    <motion.div
                      style={{
                        position: 'absolute',
                        top: '-20px',
                        right: '-20px',
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
                        opacity: 0.2,
                        filter: 'blur(30px)',
                      }}
                      animate={{ 
                        y: [0, -15, 0], 
                        scale: [1, 1.1, 1],
                      }}
                      transition={{ duration: 5, repeat: Infinity }}
                    />
                    <motion.div
                      style={{
                        position: 'absolute',
                        bottom: '-30px',
                        left: '-30px',
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                        opacity: 0.15,
                        filter: 'blur(40px)',
                      }}
                      animate={{ 
                        y: [0, 15, 0], 
                        scale: [1, 1.2, 1],
                      }}
                      transition={{ duration: 7, repeat: Infinity }}
                    />
                  </>
                )}
              </motion.div>
            </div>

            {!reducedMotion && (
              <motion.div 
                style={{
                  position: 'absolute',
                  bottom: '40px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                  Scroll to explore
                </span>
                <ChevronDown size={20} color="#94a3b8" />
              </motion.div>
            )}
          </motion.div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" style={S.section}>
          <div style={S.container}>
            <motion.div 
              style={{ textAlign: 'center', marginBottom: '64px' }}
              initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
            >
              <motion.span 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: '#eef2ff',
                  color: '#4f46e5',
                  borderRadius: '9999px',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  border: '1px solid #e0e7ff',
                }}
                whileHover={{ scale: 1.05 }}
              >
                <Layers size={16} />
                Features
              </motion.span>
              <h2 style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '16px',
                letterSpacing: '-0.02em',
              }}>
                Everything you need
              </h2>
              <p style={{ color: '#475569', fontSize: '18px', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
                A complete toolkit for creating PRDs that get approved on the first review
              </p>
            </motion.div>

            <div className="feature-grid" style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '24px',
            }}>
              {FEATURES.map((feature, i) => (
                <FeatureCard key={i} feature={feature} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ==========================================
            HOW IT WORKS SECTION - FLOW STYLE
            ========================================== */}
        <section id="how-it-works" style={{
          position: 'relative',
          zIndex: 10,
          padding: '100px 16px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(238,242,255,0.4) 30%, rgba(236,254,255,0.3) 70%, rgba(255,255,255,0) 100%)',
          overflow: 'hidden',
        }}>
          {/* Background flow decorations */}
          <div style={{
            position: 'absolute',
            top: '15%',
            left: '5%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '20%',
            right: '10%',
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '200px',
            background: 'radial-gradient(ellipse, rgba(236,72,153,0.04) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }} />

          <div style={S.container}>
            <motion.div 
              style={{ textAlign: 'center', marginBottom: '80px' }}
              initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                }}
                initial={reducedMotion ? {} : { scale: 0.9 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
              >
                <motion.span 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
                    color: '#0891b2',
                    borderRadius: '9999px',
                    fontSize: '14px',
                    fontWeight: 600,
                    border: '1px solid #a5f3fc',
                    boxShadow: '0 4px 12px rgba(6, 182, 212, 0.15)',
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Workflow size={16} />
                  Process
                </motion.span>
                <motion.div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                  animate={!reducedMotion ? { rotate: 360 } : {}}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <ZapIcon size={16} />
                </motion.div>
              </motion.div>
              
              <h2 style={{
                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '16px',
                letterSpacing: '-0.02em',
              }}>
                How it works
              </h2>
              <p style={{ color: '#475569', fontSize: '18px', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
                From idea to approved PRD in four simple steps
              </p>
            </motion.div>

            {/* Flow Steps Grid */}
            <div style={{ position: 'relative' }}>
              <div className="step-grid" style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '24px',
                position: 'relative',
                zIndex: 2,
              }}>
                {STEPS_DATA.map((step, i) => (
                  <StepCardFlow 
                    key={i} 
                    step={step} 
                    index={i} 
                    isLast={i === STEPS_DATA.length - 1}
                    totalSteps={STEPS_DATA.length}
                  />
                ))}
              </div>
            </div>

            {/* Bottom Flow Summary */}
            <motion.div
              style={{
                marginTop: '64px',
                textAlign: 'center',
              }}
              initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '20px 32px',
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(6,182,212,0.1) 100%)',
                  borderRadius: '16px',
                  border: '1px solid rgba(99,102,241,0.2)',
                }}
                whileHover={{ scale: 1.02 }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}>
                  <RocketIcon size={24} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                    Ready to start?
                  </p>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                    Your first PRD is just 4 steps away
                  </p>
                </div>
                <motion.button
                  onClick={handleStartBuilding}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  Start Now
                  <ArrowRight size={16} />
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* AI REVIEWERS SECTION */}
        <section id="personas" style={{
          ...S.section,
          padding: '112px 16px 120px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(238,242,255,0.45) 22%, rgba(255,255,255,0.96) 100%)',
        }}>
          <ScrollMorphHero />
        </section>

        {/* CTA SECTION */}
        <section style={{
          ...S.section,
          padding: '120px 16px',
        }}>
          <div style={{ maxWidth: '768px', margin: '0 auto' }}>
            <motion.div 
              style={{
                ...S.glassStrong,
                borderRadius: '32px',
                padding: '64px 32px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(238,242,255,0.9) 100%)',
              }}
              initial={reducedMotion ? {} : { opacity: 0, scale: 0.9, rotateX: 10 }}
              whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
            >
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 50%)',
                pointerEvents: 'none',
              }} />

              <div style={{ position: 'relative', zIndex: 10 }}>
                <motion.h2 
                  style={{
                    fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                    fontWeight: 800,
                    color: '#0f172a',
                    marginBottom: '16px',
                    letterSpacing: '-0.02em',
                  }}
                  initial={reducedMotion ? {} : { y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  Build something worth shipping.
                </motion.h2>
                <motion.p 
                  style={{
                    color: '#475569',
                    fontSize: '18px',
                    maxWidth: '500px',
                    margin: '0 auto 32px',
                    lineHeight: 1.6,
                  }}
                  initial={reducedMotion ? {} : { y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  Join thousands of product managers who create better PRDs with PRD Intelligence.
                </motion.p>
                <motion.button
                  onClick={handleStartBuilding}
                  initial={reducedMotion ? {} : { y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '16px 32px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    borderRadius: '14px',
                    fontWeight: 600,
                    fontSize: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 10px 30px -5px rgba(99, 102, 241, 0.4)',
                  }}
                >
                  Start for free
                  <ArrowRight size={20} />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{
          position: 'relative',
          padding: '48px 16px',
          borderTop: '1px solid #e2e8f0',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.8)',
        }}>
          <div style={{
            ...S.container,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '18px',
                boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)',
              }}>
                P
              </div>
              <span style={{ fontWeight: 700, fontSize: '18px', color: '#0f172a' }}>
                PRD Intelligence
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#64748b' }}>
              <a href="#" style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }}>Privacy</a>
              <a href="#" style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }}>Terms</a>
              <a href="#" style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }}>Contact</a>
            </div>
            
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              © 2024 PRD Intelligence. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </LandingErrorBoundary>
  );
}
