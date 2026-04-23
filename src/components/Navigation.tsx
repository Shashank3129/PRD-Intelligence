import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/hooks/useAppStore';
import { Menu, X, Sparkles } from 'lucide-react';
import { UserMenu } from '@/components/UserMenu';

const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Personas', href: '#personas' },
];

export function Navigation() {
  const { setScreen, user } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4">
      <motion.div 
        className="max-w-7xl mx-auto glass rounded-2xl px-4 sm:px-6 py-3"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setScreen('landing')}
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-slate-900 hidden sm:block">
              PRD Intelligence
            </span>
          </motion.div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <motion.a
                key={item.label}
                href={item.href}
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
                whileHover={{ y: -2 }}
              >
                {item.label}
              </motion.a>
            ))}
          </div>
          
          {/* CTA */}
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => setScreen(user ? 'setup' : 'auth')}
              className="btn-3d text-sm py-2 px-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {user ? 'Dashboard' : 'Get Started'}
            </motion.button>

            {user && <UserMenu className="h-10 w-10 rounded-xl" />}
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="pt-4 pb-2 space-y-2">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block py-2 text-slate-600 hover:text-slate-900 font-medium"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </nav>
  );
}
