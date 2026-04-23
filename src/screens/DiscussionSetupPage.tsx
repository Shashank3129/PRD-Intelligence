import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/hooks/useAppStore';
import { UserMenu } from '@/components/UserMenu';
import { PERSONAS } from '@/constants';
import { ArrowLeft, ArrowRight, Check, Plus, X, Users, Sparkles, UserPlus, AlertCircle } from 'lucide-react';
import type { Persona } from '@/types';

const EMOJI_OPTIONS = [
  '👤','👩','👨','🧑','👩‍💼','👨‍💼','🧑‍💼','👩‍💻','👨‍💻','🧑‍💻',
  '👩‍🎨','👨‍🎨','👩‍🔬','👨‍🔬','👩‍⚖️','👨‍⚖️','👩‍🏫','👨‍🏫',
  '🎯','💡','🚀','⚡','🔥','💎','🌟','✨','🎨','📊','🛡️','🎭'
];

const CUSTOM_COLORS = [
  { color: '#6366f1', bgColor: 'rgba(99,102,241,.12)', borderColor: 'rgba(99,102,241,.3)', label: 'Indigo' },
  { color: '#f472b6', bgColor: 'rgba(244,114,182,.12)', borderColor: 'rgba(244,114,182,.3)', label: 'Pink' },
  { color: '#34d399', bgColor: 'rgba(52,211,153,.12)', borderColor: 'rgba(52,211,153,.3)', label: 'Emerald' },
  { color: '#fb923c', bgColor: 'rgba(251,146,60,.12)', borderColor: 'rgba(251,146,60,.3)', label: 'Orange' },
  { color: '#a78bfa', bgColor: 'rgba(167,139,250,.12)', borderColor: 'rgba(167,139,250,.3)', label: 'Purple' },
  { color: '#fbbf24', bgColor: 'rgba(251,191,36,.12)', borderColor: 'rgba(251,191,36,.3)', label: 'Amber' },
  { color: '#60a5fa', bgColor: 'rgba(96,165,250,.12)', borderColor: 'rgba(96,165,250,.3)', label: 'Blue' },
  { color: '#64748b', bgColor: 'rgba(100,116,139,.12)', borderColor: 'rgba(100,116,139,.3)', label: 'Slate' },
];

