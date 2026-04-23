import { useState } from 'react';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  specialties?: string[];
  textColor?: string;
  accentSoft?: string;
}

interface TeamShowcaseProps {
  members?: TeamMember[];
  /** Max photos to show in the staggered grid. Remaining appear as a "+N more" tile. */
  maxPhotos?: number;
}

export default function TeamShowcase({ members = [], maxPhotos }: TeamShowcaseProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const gridMembers = maxPhotos != null ? members.slice(0, maxPhotos) : members;
  const overflowMembers = maxPhotos != null ? members.slice(maxPhotos) : [];
  const showOverflow = overflowMembers.length > 0;

  // Build 3 columns from gridMembers (+ one overflow slot)
  const gridItems: Array<TeamMember | { overflow: true }> = showOverflow
    ? [...gridMembers, { overflow: true }]
    : gridMembers;

  const col1 = gridItems.filter((_, i) => i % 3 === 0);
  const col2 = gridItems.filter((_, i) => i % 3 === 1);
  const col3 = gridItems.filter((_, i) => i % 3 === 2);

  return (
    <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12 lg:gap-16 select-none w-full max-w-5xl mx-auto px-4 md:px-6">
      {/* ── Left: staggered photo grid ── */}
      <div className="flex gap-2 md:gap-3 flex-shrink-0 overflow-x-auto pb-1 md:pb-0">
        {/* Column 1 */}
        <div className="flex flex-col gap-2 md:gap-3">
          {col1.map((item, i) =>
            'overflow' in item ? (
              <OverflowTile
                key="overflow"
                previews={overflowMembers}
                className="w-[108px] h-[118px] sm:w-[128px] sm:h-[138px] md:w-[152px] md:h-[162px]"
                hoveredId={hoveredId}
                onHover={setHoveredId}
              />
            ) : (
              <PhotoCard
                key={item.id}
                member={item}
                className="w-[108px] h-[118px] sm:w-[128px] sm:h-[138px] md:w-[152px] md:h-[162px]"
                hoveredId={hoveredId}
                onHover={setHoveredId}
              />
            )
          )}
        </div>

        {/* Column 2 — offset downward */}
        <div className="flex flex-col gap-2 md:gap-3 mt-[46px] sm:mt-[54px] md:mt-[66px]">
          {col2.map((item) =>
            'overflow' in item ? (
              <OverflowTile
                key="overflow"
                previews={overflowMembers}
                className="w-[120px] h-[130px] sm:w-[142px] sm:h-[152px] md:w-[168px] md:h-[178px]"
                hoveredId={hoveredId}
                onHover={setHoveredId}
              />
            ) : (
              <PhotoCard
                key={item.id}
                member={item}
                className="w-[120px] h-[130px] sm:w-[142px] sm:h-[152px] md:w-[168px] md:h-[178px]"
                hoveredId={hoveredId}
                onHover={setHoveredId}
              />
            )
          )}
        </div>

        {/* Column 3 — offset half-way */}
        <div className="flex flex-col gap-2 md:gap-3 mt-[22px] sm:mt-[26px] md:mt-[32px]">
          {col3.map((item) =>
            'overflow' in item ? (
              <OverflowTile
                key="overflow"
                previews={overflowMembers}
                className="w-[112px] h-[122px] sm:w-[134px] sm:h-[142px] md:w-[158px] md:h-[168px]"
                hoveredId={hoveredId}
                onHover={setHoveredId}
              />
            ) : (
              <PhotoCard
                key={item.id}
                member={item}
                className="w-[112px] h-[122px] sm:w-[134px] sm:h-[142px] md:w-[158px] md:h-[168px]"
                hoveredId={hoveredId}
                onHover={setHoveredId}
              />
            )
          )}
        </div>
      </div>

      {/* ── Right: member names (excluding overflow) ── */}
      <div className="grid grid-cols-2 md:flex md:flex-col gap-3 md:gap-4 pt-0 md:pt-3 flex-1 w-full">
        {gridMembers.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            hoveredId={hoveredId}
            onHover={setHoveredId}
          />
        ))}
        {showOverflow && (
          <MemberRow
            key="overflow"
            member={{
              id: 'overflow',
              name: 'Others',
              role: 'TEAM EXTENSION',
              image: '',
              textColor: '#64748b',
              accentSoft: 'rgba(100, 116, 139, 0.1)',
            }}
            hoveredId={hoveredId}
            onHover={setHoveredId}
          />
        )}
      </div>
    </div>
  );
}

