"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, useTransform, useSpring, useMotionValue } from "framer-motion";

export type AnimationPhase = "scatter" | "line" | "circle" | "bottom-strip";

interface FlipCardProps {
  src: string;
  name: string;
  role: string;
  index: number;
  total: number;
  phase: AnimationPhase;
  target: { x: number; y: number; rotation: number; scale: number; opacity: number };
}

const IMG_WIDTH = 60;
const IMG_HEIGHT = 85;

function FlipCard({ src, name, role, index, phase, target }: FlipCardProps) {
  return (
    <motion.div
      animate={{
        x: target.x,
        y: target.y,
        rotate: target.rotation,
        scale: target.scale,
        opacity: target.opacity,
      }}
      transition={{ type: "spring", stiffness: 40, damping: 15 }}
      style={{
        position: "absolute",
        width: IMG_WIDTH,
        height: IMG_HEIGHT,
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
      className="cursor-pointer group"
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ rotateY: 180 }}
      >
        {/* Front Face */}
        <div
          className="absolute inset-0 h-full w-full overflow-hidden rounded-xl shadow-lg bg-slate-200"
          style={{ backfaceVisibility: "hidden" }}
        >
          <img src={src} alt={name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-transparent" />
        </div>

        {/* Back Face */}
        <div
          className="absolute inset-0 h-full w-full overflow-hidden rounded-xl shadow-lg bg-gradient-to-br from-indigo-900 to-violet-900 flex flex-col items-center justify-center p-2 border border-indigo-700"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="text-[7px] font-black text-indigo-300 uppercase tracking-widest mb-0.5">Expert</p>
          <p className="text-[8px] font-bold text-white text-center leading-tight">{role}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

const TOTAL_IMAGES = 20;
const MAX_SCROLL = 3000;

// Professional reviewer images from Unsplash
const REVIEWER_IMAGES = [
  { src: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&q=80", name: "Alex Chen", role: "Engineering Lead" },
  { src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80", name: "Sarah Kim", role: "Product Designer" },
  { src: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&q=80", name: "Marcus Lee", role: "Data Analyst" },
  { src: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&q=80", name: "Priya Sharma", role: "Legal Counsel" },
  { src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80", name: "James Wu", role: "CEO" },
  { src: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&q=80", name: "Emma Davis", role: "CS Manager" },
  { src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80", name: "Ryan Park", role: "Sales Lead" },
  { src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80", name: "Zoe Martinez", role: "Marketing" },
  { src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80", name: "David Kim", role: "CPO" },
  { src: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=300&q=80", name: "Nina Patel", role: "UX Researcher" },
  { src: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&q=80", name: "Tom Berg", role: "Security Arch." },
  { src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80", name: "Amy Lin", role: "QA Engineer" },
  { src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80", name: "Lisa Chen", role: "DevOps Lead" },
  { src: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=300&q=80", name: "Chris Moore", role: "Architect" },
  { src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&q=80", name: "Mia Taylor", role: "Scrum Master" },
  { src: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=300&q=80", name: "Sam Johnson", role: "BI Analyst" },
  { src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80", name: "Ella Brown", role: "Brand Lead" },
  { src: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=300&q=80", name: "Kevin White", role: "Growth PM" },
  { src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80", name: "Rachel Green", role: "Finance Lead" },
  { src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80", name: "Dan Harris", role: "Infra Lead" },
];

const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

export default function ScrollMorphHero() {
  const [introPhase, setIntroPhase] = useState<AnimationPhase>("scatter");
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(containerRef.current);
    setContainerSize({
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight,
    });
    return () => observer.disconnect();
  }, []);

  const virtualScroll = useMotionValue(0);
  const scrollRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      const current = scrollRef.current;
      const atTop = current <= 0 && e.deltaY < 0;
      const atBottom = current >= MAX_SCROLL && e.deltaY > 0;
      if (atTop || atBottom) return;
      e.preventDefault();
      const newScroll = Math.min(Math.max(current + e.deltaY, 0), MAX_SCROLL);
      scrollRef.current = newScroll;
      virtualScroll.set(newScroll);
    };
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; };
    const handleTouchMove = (e: TouchEvent) => {
      const delta = touchStartY - e.touches[0].clientY;
      touchStartY = e.touches[0].clientY;
      const newScroll = Math.min(Math.max(scrollRef.current + delta, 0), MAX_SCROLL);
      scrollRef.current = newScroll;
      virtualScroll.set(newScroll);
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
    };
  }, [virtualScroll]);

  const morphProgress = useTransform(virtualScroll, [0, 600], [0, 1]);
  const smoothMorph = useSpring(morphProgress, { stiffness: 40, damping: 20 });
  const scrollRotate = useTransform(virtualScroll, [600, 3000], [0, 360]);
  const smoothScrollRotate = useSpring(scrollRotate, { stiffness: 40, damping: 20 });

  const mouseX = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 30, damping: 20 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const normalized = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseX.set(normalized * 100);
    };
    container.addEventListener("mousemove", handleMouseMove);
    return () => container.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX]);

  useEffect(() => {
    const t1 = setTimeout(() => setIntroPhase("line"), 500);
    const t2 = setTimeout(() => setIntroPhase("circle"), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const scatterPositions = useMemo(() =>
    REVIEWER_IMAGES.map(() => ({
      x: (Math.random() - 0.5) * 1500,
      y: (Math.random() - 0.5) * 1000,
      rotation: (Math.random() - 0.5) * 180,
      scale: 0.6,
      opacity: 0,
    })), []);

  const [morphValue, setMorphValue] = useState(0);
  const [rotateValue, setRotateValue] = useState(0);
  const [parallaxValue, setParallaxValue] = useState(0);

  useEffect(() => {
    const u1 = smoothMorph.on("change", setMorphValue);
    const u2 = smoothScrollRotate.on("change", setRotateValue);
    const u3 = smoothMouseX.on("change", setParallaxValue);
    return () => { u1(); u2(); u3(); };
  }, [smoothMorph, smoothScrollRotate, smoothMouseX]);

  const contentOpacity = useTransform(smoothMorph, [0.8, 1], [0, 1]);
  const contentY = useTransform(smoothMorph, [0.8, 1], [20, 0]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-transparent overflow-hidden">
      <div className="flex h-full w-full flex-col items-center justify-center" style={{ perspective: "1000px" }}>

        {/* Intro text */}
        <div className="absolute z-0 flex flex-col items-center justify-center text-center pointer-events-none top-1/2 -translate-y-1/2">
          <motion.h2
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={
              introPhase === "circle" && morphValue < 0.5
                ? { opacity: 1 - morphValue * 2, y: 0, filter: "blur(0px)" }
                : { opacity: 0, filter: "blur(10px)" }
            }
            transition={{ duration: 1 }}
            className="text-2xl md:text-4xl font-bold tracking-tight text-slate-800"
          >
            Meet your AI review team.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={
              introPhase === "circle" && morphValue < 0.5
                ? { opacity: 0.5 - morphValue }
                : { opacity: 0 }
            }
            transition={{ duration: 1, delay: 0.2 }}
            className="mt-3 text-xs font-bold tracking-[0.2em] text-slate-400"
          >
            SCROLL TO EXPLORE
          </motion.p>
        </div>

        {/* Arc content */}
        <motion.div
          style={{ opacity: contentOpacity, y: contentY }}
          className="absolute top-[8%] z-10 flex flex-col items-center text-center pointer-events-none px-4"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-3">
            9 Expert Reviewers
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-3">
            Every angle covered
          </h2>
          <p className="text-sm md:text-base text-slate-500 max-w-md leading-relaxed">
            Engineering, Design, Legal, Sales, Marketing — your PRD gets challenged by every stakeholder before you ship.
          </p>
        </motion.div>

        {/* Cards container */}
        <div className="relative flex items-center justify-center w-full h-full">
          {REVIEWER_IMAGES.slice(0, TOTAL_IMAGES).map((reviewer, i) => {
            let target = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 };

            if (introPhase === "scatter") {
              target = scatterPositions[i];
            } else if (introPhase === "line") {
              const lineSpacing = 70;
              const lineX = i * lineSpacing - (TOTAL_IMAGES * lineSpacing) / 2;
              target = { x: lineX, y: 0, rotation: 0, scale: 1, opacity: 1 };
            } else {
              const isMobile = containerSize.width < 768;
              const minDim = Math.min(containerSize.width, containerSize.height);
              const circleRadius = Math.min(minDim * 0.35, 350);
              const circleAngle = (i / TOTAL_IMAGES) * 360;
              const circleRad = (circleAngle * Math.PI) / 180;
              const circlePos = {
                x: Math.cos(circleRad) * circleRadius,
                y: Math.sin(circleRad) * circleRadius,
                rotation: circleAngle + 90,
              };

              const baseRadius = Math.min(containerSize.width, containerSize.height * 1.5);
              const arcRadius = baseRadius * (isMobile ? 1.4 : 1.1);
              const arcApexY = containerSize.height * (isMobile ? 0.35 : 0.25);
              const arcCenterY = arcApexY + arcRadius;
              const spreadAngle = isMobile ? 100 : 130;
              const startAngle = -90 - spreadAngle / 2;
              const step = spreadAngle / (TOTAL_IMAGES - 1);
              const scrollProgress = Math.min(Math.max(rotateValue / 360, 0), 1);
              const boundedRotation = -scrollProgress * spreadAngle * 0.8;
              const currentArcAngle = startAngle + i * step + boundedRotation;
              const arcRad = (currentArcAngle * Math.PI) / 180;
              const arcPos = {
                x: Math.cos(arcRad) * arcRadius + parallaxValue,
                y: Math.sin(arcRad) * arcRadius + arcCenterY,
                rotation: currentArcAngle + 90,
                scale: isMobile ? 1.4 : 1.8,
              };

              target = {
                x: lerp(circlePos.x, arcPos.x, morphValue),
                y: lerp(circlePos.y, arcPos.y, morphValue),
                rotation: lerp(circlePos.rotation, arcPos.rotation, morphValue),
                scale: lerp(1, arcPos.scale, morphValue),
                opacity: 1,
              };
            }

            return (
              <FlipCard
                key={i}
                src={reviewer.src}
                name={reviewer.name}
                role={reviewer.role}
                index={i}
                total={TOTAL_IMAGES}
                phase={introPhase}
                target={target}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