function PersonaAvatar({ persona, size = 'md' }: { persona: Persona; size?: 'sm' | 'md' | 'lg' }) {
  const [imgError, setImgError] = useState(false);
  const sizeClasses = size === 'sm' ? 'w-9 h-9 text-base' : size === 'lg' ? 'w-14 h-14 md:w-16 md:h-16 text-2xl' : 'w-12 h-12 md:w-14 md:h-14 text-2xl md:text-3xl';

  if (persona.avatar && !imgError) {
    return (
      <div
        className={`${sizeClasses} rounded-xl overflow-hidden flex-shrink-0 shadow-sm`}
        style={{ border: `2px solid ${persona.borderColor}` }}
      >
        <img
          src={persona.avatar}
          alt={persona.name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}
      style={{ backgroundColor: persona.bgColor, color: persona.color }}
    >
      {persona.icon}
    </div>
  );
}

function PersonaCard({
  persona,
  index,
  isSelected,
  onToggle
}: {
  persona: Persona;
  index: number;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.button
      onClick={onToggle}
      className={`relative glass rounded-xl p-5 md:p-6 text-left transition-all duration-300 ${
        isSelected
          ? 'ring-2 ring-indigo-500 shadow-lg shadow-indigo-100/50'
          : 'hover:shadow-lg hover:shadow-slate-200/50'
      }`}
      style={{
        backgroundColor: isSelected ? persona.bgColor : 'rgba(255,255,255,0.7)',
        borderColor: isSelected ? persona.borderColor : 'rgba(226,232,240,0.5)',
        transformStyle: 'preserve-3d'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -6, scale: 1.02, rotateX: 3, rotateY: index % 2 === 0 ? 2 : -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {isSelected && (
        <motion.div
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center bg-indigo-500 shadow-md z-10"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500 }}
        >
          <Check className="w-4 h-4 text-white" />
        </motion.div>
      )}

      <motion.div className="mb-3 md:mb-4" whileHover={{ scale: 1.05 }}>
        {persona.avatar && !imgError ? (
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden shadow-md"
            style={{ border: `2px solid ${persona.borderColor}` }}>
            <img
              src={persona.avatar}
              alt={persona.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <div
            className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-2xl md:text-3xl shadow-sm"
            style={{ backgroundColor: persona.bgColor, color: persona.color }}
          >
            {persona.icon}
          </div>
        )}
      </motion.div>

      <h3 className="font-bold text-base md:text-lg text-slate-900 mb-0.5">{persona.name}</h3>
      <p className="text-xs md:text-sm mb-2 font-semibold" style={{ color: persona.color }}>{persona.role}</p>
      <p className="text-slate-500 text-xs md:text-sm leading-relaxed line-clamp-2">{persona.focus}</p>
    </motion.button>
  );
}

export function DiscussionSetupPage() {
  const {
    selectedPersonas,
    togglePersona,
    setScreen,
    resetPersonaStatuses
  } = useAppStore();

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customPersona, setCustomPersona] = useState({
    name: '',
    role: '',
    focus: '',
    icon: '👤',
    colorIdx: 0
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [customPersonas, setCustomPersonas] = useState<Persona[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Custom personas appear first in the grid and in review order
  const allPersonas = [...customPersonas, ...PERSONAS];

  const isGibberish = (text: string) => {
    const letters = (text.match(/[a-zA-Z]/g) || []).length;
    if (letters < 4) return false;
    const vowels = (text.match(/[aeiouAEIOU]/g) || []).length;
    if (vowels / letters < 0.12) return true;
    const unique = new Set(text.toLowerCase().replace(/[\s\W]/g, '')).size;
    if (unique <= 3 && letters > 6) return true;
    return false;
  };

  const validateCustomPersona = () => {
    const newErrors: Record<string, string> = {};
    if (!customPersona.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (customPersona.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (isGibberish(customPersona.name)) {
      newErrors.name = 'Please enter a real name';
    }

    if (!customPersona.role.trim()) {
      newErrors.role = 'Role is required';
    } else if (customPersona.role.trim().length < 3) {
      newErrors.role = 'Role must be at least 3 characters';
    } else if (isGibberish(customPersona.role)) {
      newErrors.role = 'Please enter a meaningful role (e.g. VP Engineering)';
    }

    if (!customPersona.focus.trim()) {
      newErrors.focus = 'Focus area is required';
    } else if (customPersona.focus.trim().split(/\s+/).filter(w => w.length >= 2).length < 2) {
      newErrors.focus = 'Please describe the focus area in at least 2 words';
    } else if (isGibberish(customPersona.focus)) {
      newErrors.focus = 'Please enter a meaningful focus area';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddCustom = () => {
    if (validateCustomPersona()) {
      const colorScheme = CUSTOM_COLORS[customPersona.colorIdx];
      const newPersona: Persona = {
        id: `custom-${Date.now()}`,
        name: customPersona.name.trim(),
        role: customPersona.role.trim(),
        icon: customPersona.icon,
        color: colorScheme.color,
        bgColor: colorScheme.bgColor,
        borderColor: colorScheme.borderColor,
        // Use negative order so custom personas always sort before built-ins (which start at 1)
        order: -(customPersonas.length + 1),
        focus: customPersona.focus.trim()
      };

      setCustomPersonas([...customPersonas, newPersona]);
      togglePersona(newPersona);
      setCustomPersona({ name: '', role: '', focus: '', icon: '👤', colorIdx: 0 });
      setShowCustomForm(false);
      setShowEmojiPicker(false);
      setErrors({});
    }
  };

  const handleStartDiscussion = () => {
    if (selectedPersonas.length === 0) {
      setErrors({ general: 'Please select at least one reviewer' });
      return;
    }
    resetPersonaStatuses();
    setScreen('discussion');
  };

  // Fix: ascending order so ground-level comes first
  const sortedSelected = [...selectedPersonas].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col relative">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }}
          animate={{ scale: [1, 1.2, 1], x: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }}
          animate={{ scale: [1, 1.3, 1], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, delay: 3 }}
        />
      </div>

      {/* Header */}
      <header className="glass border-b border-slate-200/60 px-4 md:px-6 py-3 md:py-4 sticky top-0 z-10 backdrop-blur-xl bg-white/70">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200"
              whileHover={{ scale: 1.05, rotateY: 10 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              P
            </motion.div>
            <h1 className="font-bold text-sm md:text-lg text-slate-900">Discussion Setup</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <motion.button
              onClick={() => setScreen('refine')}
              className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors px-3 py-2 rounded-xl hover:bg-slate-100"
              whileHover={{ scale: 1.02, x: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Back</span>
            </motion.button>

            <motion.button
              onClick={handleStartDiscussion}
              disabled={selectedPersonas.length === 0}
              className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm py-2 px-3 md:px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium shadow-lg shadow-indigo-200 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              whileHover={selectedPersonas.length > 0 ? { scale: 1.03, y: -1 } : {}}
              whileTap={selectedPersonas.length > 0 ? { scale: 0.97 } : {}}
            >
              <span className="hidden sm:inline">Start Discussion</span>
              <span className="sm:hidden">Start</span>
              <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">{selectedPersonas.length}</span>
              <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </motion.button>
            <UserMenu className="h-9 w-9 rounded-xl" />
          </div>
        </div>
      </header>

      {/* Error Banner */}
      <AnimatePresence>
        {errors.general && (
          <motion.div
            className="mx-4 md:mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 max-w-7xl"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          >
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{errors.general}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row relative z-10 overflow-y-auto">
        {/* Left Panel - Persona Grid */}
        <div className="flex-1 p-4 md:p-6">
          <div className="max-w-4xl">
            <motion.p
              className="text-slate-600 text-sm md:text-base mb-6"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            >
              Select which stakeholders will review your PRD. Each will ask questions specific to their expertise.
            </motion.p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {allPersonas.map((persona, i) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  index={i}
                  isSelected={!!selectedPersonas.find(p => p.id === persona.id)}
                  onToggle={() => togglePersona(persona)}
                />
              ))}

              {/* Add Custom Persona */}
              <AnimatePresence mode="wait">
                {!showCustomForm ? (
                  <motion.button
                    key="add-btn"
                    onClick={() => setShowCustomForm(true)}
                    className="glass rounded-xl p-5 md:p-6 border-2 border-dashed border-slate-300 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center gap-3 min-h-[200px] md:min-h-[240px]"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02, y: -4, borderColor: '#6366f1' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-slate-100 flex items-center justify-center" whileHover={{ rotate: 90 }}>
                      <Plus className="w-6 h-6 md:w-7 md:h-7 text-slate-400" />
                    </motion.div>
                    <span className="text-slate-500 font-semibold text-sm">Add Custom Persona</span>
                  </motion.button>
                ) : (
                  <motion.div
                    key="add-form"
                    className="glass rounded-xl p-5 md:p-6 border-2 border-indigo-200 bg-indigo-50/30 col-span-1 sm:col-span-2 lg:col-span-1"
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-slate-900 text-sm md:text-base flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-indigo-500" />
                        New Persona
                      </h3>
                      <button
                        onClick={() => { setShowCustomForm(false); setShowEmojiPicker(false); setErrors({}); }}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {/* Icon picker row */}
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1.5">Icon</p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="w-12 h-12 rounded-xl border-2 border-indigo-200 bg-white flex items-center justify-center text-2xl hover:border-indigo-400 transition-colors shadow-sm"
                          >
                            {customPersona.icon}
                          </button>
                          <AnimatePresence>
                            {showEmojiPicker && (
                              <motion.div
                                className="absolute z-50 mt-1 p-2 bg-white rounded-xl shadow-xl border border-slate-200 grid grid-cols-8 gap-1 w-64"
                                style={{ marginTop: '52px' }}
                                initial={{ opacity: 0, scale: 0.9, y: -8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -8 }}
                              >
                                {EMOJI_OPTIONS.map(emoji => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => { setCustomPersona(p => ({ ...p, icon: emoji })); setShowEmojiPicker(false); }}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-indigo-50 transition-colors ${customPersona.icon === emoji ? 'bg-indigo-100 ring-2 ring-indigo-400' : ''}`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                          {/* Color swatches */}
                          <div className="flex gap-1.5 flex-wrap">
                            {CUSTOM_COLORS.map((c, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setCustomPersona(p => ({ ...p, colorIdx: idx }))}
                                className={`w-6 h-6 rounded-full transition-all ${customPersona.colorIdx === idx ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-110'}`}
                                style={{ backgroundColor: c.color }}
                                title={c.label}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={customPersona.name}
                          onChange={(e) => { setCustomPersona(p => ({ ...p, name: e.target.value })); if (errors.name) setErrors(prev => { const n = { ...prev }; delete n.name; return n; }); }}
                          placeholder="Name"
                          className={`w-full px-3 py-2.5 rounded-lg border-2 bg-white/80 text-sm outline-none transition-all ${errors.name ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'}`}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <input
                          type="text"
                          value={customPersona.role}
                          onChange={(e) => { setCustomPersona(p => ({ ...p, role: e.target.value })); if (errors.role) setErrors(prev => { const n = { ...prev }; delete n.role; return n; }); }}
                          placeholder="Role (e.g. VP Engineering)"
                          className={`w-full px-3 py-2.5 rounded-lg border-2 bg-white/80 text-sm outline-none transition-all ${errors.role ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'}`}
                        />
                        {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                      </div>
                      <div>
                        <textarea
                          value={customPersona.focus}
                          onChange={(e) => { setCustomPersona(p => ({ ...p, focus: e.target.value })); if (errors.focus) setErrors(prev => { const n = { ...prev }; delete n.focus; return n; }); }}
                          placeholder="Focus area (e.g. Security, compliance, API design)"
                          rows={2}
                          className={`w-full px-3 py-2.5 rounded-lg border-2 bg-white/80 text-sm outline-none resize-none transition-all ${errors.focus ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'}`}
                        />
                        {errors.focus && <p className="text-red-500 text-xs mt-1">{errors.focus}</p>}
                      </div>
                      <motion.button
                        onClick={handleAddCustom}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl transition-all"
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      >
                        Add Persona
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Panel - Discussion Order */}
        <div className="w-full lg:w-[320px] xl:w-[340px] border-t lg:border-t-0 lg:border-l border-slate-200/60 bg-white/50 backdrop-blur-sm p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-base md:text-lg text-slate-900">Review Order</h3>
          </div>
          <p className="text-slate-500 text-xs md:text-sm mb-4 md:mb-6">Ground-level first, CEO closes.</p>

          {sortedSelected.length > 0 ? (
            <div className="space-y-0">
              {sortedSelected.map((persona, i) => (
                <motion.div
                  key={persona.id}
                  className="relative"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="flex items-center gap-3 py-2.5">
                    <PersonaAvatar persona={persona} size="sm" />
                    <div className="min-w-0">
                      <p className="text-slate-900 font-semibold text-sm truncate">{persona.name}</p>
                      <p className="text-slate-500 text-xs truncate">{persona.role}</p>
                    </div>
                  </div>
                  {i < sortedSelected.length - 1 && (
                    <motion.div
                      className="absolute left-4 top-11 w-0.5 h-3"
                      style={{ backgroundColor: persona.borderColor }}
                      initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                      transition={{ delay: i * 0.08 + 0.15 }}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              </motion.div>
              <p className="text-slate-400 text-sm italic">Select at least one reviewer to start.</p>
            </div>
          )}

          <motion.div
            className="mt-6 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100/60"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          >
            <p className="text-slate-600 text-xs md:text-sm">
              <strong className="text-slate-900">Tip:</strong> You can skip any reviewer or refine the PRD at any point during discussion.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
