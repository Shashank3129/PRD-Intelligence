import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Building2, Edit2, Check } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { createCompanyWithTimeout, resolveCurrentUserId, updateProfileCompanyWithTimeout } from '@/services/supabase';
import { generateCompanyContext } from '@/services/aiService';
import type { CompanyProfile } from '@/services/aiService';

export function CompanyOnboardingPage() {
  const { setScreen, setSelectedCompany, addCompany, setCompanies, user, addToast } = useAppStore();

  const [companyName, setCompanyName] = useState('');
  const [hint, setHint] = useState('');
  const [nameError, setNameError] = useState('');
  const [phase, setPhase] = useState<'input' | 'generating' | 'review'>('input');
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState<CompanyProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [elapsedSecs, setElapsedSecs] = useState(0);

  useEffect(() => {
    if (!user) setScreen('auth');
  }, [user, setScreen]);

  useEffect(() => {
    if (phase !== 'generating') { setElapsedSecs(0); return; }
    const t = setInterval(() => setElapsedSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const handleGenerate = async () => {
    const name = companyName.trim();
    if (name.length < 2) { setNameError('Enter a valid company name'); return; }
    setNameError('');
    setPhase('generating');

    const result = await generateCompanyContext(name, hint.trim() || undefined);
    if (!result.success || !result.profile) {
      addToast({ type: 'error', message: result.error || 'AI generation failed. Try again.' });
      setPhase('input');
      return;
    }

    setProfile(result.profile);
    setEditedProfile(result.profile);
    setPhase('review');
  };

  const updateField = (key: keyof CompanyProfile, value: string | string[]) => {
    setEditedProfile(prev => prev ? { ...prev, [key]: value } : prev);
  };

  const handleSave = async () => {
    if (!editedProfile || !user?.email) return;
    setSaving(true);
    try {
      const userId = await resolveCurrentUserId(user.id);

      const newCompany = await createCompanyWithTimeout(userId, {
        name: companyName.trim(),
        industry: editedProfile.industry,
        size: editedProfile.size,
        description: editedProfile.description,
        context: [
          `Goals: ${editedProfile.goals}`,
          `Target Market: ${editedProfile.targetMarket}`,
          `Business Model: ${editedProfile.businessModel}`,
          `Competitors: ${editedProfile.competitors.join(', ')}`
        ].join('\n')
      });

      void updateProfileCompanyWithTimeout(userId, newCompany.id, newCompany.id).catch((error) => {
        console.error('[CompanyOnboardingPage] Failed to sync profile company:', error);
      });
      addCompany(newCompany);
      setSelectedCompany(newCompany);
      setCompanies([newCompany]);
      addToast({ type: 'success', message: `Welcome to ${newCompany.name}!` });
      setScreen('dashboard');
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save company. Try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Set Up Your Company
          </h1>
          <p className="text-slate-500 text-sm">
            Enter your company name — AI fills in the rest
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {phase === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-slate-200 p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => { setCompanyName(e.target.value); setNameError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                  placeholder="e.g., Acme Corp"
                  className={`w-full px-4 py-3 rounded-xl border-2 bg-white transition-all outline-none text-sm ${
                    nameError ? 'border-red-400' : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'
                  }`}
                />
                {nameError && (
                  <p className="text-red-500 text-xs mt-1">{nameError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  One-line hint <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={hint}
                  onChange={e => setHint(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                  placeholder="e.g., B2B SaaS for HR teams, Series A"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-sm"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all"
              >
                <Sparkles size={16} />
                Generate with AI
              </motion.button>
            </motion.div>
          )}

          {phase === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-indigo-200 p-10 text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                  <Building2 size={20} className="absolute inset-0 m-auto text-indigo-600" />
                </div>
              </div>
              <p className="text-slate-800 font-semibold mb-1">Analysing {companyName}…</p>
              <p className="text-slate-400 text-sm">
                {elapsedSecs < 8
                  ? 'AI is researching your company'
                  : elapsedSecs < 18
                  ? `Thinking hard… (${elapsedSecs}s)`
                  : `Slow model, almost there… (${elapsedSecs}s)`}
              </p>
            </motion.div>
          )}

          {phase === 'review' && editedProfile && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-indigo-700">
                <Sparkles size={14} />
                AI generated a profile for <strong>{companyName}</strong>. Edit if needed.
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-slate-200 p-5 space-y-4">
                <Field label="Industry" value={editedProfile.industry} onChange={v => updateField('industry', v)} />
                <Field label="Size" value={editedProfile.size} onChange={v => updateField('size', v)} />
                <Field label="Description" value={editedProfile.description} onChange={v => updateField('description', v)} multiline />
                <Field label="Goals" value={editedProfile.goals} onChange={v => updateField('goals', v)} multiline />
                <Field label="Target Market" value={editedProfile.targetMarket} onChange={v => updateField('targetMarket', v)} />
                <Field label="Business Model" value={editedProfile.businessModel} onChange={v => updateField('businessModel', v)} />
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Competitors</label>
                  <input
                    type="text"
                    value={editedProfile.competitors.join(', ')}
                    onChange={e => updateField('competitors', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                    placeholder="Comma-separated"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setPhase('input'); setProfile(null); setEditedProfile(null); }}
                  className="px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <Edit2 size={14} /> Redo
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <span className="animate-pulse">Saving…</span>
                  ) : (
                    <><Check size={16} /> Save & Continue</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, multiline = false
}: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean;
}) {
  const base = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none';
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className={`${base} resize-none`} />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} className={base} />
      )}
    </div>
  );
}
