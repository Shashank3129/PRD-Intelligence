import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Globe, ChevronDown, Trash2, FileText, Calendar,
  Building2, Sparkles, Target, Briefcase, TrendingUp, Users, Check, X,
  ChevronLeft, ChevronRight, Lightbulb, Zap, Box, AlertCircle, Package,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import {
  createCompanyWithTimeout,
  deleteCompany,
  deletePRD,
  getCompanyPRDsWithTimeout,
  resolveCurrentUserId,
  updateProfileCompanyWithTimeout
} from '@/services/supabase';
import { generateCompanyContext } from '@/services/aiService';
import type { Company, SavedPRD, Product } from '@/types';
import { UserMenu } from '@/components/UserMenu';

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function parseContext(context?: string): Record<string, string> {
  if (!context) return {};
  return Object.fromEntries(
    context.split('\n')
      .map(line => {
        const idx = line.indexOf(':');
        return idx > 0 ? [line.slice(0, idx).trim(), line.slice(idx + 1).trim()] : null;
      })
      .filter(Boolean) as [string, string][]
  );
}

function hasEnoughWords(text: string, min: number) {
  return text.trim().split(/\s+/).filter(w => w.length >= 2).length >= min;
}

const STAGE_OPTIONS = [
  { value: 'pre-launch', label: 'Pre-launch', icon: Lightbulb },
  { value: 'early-traction', label: 'Early traction', icon: Zap },
  { value: 'growth', label: 'Growth', icon: TrendingUp },
  { value: 'scale', label: 'Scale', icon: Users },
];

function statusDot(status?: string) {
  if (status === 'active') return 'bg-emerald-400';
  if (status === 'beta') return 'bg-amber-400';
  return 'bg-slate-400';
}

// ── Animated background (same style as SetupPage) ─────────────────────────────
function AnimatedBg() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(circle at 12% 18%, rgba(99,102,241,0.12), transparent 26%)',
            'radial-gradient(circle at 85% 16%, rgba(56,189,248,0.10), transparent 24%)',
            'radial-gradient(circle at 52% 80%, rgba(168,85,247,0.08), transparent 28%)'
          ].join(', ')
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.35) 1px, transparent 1px)',
          backgroundSize: '96px 96px'
        }}
      />
    </div>
  );
}

