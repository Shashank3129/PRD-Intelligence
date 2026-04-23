import { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useAppStore } from '@/hooks/useAppStore';
import {
  ArrowLeft, ArrowRight, Check, Sparkles, Lightbulb, Building,
  TrendingUp, Zap, Info, AlertCircle, Plus,
  Box, Diamond, Hexagon, CircleDot,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
interface Company {
  id: string;
  name: string;
  description: string;
  industry: string;
  goals: string;
  targetMarket: string;
  businessModel: string;
  competitors: string[];
  createdAt: string;
  aiContextGenerated: boolean;
}

interface Product {
  id: string;
  companyId: string;
  name: string;
  stage: string;
  description: string;
  targetUsers: string;
  businessModel: string;
  competitors: string;
  companyGoals: string;
  createdAt: string;
  type?: string;
  status?: string;
}

interface PRD {
  id: string;
  productId: string;
  companyId: string;
  productName: string;
  idea: string;
  content: string;
  status: 'generating' | 'completed';
  createdAt: string;
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
function hasEnoughWords(text: string, min: number): boolean {
  return text.trim().split(/\s+/).filter(w => w.length >= 2).length >= min;
}

function isGibberish(text: string): boolean {
  const letters = (text.match(/[a-zA-Z]/g) || []).length;
  if (letters < 4) return false;
  const vowels = (text.match(/[aeiouAEIOU]/g) || []).length;
  if (vowels / letters < 0.12) return true;
  const uniqueChars = new Set(text.toLowerCase().replace(/[\s\W]/g, '')).size;
  if (uniqueChars <= 3 && letters > 6) return true;
  return false;
}

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function statusDotColor(status?: string): string {
  if (status === 'active') return 'bg-emerald-400';
  if (status === 'beta') return 'bg-amber-400';
  return 'bg-slate-400';
}



/* ═══════════════════════════════════════════════════════════════
   STORAGE
   ═══════════════════════════════════════════════════════════════ */
const STORAGE_KEYS = {
  companies: 'prd_companies',
  products: 'prd_products',
  prds: 'prd_prds',
  lastCompany: 'prd_last_company'
};

function getCompanies(): Company[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.companies) || '[]'); } 
  catch { return []; }
}

function saveCompanies(companies: Company[]) {
  localStorage.setItem(STORAGE_KEYS.companies, JSON.stringify(companies));
}

function getProducts(): Product[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.products) || '[]'); } 
  catch { return []; }
}

function saveProducts(products: Product[]) {
  localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
}

function getPRDs(): PRD[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.prds) || '[]'); } 
  catch { return []; }
}

function savePRDs(prds: PRD[]) {
  localStorage.setItem(STORAGE_KEYS.prds, JSON.stringify(prds));
}

