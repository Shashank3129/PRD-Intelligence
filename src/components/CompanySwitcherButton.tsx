import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { updateProfileCompany } from '@/services/supabase';
import { supabase } from '@/services/supabase';
import type { Company } from '@/types';

export function CompanySwitcherButton() {
  const { companies, selectedCompany, setSelectedCompany, user } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectCompany = async (company: Company) => {
    if (selectedCompany?.id === company.id) {
      setIsOpen(false);
      return;
    }

    // Show confirmation if there's unsaved work
    const { productCtx, idea } = useAppStore.getState();
    if (productCtx || idea) {
      const confirmed = confirm(
        'You have unsaved work. Switching companies will lose your progress. Continue?'
      );
      if (!confirmed) return;
    }

    setSelectedCompany(company);
    setIsOpen(false);

    // Update profile
    if (user?.email) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.id && companies.length > 0) {
          await updateProfileCompany(authUser.id, companies[0]?.id, company.id);
        }
      } catch (error) {
        console.error('Failed to update profile company:', error);
      }
    }
  };

  if (companies.length <= 1 || !selectedCompany) {
    return null;
  }

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border-2 border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 transition-colors shadow-sm"
        title="Switch company"
      >
        <Building2 size={16} />
        <span className="text-sm font-medium max-w-[120px] truncate hidden sm:inline">
          {selectedCompany.name}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 bg-white border-2 border-slate-200 rounded-lg shadow-lg z-50 min-w-[200px]"
          >
            {companies.map(company => (
              <button
                key={company.id}
                onClick={() => handleSelectCompany(company)}
                className={`w-full text-left px-4 py-2 border-b border-slate-100 last:border-b-0 text-sm hover:bg-slate-50 transition-colors ${
                  selectedCompany.id === company.id ? 'bg-indigo-50' : ''
                }`}
              >
                <p className="font-medium text-slate-900">{company.name}</p>
                <p className="text-xs text-slate-500">{company.industry}</p>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
