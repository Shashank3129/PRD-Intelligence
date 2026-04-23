import type { Persona } from '@/types';

export const PERSONAS: Persona[] = [
  {
    id: 'eng',
    name: 'Arun Kapoor',
    role: 'Engineering Lead',
    icon: '⚙',
    color: '#60a5fa',
    bgColor: 'rgba(96,165,250,.12)',
    borderColor: 'rgba(96,165,250,.3)',
    order: 1,
    focus: 'Technical feasibility, edge cases, performance targets, rollback strategy, dependency confirmation',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face'
  },
  {
    id: 'design',
    name: 'Priya Sharma',
    role: 'Head of Design',
    icon: '◈',
    color: '#f472b6',
    bgColor: 'rgba(244,114,182,.12)',
    borderColor: 'rgba(244,114,182,.3)',
    order: 2,
    focus: 'UX completeness — empty states, error states, loading states, mobile experience, accessibility, design system consistency',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face'
  },
  {
    id: 'data',
    name: 'Sam Torres',
    role: 'Analytics Lead',
    icon: '◉',
    color: '#a78bfa',
    bgColor: 'rgba(167,139,250,.12)',
    borderColor: 'rgba(167,139,250,.3)',
    order: 3,
    focus: 'Instrumentation requirements, metric measurement methods, A/B test design, data quality, baseline availability',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face'
  },
  {
    id: 'legal',
    name: 'Dana Okonkwo',
    role: 'Legal Counsel',
    icon: '⚖',
    color: '#fbbf24',
    bgColor: 'rgba(251,191,36,.12)',
    borderColor: 'rgba(251,191,36,.3)',
    order: 4,
    focus: 'Data collection and handling, GDPR and CCPA compliance, user consent flows, third-party DPAs, privacy policy updates',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face'
  },
  {
    id: 'cs',
    name: 'Mei Zhang',
    role: 'Head of Customer Success',
    icon: '◎',
    color: '#34d399',
    bgColor: 'rgba(52,211,153,.12)',
    borderColor: 'rgba(52,211,153,.3)',
    order: 5,
    focus: 'Onboarding experience, support burden estimation, existing user migration plan, customer communication, churn risk',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face'
  },
  {
    id: 'sales',
    name: 'Marcus Bell',
    role: 'Head of Sales',
    icon: '◆',
    color: '#fb923c',
    bgColor: 'rgba(251,146,60,.12)',
    borderColor: 'rgba(251,146,60,.3)',
    order: 6,
    focus: 'Deal impact, pricing and packaging decisions, enterprise customer requirements, customer roadmap commitments',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'
  },
  {
    id: 'mkt',
    name: 'Jordan Lee',
    role: 'VP Marketing',
    icon: '▲',
    color: '#4ade80',
    bgColor: 'rgba(74,222,128,.12)',
    borderColor: 'rgba(74,222,128,.3)',
    order: 7,
    focus: 'Market positioning, competitive differentiation, launch plan, messaging clarity, ICP alignment',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop&crop=face'
  },
  {
    id: 'cpo',
    name: 'Alex Morgan',
    role: 'Chief Product Officer',
    icon: '◐',
    color: '#c084fc',
    bgColor: 'rgba(192,132,252,.12)',
    borderColor: 'rgba(192,132,252,.3)',
    order: 8,
    focus: 'Product strategy, roadmap trade-offs, user impact sizing, MVP scope definition, north star metric connection',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face'
  },
  {
    id: 'ceo',
    name: 'The CEO',
    role: 'Chief Executive Officer',
    icon: '★',
    color: '#fde047',
    bgColor: 'rgba(253,224,71,.12)',
    borderColor: 'rgba(253,224,71,.3)',
    order: 9,
    focus: 'Strategic alignment, opportunity cost, market timing, competitive moat, reversibility of investment',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face'
  }
];

export const GENERATION_STEPS = [
  'Analyzing product context...',
  'Crafting problem statement...',
  'Building user stories...',
  'Writing functional requirements...',
  'Generating risk analysis...',
  'Assembling launch plan...'
];

export const FEATURES = [
  {
    icon: '⚡',
    title: 'Instant generation',
    description: 'From rough idea to structured PRD in minutes, not hours'
  },
  {
    icon: '◈',
    title: 'Chat to refine',
    description: 'Iterate with AI until every section is perfect'
  },
  {
    icon: '◉',
    title: 'Completeness gate',
    description: 'Quality audit before stakeholder review'
  },
  {
    icon: '★',
    title: '9 expert personas',
    description: 'Engineering, Design, Legal, Sales, and more'
  },
  {
    icon: '▲',
    title: 'Live PRD updates',
    description: 'Changes from discussion auto-update the doc'
  },
  {
    icon: '◆',
    title: 'Export anywhere',
    description: 'Download, copy, or share your approved PRD'
  }
];

export const HOW_IT_WORKS = [
  {
    number: '01',
    title: 'Set context',
    description: 'Tell us about your product and feature idea'
  },
  {
    number: '02',
    title: 'Generate & refine',
    description: 'AI creates your PRD, you chat to perfect it'
  },
  {
    number: '03',
    title: 'Expert discussion',
    description: '9 stakeholders review and approve'
  },
  {
    number: '04',
    title: 'Export',
    description: 'Download your stakeholder-approved PRD'
  }
];

export const DEFAULT_COMPLETENESS_RESULT = {
  score: 72,
  verdict: 'READY' as const,
  summary: 'Analysis complete. The PRD appears to be in good shape for discussion.',
  sections: [
    { name: 'Executive Summary', score: 85, status: 'strong' as const, issue: '' },
    { name: 'Problem Statement', score: 80, status: 'strong' as const, issue: '' },
    { name: 'Goals & Metrics', score: 75, status: 'strong' as const, issue: '' },
    { name: 'User Personas', score: 70, status: 'needs_work' as const, issue: 'Could be more detailed' },
    { name: 'User Stories', score: 78, status: 'strong' as const, issue: '' },
    { name: 'Functional Requirements', score: 65, status: 'needs_work' as const, issue: 'Some requirements need clarification' },
    { name: 'Non-Functional Requirements', score: 60, status: 'needs_work' as const, issue: 'Performance targets missing' },
    { name: 'Scope', score: 82, status: 'strong' as const, issue: '' },
    { name: 'Dependencies', score: 70, status: 'needs_work' as const, issue: 'Could identify more risks' },
    { name: 'Risks', score: 68, status: 'needs_work' as const, issue: 'Mitigation strategies needed' },
    { name: 'Open Questions', score: 75, status: 'strong' as const, issue: '' },
    { name: 'Launch Plan', score: 80, status: 'strong' as const, issue: '' }
  ],
  blockers: [],
  suggestions: ['Review each section before starting discussion', 'Consider adding more specific metrics']
};
