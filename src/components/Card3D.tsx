import { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { FileText, Users, Sparkles, CheckCircle } from 'lucide-react';

export function Card3D() {
  const ref = useRef<HTMLDivElement>(null);
  const [, setIsHovered] = useState(false);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };
  
  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="relative w-full max-w-md mx-auto"
    >
      <motion.div
        style={{
          transform: "translateZ(50px)",
          transformStyle: "preserve-3d",
        }}
        className="glass rounded-2xl p-6 md:p-8 shadow-2xl shadow-indigo-200/50 bg-white/80"
      >
        {/* Card Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Product Requirements</h3>
            <p className="text-xs text-slate-500">v2.4 • Last updated 2m ago</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span>Completeness</span>
            <span>92%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: "92%" }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        </div>
        
        {/* Reviewers */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">Engineering Lead</p>
              <p className="text-xs text-green-600">Approved</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
            <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">Product Manager</p>
              <p className="text-xs text-indigo-600">Reviewing...</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <Users className="w-5 h-5 text-slate-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">7 more reviewers</p>
              <p className="text-xs text-slate-400">Pending</p>
            </div>
          </div>
        </div>
        
        {/* AI Badge */}
        <motion.div 
          className="flex items-center gap-2 text-xs text-indigo-600 font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI-enhanced document</span>
        </motion.div>
        
        {/* Decorative Elements */}
        <motion.div
          className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 opacity-20 blur-xl"
          style={{ transform: "translateZ(-50px)" }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 opacity-20 blur-xl"
          style={{ transform: "translateZ(-30px)" }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        />
      </motion.div>
      
      {/* Shadow */}
      <div 
        className="absolute inset-0 rounded-2xl bg-indigo-500/20 blur-2xl -z-10"
        style={{ transform: "translateZ(-100px)" }}
      />
    </motion.div>
  );
}