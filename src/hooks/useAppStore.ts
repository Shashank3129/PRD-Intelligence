import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Screen,
  User,
  Company,
  Product,
  ProductContext,
  Persona,
  PersonaStatus,
  Conversation,
  PRDVersion,
  Toast
} from '@/types';
import { PERSONAS } from '@/constants';

interface AppState {
  // Navigation
  screen: Screen;
  setScreen: (screen: Screen) => void;
  
  // User
  user: User | null;
  setUser: (user: User | null) => void;
  clearSession: () => void;

  // Companies
  companies: Company[];
  selectedCompany: Company | null;
  setCompanies: (companies: Company[]) => void;
  setSelectedCompany: (company: Company | null) => void;
  addCompany: (company: Company) => void;
  updateCompany: (company: Company) => void;
  deleteCompany: (companyId: string) => void;

  // Products
  products: Product[];
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;

  // Product Context
  productCtx: ProductContext | null;
  setProductCtx: (ctx: ProductContext | null) => void;

  // Feature Idea
  idea: string;
  setIdea: (idea: string) => void;

  // PRD
  prd: string;
  setPrd: (prd: string) => void;
  currentPrdId: string | null;
  setCurrentPrdId: (prdId: string | null) => void;
  prdVersion: number;
  setPrdVersion: (version: number) => void;
  prdVersions: PRDVersion[];
  addPrdVersion: (version: PRDVersion) => void;
  
  // Personas
  selectedPersonas: Persona[];
  setSelectedPersonas: (personas: Persona[]) => void;
  togglePersona: (persona: Persona) => void;
  personaStatuses: Record<string, PersonaStatus>;
  setPersonaStatus: (personaId: string, status: PersonaStatus) => void;
  resetPersonaStatuses: () => void;
  
  // Conversations
  conversations: Conversation;
  addMessage: (personaId: string, message: { role: 'user' | 'assistant'; content: string }) => void;
  clearConversation: (personaId: string) => void;
  
  // PRD Updates from discussions
  prdDeltaCount: number;
  incrementPrdDelta: () => void;
  resetDiscussionState: () => void;
  
  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  
  // Reset all state
  reset: () => void;
}

const initialState = {
  screen: 'landing' as Screen,
  user: null as User | null,
  companies: [] as Company[],
  selectedCompany: null as Company | null,
  products: [] as Product[],
  productCtx: null as ProductContext | null,
  idea: '',
  prd: '',
  currentPrdId: null as string | null,
  prdVersion: 1,
  prdVersions: [] as PRDVersion[],
  selectedPersonas: PERSONAS.filter(p => ['eng', 'design', 'legal', 'ceo'].includes(p.id)),
  personaStatuses: {} as Record<string, PersonaStatus>,
  conversations: {} as Conversation,
  prdDeltaCount: 0,
  toasts: [] as Toast[]
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setScreen: (screen) => set({ screen }),
      
      setUser: (user) => set({ user }),

      clearSession: () => set((state) => ({
        ...initialState,
        screen: 'landing',
        toasts: state.toasts
      })),

      setCompanies: (companies) => set({ companies }),

      setSelectedCompany: (selectedCompany) => set({ selectedCompany }),

      addCompany: (company) => set((state) => ({
        companies: [...state.companies, company]
      })),

      updateCompany: (company) => set((state) => ({
        companies: state.companies.map(c => c.id === company.id ? company : c)
      })),

      deleteCompany: (companyId) => set((state) => ({
        companies: state.companies.filter(c => c.id !== companyId),
        selectedCompany: state.selectedCompany?.id === companyId ? null : state.selectedCompany
      })),

      setProducts: (products) => set({ products }),
      addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
      deleteProduct: (productId) => set((state) => ({ products: state.products.filter(p => p.id !== productId) })),

      setProductCtx: (productCtx) => set({ productCtx }),

      setIdea: (idea) => set({ idea }),
      
      setPrd: (prd) => set({ prd }),

      setCurrentPrdId: (currentPrdId) => set({ currentPrdId }),
      
      setPrdVersion: (prdVersion) => set({ prdVersion }),
      
      addPrdVersion: (version) => set((state) => ({ 
        prdVersions: [...state.prdVersions, version] 
      })),
      
      setSelectedPersonas: (selectedPersonas) => set({ selectedPersonas }),
      
      togglePersona: (persona) => set((state) => {
        const exists = state.selectedPersonas.find(p => p.id === persona.id);
        if (exists) {
          return { 
            selectedPersonas: state.selectedPersonas.filter(p => p.id !== persona.id) 
          };
        }
        return { 
          selectedPersonas: [...state.selectedPersonas, persona].sort((a, b) => a.order - b.order) 
        };
      }),
      
      setPersonaStatus: (personaId, status) => set((state) => ({
        personaStatuses: { ...state.personaStatuses, [personaId]: status }
      })),
      
      resetPersonaStatuses: () => set({ personaStatuses: {} }),
      
      addMessage: (personaId, message) => set((state) => ({
        conversations: {
          ...state.conversations,
          [personaId]: [
            ...(state.conversations[personaId] || []),
            { ...message, timestamp: Date.now() }
          ]
        }
      })),
      
      clearConversation: (personaId) => set((state) => ({
        conversations: {
          ...state.conversations,
          [personaId]: []
        }
      })),
      
      incrementPrdDelta: () => set((state) => ({
        prdDeltaCount: state.prdDeltaCount + 1
      })),

      resetDiscussionState: () => set({
        conversations: {},
        personaStatuses: {},
        prdDeltaCount: 0
      }),
      
      addToast: (toast) => {
        const id = Math.random().toString(36).substring(7);
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }]
        }));
        setTimeout(() => {
          get().removeToast(id);
        }, toast.type === 'error' ? 5000 : toast.type === 'warning' ? 4000 : 3000);
      },
      
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      })),
      
      reset: () => set({
        ...initialState,
        screen: 'setup'
      })
    }),
    {
      name: 'prd-intelligence-storage',
      partialize: (state) => ({
        screen: state.screen,
        user: state.user,
        companies: state.companies,
        selectedCompany: state.selectedCompany,
        products: state.products,
        productCtx: state.productCtx,
        idea: state.idea,
        prd: state.prd,
        currentPrdId: state.currentPrdId,
        prdVersion: state.prdVersion,
        prdVersions: state.prdVersions
      })
    }
  )
);
