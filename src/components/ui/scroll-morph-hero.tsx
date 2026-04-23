"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import TeamShowcase, { type TeamMember } from "./team-showcase";

export interface ReviewerProfile {
  src: string;
  name: string;
  role: string;
  summary: string;
  specialties: string[];
  accent: string;
  accentSoft: string;
  border: string;
  textColor: string;
}

const REVIEWER_PROFILES: ReviewerProfile[] = [
  {
    src: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&q=80",
    name: "Alex Chen",
    role: "Engineering Lead",
    summary: "Flags edge cases, technical risk, and implementation complexity before the spec reaches the team.",
    specialties: ["Architecture", "Scalability", "Delivery"],
    accent: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    accentSoft: "rgba(79, 70, 229, 0.12)",
    border: "rgba(99, 102, 241, 0.28)",
    textColor: "#4f46e5",
  },
  {
    src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80",
    name: "Sarah Kim",
    role: "Product Designer",
    summary: "Pushes on UX clarity, interaction friction, and the quality of the end-to-end user journey.",
    specialties: ["UX flows", "Accessibility", "Design systems"],
    accent: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
    accentSoft: "rgba(14, 165, 233, 0.12)",
    border: "rgba(59, 130, 246, 0.24)",
    textColor: "#2563eb",
  },
  {
    src: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&q=80",
    name: "Marcus Lee",
    role: "Data Analyst",
    summary: "Turns vague goals into metrics, decision signals, and measurable launch success criteria.",
    specialties: ["Instrumentation", "KPIs", "Experiments"],
    accent: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    accentSoft: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.24)",
    textColor: "#059669",
  },
  {
    src: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&q=80",
    name: "Priya Sharma",
    role: "Legal Counsel",
    summary: "Surfaces compliance issues, policy requirements, and approval checkpoints early in planning.",
    specialties: ["Privacy", "Compliance", "Contracts"],
    accent: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
    accentSoft: "rgba(249, 115, 22, 0.12)",
    border: "rgba(249, 115, 22, 0.24)",
    textColor: "#ea580c",
  },
  {
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
    name: "James Wu",
    role: "CEO",
    summary: "Checks strategic fit, business upside, and whether the roadmap earns executive attention.",
    specialties: ["Strategy", "Positioning", "Growth"],
    accent: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
    accentSoft: "rgba(168, 85, 247, 0.12)",
    border: "rgba(168, 85, 247, 0.24)",
    textColor: "#7c3aed",
  },
  {
    src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80",
    name: "Ryan Park",
    role: "Sales Lead",
    summary: "Tests packaging, objections, and how clearly the value prop lands with real buyers.",
    specialties: ["Pricing", "Objections", "Go-to-market"],
    accent: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
    accentSoft: "rgba(236, 72, 153, 0.12)",
    border: "rgba(236, 72, 153, 0.24)",
    textColor: "#db2777",
  },
  {
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80",
    name: "Zoe Martinez",
    role: "Marketing Lead",
    summary: "Sharpens the narrative, launch story, and differentiation so the product feels ready for market.",
    specialties: ["Messaging", "Launch plans", "Storytelling"],
    accent: "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)",
    accentSoft: "rgba(20, 184, 166, 0.12)",
    border: "rgba(20, 184, 166, 0.24)",
    textColor: "#0f766e",
  },
  {
    src: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=300&q=80",
    name: "Nina Patel",
    role: "UX Researcher",
    summary: "Challenges assumptions with user evidence, pain-point framing, and insight-driven prioritization.",
    specialties: ["Interviews", "Insights", "Validation"],
    accent: "linear-gradient(135deg, #6366f1 0%, #0ea5e9 100%)",
    accentSoft: "rgba(99, 102, 241, 0.12)",
    border: "rgba(99, 102, 241, 0.24)",
    textColor: "#4f46e5",
  },
  {
    src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80",
    name: "Lisa Chen",
    role: "DevOps Lead",
    summary: "Reviews reliability, rollout safety, and operational readiness so launches stay smooth after approval.",
    specialties: ["Reliability", "Observability", "Release plans"],
    accent: "linear-gradient(135deg, #06b6d4 0%, #4f46e5 100%)",
    accentSoft: "rgba(6, 182, 212, 0.12)",
    border: "rgba(6, 182, 212, 0.24)",
    textColor: "#0891b2",
  },
];

const EXTRA_REVIEWERS: TeamMember[] = [
  { id: 'e0', name: 'Emma Davis',   role: 'CS Manager',     image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&q=80', textColor: '#0891b2', accentSoft: 'rgba(8,145,178,0.10)' },
  { id: 'e1', name: 'David Kim',    role: 'CPO',            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80', textColor: '#7c3aed', accentSoft: 'rgba(124,58,237,0.10)' },
  { id: 'e2', name: 'Tom Berg',     role: 'Security Arch.', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&q=80', textColor: '#dc2626', accentSoft: 'rgba(220,38,38,0.10)'  },
  { id: 'e3', name: 'Amy Lin',      role: 'QA Engineer',    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80', textColor: '#16a34a', accentSoft: 'rgba(22,163,74,0.10)'  },
  { id: 'e4', name: 'Chris Moore',  role: 'Architect',      image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=300&q=80', textColor: '#4f46e5', accentSoft: 'rgba(79,70,229,0.10)'  },
  { id: 'e5', name: 'Mia Taylor',   role: 'Scrum Master',   image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&q=80', textColor: '#d97706', accentSoft: 'rgba(217,119,6,0.10)'  },
  { id: 'e6', name: 'Sam Johnson',  role: 'BI Analyst',     image: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=300&q=80', textColor: '#059669', accentSoft: 'rgba(5,150,105,0.10)'  },
  { id: 'e7', name: 'Ella Brown',   role: 'Brand Lead',     image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80', textColor: '#db2777', accentSoft: 'rgba(219,39,119,0.10)' },
  { id: 'e8', name: 'Kevin White',  role: 'Growth PM',      image: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=300&q=80', textColor: '#0f766e', accentSoft: 'rgba(15,118,110,0.10)' },
  { id: 'e9', name: 'Rachel Green', role: 'Finance Lead',   image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80', textColor: '#9333ea', accentSoft: 'rgba(147,51,234,0.10)' },
  { id: 'e10', name: 'Dan Harris',  role: 'Infra Lead',     image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80', textColor: '#2563eb', accentSoft: 'rgba(37,99,235,0.10)'  },
];

const TEAM_MEMBERS: TeamMember[] = [
  ...REVIEWER_PROFILES.map((r, i) => ({
    id: String(i),
    name: r.name,
    role: r.role,
    image: r.src,
    specialties: r.specialties,
    textColor: r.textColor,
    accentSoft: r.accentSoft,
  })),
  ...EXTRA_REVIEWERS,
];

export default function ScrollMorphHero() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-14 md:gap-20">
      {/* Heading */}
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/85 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-indigo-600 shadow-sm">
          <Sparkles className="h-4 w-4" />
          Meet your AI review team
        </span>

        <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
          Expert feedback without the scheduling overhead.
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
          Every PRD gets challenged by the stakeholders who usually catch gaps late:
          engineering, design, legal, go-to-market, and leadership.
        </p>
      </div>

      {/* Team showcase: staggered photos (first 9 + +11 overflow) + names (only first 9) */}
      <TeamShowcase members={TEAM_MEMBERS} maxPhotos={9} />
    </div>
  );
}