/* ═══════════════════════════════════════════════════════════════
   ANIMATED BACKGROUND
   ═══════════════════════════════════════════════════════════════ */
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Large gradient orbs */}
      <motion.div 
        className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full"
        style={{ 
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)',
          filter: 'blur(80px)'
        }}
        animate={{ 
          scale: [1, 1.3, 1],
          x: [0, 60, 0],
          y: [0, 40, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute top-[30%] -right-[10%] w-[40vw] h-[40vw] rounded-full"
        style={{ 
          background: 'radial-gradient(circle, rgba(34,211,238,0.1) 0%, rgba(59,130,246,0.05) 40%, transparent 70%)',
          filter: 'blur(80px)'
        }}
        animate={{ 
          scale: [1, 1.2, 1],
          y: [0, -80, 0],
          x: [0, -40, 0]
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div 
        className="absolute -bottom-[10%] left-[20%] w-[45vw] h-[45vw] rounded-full"
        style={{ 
          background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, rgba(99,102,241,0.04) 40%, transparent 70%)',
          filter: 'blur(100px)'
        }}
        animate={{ 
          scale: [1, 1.15, 1],
          x: [0, 80, 0],
          y: [0, -60, 0]
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />
      
      {/* Floating geometric shapes */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ 
            left: `${5 + (i * 6.3) % 90}%`, 
            top: `${5 + (i * 11) % 90}%`,
          }}
          animate={{ 
            y: [0, -30 - (i % 4) * 15, 0],
            x: [0, (i % 2 === 0 ? 15 : -15), 0],
            rotate: [0, 180, 360],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{ 
            duration: 5 + i * 0.7, 
            repeat: Infinity, 
            delay: i * 0.4,
            ease: "easeInOut"
          }}
        >
          {i % 3 === 0 ? (
            <Hexagon className="w-4 h-4 text-indigo-400/40" />
          ) : i % 3 === 1 ? (
            <Diamond className="w-3 h-3 text-cyan-400/40" />
          ) : (
            <CircleDot className="w-3 h-3 text-violet-400/40" />
          )}
        </motion.div>
      ))}

      {/* Subtle grid */}
      <div 
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.4) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3D GLASS CARD
   ═══════════════════════════════════════════════════════════════ */
function GlassCard({ children, className = "", delay = 0 }: { 
  children: React.ReactNode; 
  className?: string; 
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, rotateX: -10 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ 
        y: -6, 
        rotateX: 3,
        rotateY: 2,
        scale: 1.01,
        transition: { duration: 0.3 }
      }}
      style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
      className={`relative bg-white/60 backdrop-blur-2xl border border-white/60 rounded-2xl shadow-lg shadow-slate-200/20 overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/40 to-indigo-50/20 pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FORM FIELD - Clean label above input, no overlap
   ═══════════════════════════════════════════════════════════════ */
function FormField({ 
  label, 
  value, 
  onChange, 
  error, 
  touched, 
  placeholder, 
  type = "text",
  disabled = false,
  onKeyDown,
  rows,
  required = false,
  className = ""
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  touched?: boolean;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  rows?: number;
  required?: boolean;
  className?: string;
}) {
  const borderColor = error 
    ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
    : touched 
      ? 'border-emerald-300 focus:border-indigo-500 focus:ring-indigo-100'
      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100';

  const inputClasses = `w-full px-4 py-3 rounded-xl border-2 bg-white/80 backdrop-blur-sm transition-all duration-200 outline-none text-sm text-slate-800 placeholder:text-slate-400 ${borderColor} hover:border-indigo-200 shadow-sm`;

  return (
    <div className={`${className}`}>
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {rows ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={`${inputClasses} resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
        />
      )}
      <AnimatePresence>
        {error && (
          <motion.p 
            className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-medium"
            initial={{ opacity: 0, y: -3 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -3 }}
          >
            <AlertCircle className="w-3 h-3" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
type View = 'create-product' | 'create-prd';

export function SetupPage() {
  const {
    setScreen,
    setProductCtx,
    productCtx,
    setIdea,
    idea,
    selectedCompany,
    products,
    addProduct,
    setCurrentPrdId,
    setPrdVersion
  } = useAppStore();

  /* ─── Core State ─── */
  const [view, setView] = useState<View>('create-prd');
  const companyProducts = products.filter(p => p.companyId === selectedCompany?.id);
  const [selectedProductIdForPRD, setSelectedProductIdForPRD] = useState<string | null>(null);
  const [productFormData, setProductFormData] = useState({
    productName: '',
    stage: 'early-traction',
    description: '',
    targetUsers: '',
    businessModel: '',
    competitors: '',
    companyGoals: ''
  });

  /* ─── UI State ─── */
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shake, setShake] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /* ─── PRD Flow ─── */
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    productName: productCtx?.productName || '',
    stage: productCtx?.stage || 'early-traction',
    description: productCtx?.description || '',
    targetUsers: productCtx?.targetUsers || '',
    businessModel: productCtx?.businessModel || '',
    competitors: productCtx?.competitors || '',
    companyGoals: productCtx?.companyGoals || '',
    idea: idea || ''
  });

  /* ─── Product Actions ─── */
  const handleCreateProduct = () => {
    const newErrors: Record<string, string> = {};
    if (!productFormData.productName.trim()) newErrors.productName = 'Product name is required';
    else if (productFormData.productName.length < 2) newErrors.productName = 'At least 2 characters';
    else if (isGibberish(productFormData.productName)) newErrors.productName = 'Enter a real product name';
    if (!productFormData.description.trim()) newErrors.description = 'Description is required';
    else if (productFormData.description.length < 20) newErrors.description = 'At least 20 characters';
    else if (!hasEnoughWords(productFormData.description, 4)) newErrors.description = 'Use at least 4 words';
    if (!productFormData.targetUsers.trim()) newErrors.targetUsers = 'Target users required';
    else if (!hasEnoughWords(productFormData.targetUsers, 2)) newErrors.targetUsers = 'Use at least 2 words';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }

    const newProduct: Product = {
      id: generateId(),
      companyId: selectedCompany?.id || '',
      name: productFormData.productName,
      stage: productFormData.stage,
      description: productFormData.description,
      targetUsers: productFormData.targetUsers,
      businessModel: productFormData.businessModel,
      competitors: productFormData.competitors,
      companyGoals: productFormData.companyGoals,
      createdAt: new Date().toISOString()
    };
    addProduct(newProduct);
    setErrors({});
    setView('create-prd');
  };

  /* ─── Validation ─── */
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.productName.trim()) newErrors.productName = 'Product name is required';
    else if (formData.productName.length < 2) newErrors.productName = 'Product name must be at least 2 characters';
    else if (isGibberish(formData.productName)) newErrors.productName = 'Please enter a real product name';

    if (!formData.description.trim()) newErrors.description = 'Description is required';
    else if (formData.description.length < 20) newErrors.description = 'Description must be at least 20 characters';
    else if (!hasEnoughWords(formData.description, 4)) newErrors.description = 'Please use at least 4 words';
    else if (isGibberish(formData.description)) newErrors.description = 'Please enter a meaningful description';

    if (!formData.targetUsers.trim()) newErrors.targetUsers = 'Target users are required';
    else if (!hasEnoughWords(formData.targetUsers, 2)) newErrors.targetUsers = 'Please describe in at least 2 words';
    else if (isGibberish(formData.targetUsers)) newErrors.targetUsers = 'Please enter a meaningful description';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.idea.trim()) newErrors.idea = 'Please describe your feature idea';
    else if (formData.idea.length < 25) newErrors.idea = `Please provide more detail (${25 - formData.idea.length} more needed)`;
    else if (!hasEnoughWords(formData.idea, 5)) newErrors.idea = 'Please describe in at least 5 words';
    else if (isGibberish(formData.idea)) newErrors.idea = 'Please enter a meaningful description';
    else if (formData.idea.length > 2000) newErrors.idea = 'Feature idea must be under 2000 characters';
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
    return Object.keys(newErrors).length === 0;
  };

  /* ─── Flow Handlers ─── */
  const handleContinue = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
      setErrors({});
      setTouched({});
    }
  };

  const handleGenerate = () => {
    if (!validateStep2()) return;

    try {
      const existingProduct = products.find(p => p.id === selectedProductIdForPRD);
      const productToUse: Product = existingProduct ?? {
        id: generateId(),
        companyId: selectedCompany?.id || '',
        name: formData.productName,
        stage: formData.stage,
        description: formData.description,
        targetUsers: formData.targetUsers,
        businessModel: formData.businessModel,
        competitors: formData.competitors,
        companyGoals: formData.companyGoals,
        createdAt: new Date().toISOString()
      };

      if (!existingProduct) addProduct(productToUse);

      setProductCtx({
        productName: productToUse.name,
        stage: productToUse.stage as 'pre-launch' | 'early-traction' | 'growth' | 'scale',
        description: productToUse.description,
        targetUsers: productToUse.targetUsers,
        businessModel: productToUse.businessModel,
        competitors: productToUse.competitors,
        companyGoals: productToUse.companyGoals
      });
      setIdea(formData.idea);
      setCurrentPrdId(null);
      setPrdVersion(1);
      setFormData({ productName: '', stage: 'early-traction', description: '', targetUsers: '', businessModel: '', competitors: '', companyGoals: '', idea: '' });
      setStep(1);
      setSelectedProductIdForPRD(null);
      setScreen('generating');
    } catch (error) {
      console.error('Error initiating PRD generation:', error);
      setErrors({ submit: 'Failed to start generation. Please try again.' });
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setErrors({});
      setTouched({});
    } else {
      setScreen('dashboard');
      setErrors({});
      setTouched({});
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateProductField = (field: string, value: string) => {
    setProductFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    if (errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const startNewProduct = () => {
    setProductFormData({
      productName: '', stage: 'early-traction', description: '',
      targetUsers: '', businessModel: '', competitors: '',
      companyGoals: ''
    });
    setErrors({});
    setTouched({});
    setView('create-product');
  };

  const ideaReady = formData.idea.length >= 25;

  const stageOptions = [
    { value: 'pre-launch', label: 'Pre-launch', icon: Lightbulb, desc: 'Idea validation' },
    { value: 'early-traction', label: 'Early traction', icon: Zap, desc: 'First users' },
    { value: 'growth', label: 'Growth', icon: TrendingUp, desc: 'Scaling up' },
    { value: 'scale', label: 'Scale', icon: Building, desc: 'Enterprise ready' },
  ];


  /* ═══════════════════════════════════════════════════════════════
     RENDER: CREATE PRODUCT
     ═══════════════════════════════════════════════════════════════ */
  if (view === 'create-product') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 relative overflow-hidden">
        <AnimatedBackground />
        <motion.div className={`relative z-10 py-10 px-4 ${shake ? 'animate-error-shake' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="max-w-2xl mx-auto">
            <motion.div className="flex items-center gap-3 mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
              <motion.button onClick={() => setScreen('dashboard')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold px-3 py-2 rounded-xl bg-white/60 border border-slate-200 hover:bg-white transition-all text-sm"
                whileHover={{ scale: 1.03, x: -2 }} whileTap={{ scale: 0.97 }}>
                <ArrowLeft className="w-4 h-4" /> Back
              </motion.button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Add Product</h1>
                <p className="text-sm text-slate-500">for <span className="font-semibold text-indigo-600">{selectedCompany?.name}</span></p>
              </div>
            </motion.div>

            <GlassCard>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    label="Product Name"
                    value={productFormData.productName}
                    onChange={(val) => updateProductField('productName', val)}
                    error={errors.productName}
                    touched={touched.productName}
                    placeholder="e.g., Acme CRM"
                    required
                  />
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Stage</label>
                    <div className="grid grid-cols-2 gap-2">
                      {stageOptions.map(option => (
                        <button key={option.value} type="button"
                          onClick={() => updateProductField('stage', option.value)}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                            productFormData.stage === option.value
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-slate-200 text-slate-600 hover:border-indigo-300 bg-white/50'
                          }`}>
                          <option.icon className={`w-4 h-4 ${productFormData.stage === option.value ? 'text-indigo-500' : 'text-slate-400'}`} />
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <FormField
                  label="What it does & who it's for"
                  value={productFormData.description}
                  onChange={(val) => updateProductField('description', val)}
                  error={errors.description}
                  touched={touched.description}
                  placeholder="Describe your product in 2-3 sentences..."
                  rows={3}
                  required
                />

                <FormField
                  label="Target Users"
                  value={productFormData.targetUsers}
                  onChange={(val) => updateProductField('targetUsers', val)}
                  error={errors.targetUsers}
                  touched={touched.targetUsers}
                  placeholder="e.g., Sales teams at mid-market SaaS companies"
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    label="Business Model"
                    value={productFormData.businessModel}
                    onChange={(val) => updateProductField('businessModel', val)}
                    placeholder="e.g., SaaS subscription"
                  />
                  <FormField
                    label="Key Competitors"
                    value={productFormData.competitors}
                    onChange={(val) => updateProductField('competitors', val)}
                    placeholder="e.g., Salesforce, HubSpot"
                  />
                </div>

                <FormField
                  label="Company Goals"
                  value={productFormData.companyGoals}
                  onChange={(val) => updateProductField('companyGoals', val)}
                  placeholder="e.g., Reach $10M ARR, expand to enterprise"
                />

                <div className="flex justify-end pt-2">
                  <motion.button onClick={handleCreateProduct}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-300/30 hover:bg-indigo-700 transition-all text-sm"
                    whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}>
                    <Check className="w-4 h-4" /> Save Product
                  </motion.button>
                </div>
              </div>
            </GlassCard>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER: CREATE PRD
     ═══════════════════════════════════════════════════════════════ */
  if (view === 'create-prd') {
    const selectedProduct = products.find(p => p.id === selectedProductIdForPRD);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 relative overflow-hidden">
        <AnimatedBackground />
        <motion.div className={`relative z-10 py-8 px-4 ${shake ? 'animate-error-shake' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Company badge */}
          <motion.div className="flex items-center justify-center mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-xl border border-slate-200 shadow-sm">
              <Building className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-bold text-slate-700">{selectedCompany?.name}</span>
            </div>
          </motion.div>

          <motion.div className="max-w-2xl mx-auto" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="text-center mb-6">
              <h1 className="font-bold text-2xl text-slate-900 mb-1">Create PRD</h1>
              <p className="text-slate-500 text-sm">{step === 1 ? 'Select a product' : 'Describe your feature idea'}</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {['Product', 'Feature Idea'].map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    step > i + 1 ? 'bg-emerald-100 text-emerald-700' :
                    step === i + 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-300/30' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {step > i + 1 ? <Check className="w-4 h-4" /> : <span>{i + 1}</span>}
                    {label}
                  </div>
                  {i < 1 && <div className={`w-6 h-0.5 rounded-full ${step > 1 ? 'bg-indigo-400' : 'bg-slate-200'}`} />}
                </div>
              ))}
            </div>

            <GlassCard>
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.div key="step1" className="space-y-4"
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>

                      {products.length > 0 && (
                        <div>
                          <p className="text-sm font-bold text-slate-700 mb-3">Select an existing product</p>
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {products.map(product => (
                              <button key={product.id} onClick={() => setSelectedProductIdForPRD(product.id)}
                                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                                  selectedProductIdForPRD === product.id
                                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                                    : 'border-slate-200 bg-white/50 hover:border-indigo-300 hover:bg-white'
                                }`}>
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center flex-shrink-0">
                                  <Box className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold text-slate-900 text-sm">{product.name}</p>
                                    {product.type && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-600 uppercase tracking-wide">{product.type}</span>
                                    )}
                                    {product.status && (
                                      <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor(product.status)}`} />
                                        {product.status}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 capitalize mt-0.5">{product.stage?.replace('-', ' ')} · {product.targetUsers?.substring(0, 40)}{product.targetUsers?.length > 40 ? '…' : ''}</p>
                                </div>
                                {selectedProductIdForPRD === product.id && <Check className="w-5 h-5 text-indigo-500 flex-shrink-0" />}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-slate-200" />
                            <span className="text-xs text-slate-400 font-medium">or</span>
                            <div className="flex-1 h-px bg-slate-200" />
                          </div>
                        </div>
                      )}

                      <button onClick={() => { setSelectedProductIdForPRD(null); startNewProduct(); }}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/40 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                          <Plus className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-indigo-700 text-sm">Add New Product</p>
                          <p className="text-xs text-indigo-500">Create a new product first</p>
                        </div>
                      </button>

                      {errors.product && <p className="text-red-500 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {errors.product}</p>}
                    </motion.div>
                  ) : (
                    <motion.div key="step2" className="space-y-5"
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

                      {selectedProduct && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center flex-shrink-0">
                            <Box className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-indigo-900">{selectedProduct.name}</p>
                            <p className="text-xs text-indigo-500 capitalize">{selectedProduct.stage?.replace('-', ' ')}</p>
                          </div>
                          <button onClick={() => setStep(1)} className="text-indigo-500 hover:text-indigo-700 text-xs font-semibold">Change</button>
                        </div>
                      )}

                      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Info className="w-4 h-4 text-indigo-600" />
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            <strong className="text-slate-800">Pro tip:</strong> Include the problem, who's affected, and any constraints. The more detail, the better your PRD.
                          </p>
                        </div>
                      </div>

                      <FormField
                        label="Feature Idea"
                        value={formData.idea}
                        onChange={(val) => updateField('idea', val)}
                        error={errors.idea}
                        touched={touched.idea}
                        placeholder="Describe the feature you want to build... What's the problem? Who has it? What should the solution do?"
                        rows={7}
                        required
                      />
                      
                      <div className="flex justify-between items-center">
                        {errors.idea && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.idea}</p>}
                        <div className="flex items-center gap-2 ml-auto">
                          <span className={`text-xs font-bold ${ideaReady ? 'text-emerald-600' : 'text-slate-400'}`}>{formData.idea.length} chars</span>
                          {ideaReady && <span className="text-xs text-emerald-600 flex items-center gap-1 font-bold bg-emerald-50 px-2 py-0.5 rounded-full"><Check className="w-3 h-3" /> Ready</span>}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                  <motion.button onClick={step === 2 ? () => setStep(1) : () => setScreen('dashboard')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-all text-sm"
                    whileHover={{ x: -3 }} whileTap={{ scale: 0.97 }}>
                    <ArrowLeft className="w-4 h-4" /> {step === 2 ? 'Back' : 'Dashboard'}
                  </motion.button>

                  {step === 1 ? (
                    <motion.button
                      onClick={() => {
                        if (!selectedProductIdForPRD) {
                          setErrors({ product: 'Please select a product or add a new one' });
                          return;
                        }
                        setErrors({});
                        setStep(2);
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-300/30 hover:bg-indigo-700 transition-all text-sm"
                      whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}>
                      Continue <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <motion.button onClick={handleGenerate} disabled={!ideaReady}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-300/30 hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                      whileHover={ideaReady ? { scale: 1.03, y: -1 } : {}} whileTap={ideaReady ? { scale: 0.97 } : {}}>
                      <Sparkles className="w-4 h-4" /> Generate PRD
                    </motion.button>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return null;
}
