import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Globe,
  Building2,
  ChevronDown,
  Trash2,
  FileText,
  Calendar
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { getCompanyPRDs, getUserCompanies, deletePRD, deleteCompany, updateProfileCompany } from '@/services/supabase';
import { supabase } from '@/services/supabase';
import type { Company, SavedPRD } from '@/types';
import { UserMenu } from '@/components/UserMenu';

export function DashboardPage() {
  const {
    user,
    companies,
    selectedCompany,
    setCompanies,
    setSelectedCompany,
    setScreen,
    addToast
  } = useAppStore();

  const [prds, setPrds] = useState<SavedPRD[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCompanySwitcher, setShowCompanySwitcher] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingCompanyId, setDeletingCompanyId] = useState<string | null>(null);

  // Only refetch companies when empty — App.tsx pre-loads them on sign-in.
  useEffect(() => {
    if (companies.length > 0 || !user?.email) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        // getSession() reads from localStorage — no network round-trip.
        // getUser() makes a server call every time and hangs the spinner.
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) throw new Error('No active session');
        const userCompanies = await getUserCompanies(session.user.id);
        if (cancelled) return;
        setCompanies(userCompanies);
        if (!selectedCompany && userCompanies.length > 0) {
          setSelectedCompany(userCompanies[0]);
        }
      } catch (error) {
        console.error('Failed to load companies:', error);
        addToast({ type: 'error', message: 'Failed to load companies. Please refresh.' });
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  useEffect(() => {
    const loadPRDs = async () => {
      if (!selectedCompany?.id) {
        setPrds([]);
        return;
      }

      try {
        const companyPrds = await getCompanyPRDs(selectedCompany.id);
        setPrds(companyPrds);
      } catch (error) {
        console.error('Failed to load PRDs:', error);
        addToast({ type: 'error', message: 'Failed to load PRDs' });
      }
    };

    loadPRDs();
  }, [selectedCompany?.id, addToast]);

  const handleSelectCompany = async (company: Company) => {
    setSelectedCompany(company);
    setShowCompanySwitcher(false);

    if (user?.email) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.id) {
          await updateProfileCompany(authUser.id, companies[0]?.id, company.id);
        }
      } catch (error) {
        console.error('Failed to update profile company:', error);
      }
    }
  };

  const handleDeletePRD = async (prdId: string) => {
    if (!confirm('Are you sure you want to delete this PRD? This action cannot be undone.')) {
      return;
    }

    setDeletingId(prdId);
    try {
      await deletePRD(prdId);
      setPrds(prev => prev.filter(p => p.id !== prdId));
      addToast({ type: 'success', message: 'PRD deleted successfully' });
    } catch (error) {
      console.error('Failed to delete PRD:', error);
      addToast({ type: 'error', message: 'Failed to delete PRD' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCompany = async () => {
    if (!selectedCompany?.id) return;
    const name = selectedCompany.name;
    if (!confirm(`Delete "${name}" and all its PRDs? This cannot be undone.`)) return;

    setDeletingCompanyId(selectedCompany.id);
    try {
      await deleteCompany(selectedCompany.id);
      const remaining = companies.filter(c => c.id !== selectedCompany.id);
      setCompanies(remaining);

      if (remaining.length === 0) {
        setSelectedCompany(null);
        addToast({ type: 'success', message: `${name} deleted` });
        setScreen('company-setup');
      } else {
        setSelectedCompany(remaining[0]);
        addToast({ type: 'success', message: `${name} deleted` });
      }
    } catch (error) {
      console.error('Failed to delete company:', error);
      addToast({ type: 'error', message: 'Failed to delete company' });
    } finally {
      setDeletingCompanyId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Dashboard</h1>
            <p className="text-slate-600 text-sm">Manage your companies and PRDs</p>
          </motion.div>
          <UserMenu className="h-11 w-11 rounded-2xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative mb-8 flex items-center gap-2"
          style={{ zIndex: 50 }}
        >
          <div className="relative flex-1 max-w-xs">
            <button
              onClick={() => setShowCompanySwitcher(!showCompanySwitcher)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border-2 border-slate-200 hover:border-indigo-300 transition-colors w-full"
            >
              <Building2 size={20} className="text-indigo-600" />
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{selectedCompany?.name || 'No company'}</p>
                <p className="text-xs text-slate-500 truncate">{selectedCompany?.industry}</p>
              </div>
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform ${showCompanySwitcher ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {showCompanySwitcher && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-lg z-50"
                >
                  {companies.map(company => (
                    <button
                      key={company.id}
                      onClick={() => handleSelectCompany(company)}
                      className={`w-full text-left px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors ${
                        selectedCompany?.id === company.id ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <p className="font-medium text-slate-900">{company.name}</p>
                      <p className="text-xs text-slate-500">{company.industry}</p>
                    </button>
                  ))}
                  <button
                    onClick={() => { setShowCompanySwitcher(false); setScreen('company-setup'); }}
                    className="w-full text-left px-4 py-3 border-t border-slate-100 text-indigo-600 hover:bg-indigo-50 transition-colors font-medium text-sm flex items-center gap-2"
                  >
                    <Plus size={14} /> Add new company
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleDeleteCompany}
            disabled={!selectedCompany?.id || deletingCompanyId === selectedCompany?.id}
            title="Delete company"
            className="p-3 rounded-xl bg-white border-2 border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 size={18} />
          </button>
        </motion.div>

        {selectedCompany && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl p-6 mb-8 relative"
            style={{ zIndex: 1 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedCompany.name}</h2>
                <div className="space-y-2 text-sm text-slate-700">
                  {selectedCompany.industry && (
                    <p>
                      <span className="font-medium">Industry:</span> {selectedCompany.industry}
                    </p>
                  )}
                  {selectedCompany.size && (
                    <p>
                      <span className="font-medium">Size:</span> {selectedCompany.size}
                    </p>
                  )}
                  {selectedCompany.website && (
                    <p>
                      <span className="font-medium">Website:</span>{' '}
                      <a
                        href={selectedCompany.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                      >
                        {selectedCompany.website} <Globe size={14} />
                      </a>
                    </p>
                  )}
                </div>
              </div>

              <div>
                {selectedCompany.description && (
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs font-medium text-slate-600 mb-2">DESCRIPTION</p>
                    <p className="text-sm text-slate-700 line-clamp-4">{selectedCompany.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setScreen('setup')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus size={16} />
                Create PRD
              </button>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Your PRDs ({prds.length})
          </h2>

          {prds.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
              <FileText size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600 font-medium mb-4">No PRDs yet</p>
              <p className="text-slate-500 text-sm mb-6">
                Create your first PRD to get started
              </p>
              <button
                onClick={() => setScreen('setup')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus size={16} />
                Create First PRD
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prds.map((prd, index) => (
                <motion.div
                  key={prd.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1 line-clamp-2">
                        {prd.product_name}
                      </h3>
                      {prd.version && (
                        <p className="text-xs text-slate-500">v{prd.version}</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (prd.id) handleDeletePRD(prd.id);
                      }}
                      disabled={deletingId === prd.id}
                      className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {prd.created_at && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                      <Calendar size={14} />
                      {new Date(prd.created_at).toLocaleDateString()}
                    </div>
                  )}

                  <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                    {prd.prd_content ? `${prd.prd_content.substring(0, 150)}...` : 'No content available.'}
                  </p>

                  <button
                    onClick={() => {
                      addToast({ type: 'warning', message: 'PRD loading not yet implemented' });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-medium hover:bg-indigo-100 transition-colors"
                  >
                    View PRD
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