// ── Add Company Modal (light theme) ───────────────────────────────────────────
function AddCompanyModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (c: Company) => void;
}) {
  const { user, addToast, addCompany, setSelectedCompany, addProduct } = useAppStore();
  const [name, setName] = useState('');
  const [hint, setHint] = useState('');
  const [phase, setPhase] = useState<'input' | 'generating' | 'review' | 'add-product'>('input');
  const [edited, setEdited] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [nameErr, setNameErr] = useState('');
  const [savedCompany, setSavedCompany] = useState<Company | null>(null);
  const [discoveredProducts, setDiscoveredProducts] = useState<Array<{ name: string; description: string; type: string; status: string }>>([]);
  const [selectedDiscovered, setSelectedDiscovered] = useState<Set<number>>(new Set());
  const [productForm, setProductForm] = useState({ name: '', stage: 'early-traction', description: '', targetUsers: '', businessModel: '', competitors: '', companyGoals: '', type: 'SaaS', status: 'active' });
  const [productErrors, setProductErrors] = useState<Record<string, string>>({});
  const [addingProduct, setAddingProduct] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  useEffect(() => {
    if (phase !== 'generating') { setElapsed(0); return; }
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const handleGenerate = async () => {
    if (name.trim().length < 2) { setNameErr('Enter a valid name'); return; }
    setNameErr('');
    setPhase('generating');
    const res = await generateCompanyContext(name.trim(), hint.trim() || undefined);
    if (!res.success || !res.profile) {
      addToast({ type: 'error', message: res.error || 'AI generation failed' });
      setPhase('input');
      return;
    }
    setEdited(res.profile as unknown as Record<string, unknown>);
    const dp = res.profile.discoveredProducts ?? [];
    setDiscoveredProducts(dp);
    setSelectedDiscovered(new Set(dp.map((_, i) => i)));
    setPhase('review');
  };

  const handleSave = async () => {
    if (!edited || !user?.email) return;
    setSaving(true);
    try {
      const userId = await resolveCurrentUserId(user.id);
      const p = edited as { industry: string; size: string; description: string; goals: string; targetMarket: string; businessModel: string; competitors: string[] };
      const company = await createCompanyWithTimeout(userId, {
        name: name.trim(),
        industry: p.industry,
        size: p.size,
        description: p.description,
        context: [`Goals: ${p.goals}`, `Target Market: ${p.targetMarket}`, `Business Model: ${p.businessModel}`, `Competitors: ${Array.isArray(p.competitors) ? p.competitors.join(', ') : p.competitors}`].join('\n')
      });
      void updateProfileCompanyWithTimeout(userId, company.id!, company.id!).catch((error) => {
        console.error('[DashboardPage] Failed to sync profile company after create:', error);
      });
      addCompany(company);
      setSelectedCompany(company);
      setSavedCompany(company);
      setPhase('add-product');
    } catch (error) {
      console.error(error);
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to create company'
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleDiscovered = (idx: number) => {
    setSelectedDiscovered(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleSaveDiscovered = () => {
    if (!savedCompany) return;
    selectedDiscovered.forEach(idx => {
      const dp = discoveredProducts[idx];
      if (!dp) return;
      addProduct({
        id: generateId(), companyId: savedCompany.id!, name: dp.name,
        description: dp.description, type: dp.type, status: dp.status,
        stage: 'early-traction', targetUsers: '', businessModel: '', competitors: '', companyGoals: '',
        createdAt: new Date().toISOString()
      });
    });
    onCreated(savedCompany);
  };

  const validateProduct = () => {
    const errs: Record<string, string> = {};
    if (!productForm.name.trim()) errs.name = 'Required';
    else if (productForm.name.length < 2) errs.name = 'At least 2 chars';
    if (!productForm.description.trim()) errs.description = 'Required';
    else if (productForm.description.length < 20) errs.description = 'At least 20 chars';
    else if (!hasEnoughWords(productForm.description, 4)) errs.description = 'At least 4 words';
    if (!productForm.targetUsers.trim()) errs.targetUsers = 'Required';
    setProductErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddManual = () => {
    if (!validateProduct() || !savedCompany) return;
    setAddingProduct(true);
    addProduct({
      id: generateId(), companyId: savedCompany.id!, name: productForm.name.trim(),
      description: productForm.description, type: productForm.type, status: productForm.status,
      stage: productForm.stage, targetUsers: productForm.targetUsers,
      businessModel: productForm.businessModel, competitors: productForm.competitors,
      companyGoals: productForm.companyGoals, createdAt: new Date().toISOString()
    });
    setAddingProduct(false);
    onCreated(savedCompany);
  };

  const updateProduct = (field: string, val: string) => {
    setProductForm(p => ({ ...p, [field]: val }));
    if (productErrors[field]) setProductErrors(e => { const n = { ...e }; delete n[field]; return n; });
  };

  const inputCls = (err?: string) =>
    `w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all text-slate-800 placeholder-slate-400 border-2 bg-white/80 ${
      err ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md relative overflow-hidden rounded-2xl shadow-2xl shadow-slate-200/50 bg-white border border-slate-200/80"
        style={{ maxHeight: '90vh' }}
      >
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <motion.div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
            animate={{ width: phase === 'input' ? '25%' : phase === 'generating' ? '50%' : phase === 'review' ? '75%' : '100%' }}
            transition={{ duration: 0.4 }} />
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 4px)' }}>
          {phase !== 'add-product' && (
            <button onClick={onClose} className="absolute top-5 right-4 text-slate-400 hover:text-slate-700 z-10 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <X size={16} />
            </button>
          )}

          <AnimatePresence mode="wait">
            {/* Input */}
            {phase === 'input' && (
              <motion.div key="input" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Add your company</h2>
                  <p className="text-slate-500 text-sm mt-1">AI researches and fills details automatically</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Company Name *</label>
                  <input value={name} onChange={e => { setName(e.target.value); setNameErr(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleGenerate()} placeholder="e.g., Stripe" autoFocus
                    className={inputCls(nameErr)} />
                  {nameErr && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{nameErr}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Hint <span className="text-slate-400 font-normal normal-case">(optional)</span></label>
                  <input value={hint} onChange={e => setHint(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                    placeholder="e.g., B2B SaaS, Series A" className={inputCls()} />
                </div>
                <button onClick={handleGenerate}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-300/40 transition-all text-sm">
                  <Sparkles size={15} /> Generate with AI
                </button>
              </motion.div>
            )}

            {/* Generating */}
            {phase === 'generating' && (
              <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-12 text-center">
                <div className="w-14 h-14 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mx-auto mb-5" />
                <p className="text-slate-800 font-semibold text-lg">Researching {name}…</p>
                <p className="text-slate-400 text-sm mt-2">
                  {elapsed < 5 ? 'Analyzing company profile…' : elapsed < 10 ? 'Discovering products…' : `${elapsed}s — almost there`}
                </p>
              </motion.div>
            )}

            {/* Review */}
            {phase === 'review' && edited && (
              <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Review profile</h2>
                  <p className="text-slate-500 text-sm mt-0.5">Edit before saving</p>
                </div>
                <div className="rounded-xl px-3 py-2 text-xs text-indigo-700 flex items-center gap-1.5 bg-indigo-50 border border-indigo-200">
                  <Sparkles size={11} /> AI-generated — review and edit as needed
                </div>
                <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: '45vh' }}>
                  {[
                    { label: 'Industry', key: 'industry' },
                    { label: 'Size', key: 'size' },
                    { label: 'Description', key: 'description', multi: true },
                    { label: 'Goals', key: 'goals', multi: true },
                    { label: 'Target Market', key: 'targetMarket' },
                    { label: 'Business Model', key: 'businessModel' },
                  ].map(({ label, key, multi }) => (
                    <div key={key}>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
                      {multi ? (
                        <textarea value={String(edited[key] ?? '')} onChange={e => setEdited(p => ({ ...p!, [key]: e.target.value }))}
                          rows={2} className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none text-slate-800 border-2 border-slate-200 focus:border-indigo-500 bg-white/80 transition-all" />
                      ) : (
                        <input value={String(edited[key] ?? '')} onChange={e => setEdited(p => ({ ...p!, [key]: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl text-sm outline-none text-slate-800 border-2 border-slate-200 focus:border-indigo-500 bg-white/80 transition-all" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => { setEdited(null); setPhase('input'); }}
                    className="px-4 py-2 rounded-xl text-slate-600 text-sm border-2 border-slate-200 hover:bg-slate-50 transition-colors font-medium">Redo</button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 hover:shadow-lg hover:shadow-indigo-300/40 transition-all">
                    {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : <><Check size={14} /> Save Company</>}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Add Products */}
            {phase === 'add-product' && (
              <motion.div key="add-product" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Check size={11} className="text-emerald-600" />
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">{savedCompany?.name} created!</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Add products</h2>
                  <p className="text-slate-500 text-sm mt-0.5">
                    {discoveredProducts.length > 0 ? 'AI found these products — select to add them.' : 'Add a product to generate more targeted PRDs.'}
                  </p>
                </div>

                {/* AI discovered products */}
                {discoveredProducts.length > 0 && !showManualForm && (
                  <div className="space-y-2 overflow-y-auto pr-0.5" style={{ maxHeight: '40vh' }}>
                    {discoveredProducts.map((dp, idx) => (
                      <label key={idx} onClick={() => toggleDiscovered(idx)}
                        className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${
                          selectedDiscovered.has(idx)
                            ? 'border-indigo-300 bg-indigo-50'
                            : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30'
                        }`}>
                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all border-2 ${
                          selectedDiscovered.has(idx) ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-300'
                        }`}>
                          {selectedDiscovered.has(idx) && <Check size={10} className="text-white" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-slate-900 font-semibold text-sm">{dp.name}</span>
                            {dp.type && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">{dp.type}</span>}
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <span className={`w-1.5 h-1.5 rounded-full ${statusDot(dp.status)}`} />
                              {dp.status}
                            </span>
                          </div>
                          <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{dp.description}</p>
                        </div>
                      </label>
                    ))}
                    <button onClick={() => setShowManualForm(true)}
                      className="w-full flex items-center gap-2 p-2.5 rounded-xl text-slate-500 hover:text-indigo-600 text-xs font-medium transition-colors border-2 border-dashed border-slate-200 hover:border-indigo-300">
                      <Plus size={13} /> Add manually instead
                    </button>
                  </div>
                )}

                {/* Manual product form */}
                {(discoveredProducts.length === 0 || showManualForm) && (
                  <div className="space-y-3 overflow-y-auto pr-0.5" style={{ maxHeight: '50vh' }}>
                    {showManualForm && (
                      <button onClick={() => setShowManualForm(false)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors mb-1">
                        <ChevronLeft size={13} /> Back to discovered products
                      </button>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Product Name *</label>
                      <input value={productForm.name} onChange={e => updateProduct('name', e.target.value)} placeholder="e.g., Acme CRM"
                        className={inputCls(productErrors.name)} />
                      {productErrors.name && <p className="text-red-500 text-xs mt-1">{productErrors.name}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Type</label>
                        <select value={productForm.type} onChange={e => updateProduct('type', e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-slate-800 border-2 border-slate-200 focus:border-indigo-500 bg-white transition-all">
                          {['SaaS', 'API', 'Platform', 'Mobile App', 'Tool', 'Library', 'Other'].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                        <select value={productForm.status} onChange={e => updateProduct('status', e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-slate-800 border-2 border-slate-200 focus:border-indigo-500 bg-white transition-all">
                          {['active', 'beta', 'planning', 'deprecated'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description *</label>
                      <textarea value={productForm.description} onChange={e => updateProduct('description', e.target.value)}
                        placeholder="What does this product do and who is it for?" rows={3}
                        className={`${inputCls(productErrors.description)} resize-none`} />
                      {productErrors.description && <p className="text-red-500 text-xs mt-1">{productErrors.description}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Target Users *</label>
                      <input value={productForm.targetUsers} onChange={e => updateProduct('targetUsers', e.target.value)} placeholder="e.g., Sales teams at mid-market SaaS"
                        className={inputCls(productErrors.targetUsers)} />
                      {productErrors.targetUsers && <p className="text-red-500 text-xs mt-1">{productErrors.targetUsers}</p>}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button onClick={() => savedCompany && onCreated(savedCompany)}
                    className="px-4 py-2.5 rounded-xl text-slate-600 text-sm border-2 border-slate-200 hover:bg-slate-50 transition-colors font-medium">
                    Skip
                  </button>
                  <button
                    onClick={discoveredProducts.length > 0 && !showManualForm ? handleSaveDiscovered : handleAddManual}
                    disabled={addingProduct}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold flex items-center justify-center gap-1.5 hover:shadow-lg hover:shadow-indigo-300/40 transition-all disabled:opacity-50">
                    <Package size={14} />
                    {discoveredProducts.length > 0 && !showManualForm
                      ? `Add ${selectedDiscovered.size} Product${selectedDiscovered.size !== 1 ? 's' : ''}`
                      : 'Add Product'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ── PRD Skeleton ──────────────────────────────────────────────────────────────
function PRDSkeleton() {
  return (
    <div className="rounded-2xl p-5 animate-pulse bg-white border border-slate-200 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-slate-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-slate-200 rounded w-3/4" />
          <div className="h-2.5 bg-slate-200 rounded w-1/3" />
        </div>
      </div>
      <div className="h-2 bg-slate-200 rounded mb-2" />
      <div className="h-2 bg-slate-200 rounded w-5/6 mb-4" />
      <div className="h-8 bg-slate-200 rounded-lg" />
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export function DashboardPage() {
  const {
    companies, selectedCompany, products, user,
    setCompanies, setSelectedCompany, setScreen, addToast, setPrd, setProductCtx,
    setPrdVersion, setCurrentPrdId, deleteProduct: removeProduct
  } = useAppStore();

  const [prds, setPrds] = useState<SavedPRD[]>([]);
  const [prdsLoading, setPrdsLoading] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingCompanyId, setDeletingCompanyId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [productsExpanded, setProductsExpanded] = useState(true);
  const autoModalFired = useRef(false);

  const companyProducts = products.filter(p => p.companyId === selectedCompany?.id);

  useEffect(() => {
    if (!autoModalFired.current && companies.length === 0) {
      autoModalFired.current = true;
      setShowAddModal(true);
    }
  }, [companies.length]);

  useEffect(() => {
    if (!selectedCompany?.id) { setPrds([]); return; }
    setPrdsLoading(true);
    getCompanyPRDsWithTimeout(selectedCompany.id)
      .then(setPrds)
      .catch(() => addToast({ type: 'error', message: 'Failed to load PRDs' }))
      .finally(() => setPrdsLoading(false));
  }, [selectedCompany?.id, addToast]);

  const handleSelectCompany = async (company: Company) => {
    setSelectedCompany(company);
    setShowSwitcher(false);
    try {
      const userId = await resolveCurrentUserId(user?.id);
      void updateProfileCompanyWithTimeout(userId, companies[0]?.id, company.id).catch(() => undefined);
    } catch { /* silent */ }
  };

  const handleDeletePRD = async (prdId: string) => {
    if (!confirm('Delete this PRD? Cannot be undone.')) return;
    setDeletingId(prdId);
    try {
      await deletePRD(prdId);
      setPrds(prev => prev.filter(p => p.id !== prdId));
      addToast({ type: 'success', message: 'PRD deleted' });
    } catch { addToast({ type: 'error', message: 'Failed to delete PRD' }); }
    finally { setDeletingId(null); }
  };

  const handleDeleteCompany = async () => {
    if (!selectedCompany?.id) return;
    if (!confirm(`Delete "${selectedCompany.name}" and all its PRDs?`)) return;
    setDeletingCompanyId(selectedCompany.id);
    try {
      await deleteCompany(selectedCompany.id);
      const remaining = companies.filter(c => c.id !== selectedCompany.id);
      setCompanies(remaining);
      setSelectedCompany(remaining.length > 0 ? remaining[0] : null);
      addToast({ type: 'success', message: `${selectedCompany.name} deleted` });
    } catch { addToast({ type: 'error', message: 'Failed to delete company' }); }
    finally { setDeletingCompanyId(null); }
  };

  const handleViewPRD = (prd: SavedPRD) => {
    setPrd(prd.prd_content);
    setCurrentPrdId(prd.id ?? null);
    setPrdVersion(prd.version || 1);
    setProductCtx({
      productName: prd.product_name, stage: 'early-traction', description: '',
      targetUsers: '',
      businessModel: selectedCompany?.context ? (parseContext(selectedCompany.context)['Business Model'] || '') : '',
      competitors: '',
      companyGoals: selectedCompany?.context ? (parseContext(selectedCompany.context)['Goals'] || '') : ''
    });
    setScreen('export');
  };

  const ctx = parseContext(selectedCompany?.context);

  return (
    <div className="min-h-screen flex relative bg-slate-50">
      <AnimatedBg />

      {/* ── Sidebar ── */}
      <motion.div
        animate={{ width: sidebarOpen ? 336 : 76 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="flex-shrink-0 flex flex-col relative z-10 overflow-hidden bg-white border-r border-slate-200/80 shadow-sm"
        style={{ minHeight: '100vh' }}
      >
        {/* Sidebar header: logo + toggle */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200/80">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">P</div>
                <span className="text-sm font-bold text-slate-800 truncate">PRD Studio</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-slate-100 ${!sidebarOpen ? 'mx-auto' : ''}`}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen
              ? <PanelLeftClose size={16} className="text-slate-500" />
              : <PanelLeftOpen size={16} className="text-slate-500" />}
          </button>
        </div>

        {/* Company switcher */}
        <div className="px-3 py-3 relative border-b border-slate-200/80" style={{ zIndex: 40 }}>
          {sidebarOpen ? (
            <button onClick={() => setShowSwitcher(s => !s)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all bg-slate-50 hover:bg-slate-100 border border-slate-200"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {selectedCompany?.name?.[0]?.toUpperCase() ?? <Building2 size={14} />}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{selectedCompany?.name || 'No company'}</p>
                <p className="text-xs text-slate-500">Company workspace</p>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform flex-shrink-0 ${showSwitcher ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            <button onClick={() => setSidebarOpen(true)} className="w-full flex items-center justify-center py-1.5" title={selectedCompany?.name || 'No company'}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                {selectedCompany?.name?.[0]?.toUpperCase() ?? <Building2 size={14} />}
              </div>
            </button>
          )}

          <AnimatePresence>
            {showSwitcher && sidebarOpen && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="absolute top-full left-3 right-3 mt-2 rounded-2xl shadow-lg z-50 overflow-hidden bg-white border border-slate-200">
                {companies.map(c => (
                  <button key={c.id} onClick={() => handleSelectCompany(c)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors border-b border-slate-100 last:border-0 ${
                      selectedCompany?.id === c.id ? 'bg-indigo-50' : 'hover:bg-slate-50'
                    }`}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {c.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.industry}</p>
                    </div>
                    {selectedCompany?.id === c.id && <Check size={13} className="text-indigo-500 ml-auto flex-shrink-0" />}
                  </button>
                ))}
                <button onClick={() => { setShowSwitcher(false); setShowAddModal(true); }}
                  className="w-full text-left px-3 py-2.5 text-indigo-600 text-sm font-medium flex items-center gap-2 hover:bg-indigo-50 transition-colors">
                  <Plus size={13} /> Add new company
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar content — only shown when open */}
        {sidebarOpen && (
          <div className="flex-1 overflow-y-auto px-4 py-5">
            {selectedCompany ? (
              <div className="space-y-5">
                {selectedCompany.description && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-600 leading-7">{selectedCompany.description}</p>
                  </div>
                )}
                <div className="space-y-3">
                  {selectedCompany.industry && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Building2 size={10} /> Industry</p>
                      <p className="text-sm text-slate-700 leading-6">{selectedCompany.industry}</p>
                    </div>
                  )}
                  {ctx['Target Market'] && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Target size={10} /> Target Market</p>
                      <p className="text-sm text-slate-700 leading-6">{ctx['Target Market']}</p>
                    </div>
                  )}
                  {ctx['Business Model'] && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Briefcase size={10} /> Business Model</p>
                      <p className="text-sm text-slate-700 leading-6">{ctx['Business Model']}</p>
                    </div>
                  )}
                  {ctx['Goals'] && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><TrendingUp size={10} /> Goals</p>
                      <p className="text-sm text-slate-700 leading-6">{ctx['Goals']}</p>
                    </div>
                  )}
                  {selectedCompany.website && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Globe size={10} /> Website</p>
                      <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline break-all">{selectedCompany.website}</a>
                    </div>
                  )}
                </div>

                {/* Products section */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <button onClick={() => setProductsExpanded(e => !e)}
                    className="w-full flex items-center justify-between mb-3 text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-slate-700 transition-colors">
                    <span className="flex items-center gap-1.5"><Package size={10} /> Products ({companyProducts.length})</span>
                    {productsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                  <AnimatePresence>
                    {productsExpanded && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-1.5 overflow-hidden">
                        {companyProducts.length === 0 && (
                          <p className="text-xs text-slate-400 italic px-1">No products yet</p>
                        )}
                        {companyProducts.map(product => (
                          <div key={product.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl group transition-colors hover:bg-slate-50 border border-slate-200 bg-slate-50/50">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot(product.status)}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-700 truncate">{product.name}</p>
                              {product.type && <p className="text-xs text-slate-400 mt-0.5">{product.type}</p>}
                            </div>
                            <button onClick={() => removeProduct(product.id)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-red-500 transition-all">
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => setScreen('setup')}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-indigo-600 border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all">
                          <Plus size={11} /> Add Product
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Delete company */}
                <div className="pt-1">
                  <button onClick={handleDeleteCompany} disabled={deletingCompanyId === selectedCompany.id}
                    className="w-full py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5 border border-red-200 bg-white">
                    <Trash2 size={11} /> Delete Company
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <Building2 size={28} className="text-slate-300 mb-3" />
                <p className="text-sm text-slate-400 mb-4">No company yet</p>
                <button onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium flex items-center gap-1.5 hover:shadow-lg hover:shadow-indigo-300/40 transition-all">
                  <Plus size={13} /> Add Company
                </button>
              </div>
            )}
          </div>
        )}

        {/* Collapsed: quick actions */}
        {!sidebarOpen && selectedCompany && (
          <div className="flex flex-col items-center gap-2 p-3 mt-2">
            <button onClick={() => setScreen('setup')} title="Create PRD"
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white hover:shadow-md hover:shadow-indigo-300/40 transition-all">
              <Plus size={15} />
            </button>
            <button onClick={() => setShowAddModal(true)} title="Add Company"
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all">
              <Building2 size={15} />
            </button>
          </div>
        )}
      </motion.div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedCompany ? selectedCompany.name : 'Select or create a company'}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {selectedCompany && (
              <motion.button onClick={() => setScreen('setup')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-300/40 transition-all"
                whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}>
                <Plus size={14} /> Create PRD
              </motion.button>
            )}
            <UserMenu className="h-9 w-9 rounded-xl" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Stats */}
          {selectedCompany && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Companies', value: companies.length, color: 'from-violet-500 to-purple-600', icon: Building2 },
                { label: 'Products', value: companyProducts.length, color: 'from-cyan-500 to-blue-600', icon: Package },
                { label: 'PRDs', value: prds.length, color: 'from-blue-500 to-indigo-600', icon: FileText },
                { label: 'Team', value: 1, color: 'from-orange-500 to-amber-600', icon: Users },
              ].map(({ label, value, color, icon: Icon }, i) => (
                <motion.div key={label}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-2xl p-5 flex items-center gap-4 bg-white border border-slate-200 shadow-sm transition-shadow">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                    <p className="text-xs text-slate-400">{label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* PRDs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileText size={16} className="text-indigo-500" />
                PRDs <span className="text-slate-400 font-normal text-sm">({prds.length})</span>
              </h2>
              {selectedCompany && (
                <button onClick={() => setScreen('setup')} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors">
                  <Plus size={13} /> Add PRD
                </button>
              )}
            </div>

            {!selectedCompany ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-16 rounded-2xl bg-white border-2 border-dashed border-slate-300 shadow-sm">
                <Building2 size={36} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium mb-4">Create a company to start building PRDs</p>
                <button onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-indigo-300/40 transition-all">
                  <Plus size={14} /> Add Company
                </button>
              </motion.div>
            ) : prdsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <PRDSkeleton key={i} />)}
              </div>
            ) : prds.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-16 rounded-2xl bg-white border-2 border-dashed border-slate-300 shadow-sm">
                <FileText size={36} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium mb-4">No PRDs yet for {selectedCompany.name}</p>
                <button onClick={() => setScreen('setup')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-indigo-300/40 transition-all">
                  <Plus size={14} /> Create First PRD
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {prds.map((prd, idx) => (
                  <motion.div key={prd.id}
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                    className="rounded-2xl p-5 bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300/60 transition-all group cursor-default">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <FileText size={15} className="text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 text-sm truncate">{prd.product_name}</h3>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">COMPLETED</span>
                        </div>
                      </div>
                      <button onClick={() => prd.id && handleDeletePRD(prd.id)} disabled={deletingId === prd.id}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {prd.created_at && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                        <Calendar size={10} />
                        {new Date(prd.created_at).toLocaleDateString()}
                      </div>
                    )}
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">{prd.prd_content?.substring(0, 120) || 'No content'}…</p>
                    <button onClick={() => handleViewPRD(prd)}
                      className="w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all text-indigo-600 hover:text-indigo-800 bg-indigo-50/60 hover:bg-indigo-100 border border-indigo-200/60 hover:border-indigo-300">
                      View PRD →
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddCompanyModal
          onClose={() => setShowAddModal(false)}
          onCreated={(c) => { setSelectedCompany(c); setShowAddModal(false); }}
        />
      )}
    </div>
  );
}