/* ── Overflow "+N more" tile ── */
function OverflowTile({
  previews,
  className,
  hoveredId,
  onHover,
}: {
  previews: TeamMember[];
  className: string;
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
}) {
  const isActive = hoveredId === 'overflow';
  const isDimmed = hoveredId !== null && !isActive;

  return (
    <div
      className={`rounded-2xl cursor-pointer flex-shrink-0 flex flex-col items-center justify-center gap-2.5 bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 transition-all duration-300 ${className} ${isDimmed ? 'opacity-50 scale-[0.98]' : 'opacity-100 scale-100'}`}
      style={{ boxShadow: isActive ? '0 12px 32px -8px rgba(15,23,42,0.22)' : '0 4px 12px -4px rgba(15,23,42,0.10)' }}
      onMouseEnter={() => onHover?.('overflow')}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Stacked avatars */}
      <div className="flex items-center justify-center">
        {previews.slice(0, 4).map((m, i) => (
          <div
            key={m.id}
            className="h-8 w-8 rounded-full border-2 border-white overflow-hidden bg-slate-200 shadow-sm transition-all duration-300"
            style={{ 
              marginLeft: i === 0 ? 0 : -10, 
              zIndex: 4 - i,
              transform: isActive ? 'scale(1.05)' : 'scale(1)'
            }}
          >
            <img src={m.image} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
      <span className="text-base font-bold transition-colors duration-300" style={{ color: isActive ? '#0f172a' : '#334155' }}>
        + others
      </span>
    </div>
  );
}

/* ── Photo card ── */
function PhotoCard({
  member,
  className,
  hoveredId,
  onHover,
}: {
  member: TeamMember;
  className: string;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}) {
  const isActive = hoveredId === member.id;
  const isDimmed = hoveredId !== null && !isActive;

  return (
    <div
      className={`overflow-hidden rounded-2xl cursor-pointer flex-shrink-0 transition-all duration-300 ${className} ${isDimmed ? 'opacity-50 scale-[0.98]' : 'opacity-100 scale-100'}`}
      style={{ boxShadow: isActive ? '0 12px 32px -8px rgba(15,23,42,0.22)' : '0 4px 12px -4px rgba(15,23,42,0.10)' }}
      onMouseEnter={() => onHover(member.id)}
      onMouseLeave={() => onHover(null)}
    >
      <img
        src={member.image}
        alt={member.name}
        className="w-full h-full object-cover transition-all duration-500"
        style={{
          filter: isActive ? 'grayscale(0) brightness(1.05)' : 'grayscale(0.8) brightness(0.82)',
          transform: isActive ? 'scale(1.06)' : 'scale(1)',
        }}
      />
    </div>
  );
}

/* ── Member name row ── */
function MemberRow({
  member,
  hoveredId,
  onHover,
}: {
  member: TeamMember;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}) {
  const isActive = hoveredId === member.id;
  const isDimmed = hoveredId !== null && !isActive;

  return (
    <div
      className={`cursor-pointer transition-all duration-300 ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
      onMouseEnter={() => onHover(member.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex items-center gap-2.5">
        {/* Active indicator bar */}
        <span
          className="h-3 rounded-full flex-shrink-0 transition-all duration-300"
          style={{
            width: isActive ? 20 : 14,
            background: isActive ? (member.textColor ?? '#6366f1') : 'rgba(148,163,184,0.4)',
          }}
        />
        <span
          className="text-base md:text-[18px] font-semibold leading-none tracking-tight transition-colors duration-300"
          style={{ color: isActive ? '#0f172a' : '#475569' }}
        >
          {member.name}
        </span>
      </div>

      {/* Role */}
      <p
        className="mt-1.5 pl-[27px] text-[9px] md:text-[10px] font-bold uppercase tracking-[0.22em] transition-colors duration-300"
        style={{ color: isActive ? (member.textColor ?? '#6366f1') : '#94a3b8' }}
      >
        {member.role}
      </p>

      {/* Specialty pills — show on hover */}
      {isActive && member.specialties && member.specialties.length > 0 && (
        <div className="mt-2 pl-[27px] flex flex-wrap gap-1.5">
          {member.specialties.map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide"
              style={{
                background: member.accentSoft ?? 'rgba(99,102,241,0.10)',
                color: member.textColor ?? '#4f46e5',
              }}
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
