export type Screen =
  | 'landing'
  | 'auth'
  | 'company-setup'
  | 'dashboard'
  | 'setup'
  | 'generating'
  | 'refine'
  | 'completeness'
  | 'disc-setup'
  | 'discussion'
  | 'export';

export interface User {
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface Company {
  id?: string;
  user_id?: string;
  name: string;
  industry?: string;
  stage?: string;
  size?: string;
  website?: string;
  description?: string;
  context?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductContext {
  productName: string;
  stage: 'pre-launch' | 'early-traction' | 'growth' | 'scale';
  description: string;
  targetUsers: string;
  businessModel: string;
  competitors: string;
  companyGoals: string;
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  order: number;
  focus: string;
  avatar?: string;
}

export type PersonaStatus = 'pending' | 'active' | 'approved' | 'skipped';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface Conversation {
  [personaId: string]: Message[];
}

export interface CompletenessSection {
  name: string;
  score: number;
  status: 'strong' | 'needs_work' | 'weak';
  issue: string;
}

export interface CompletenessResult {
  score: number;
  verdict: 'READY' | 'NOT_READY';
  summary: string;
  sections: CompletenessSection[];
  blockers: string[];
  suggestions: string[];
}

export interface PRDVersion {
  version: number;
  date: string;
  summary: string;
}

export interface SavedPRD {
  id?: string;
  user_id: string;
  company_id?: string;
  product_name: string;
  prd_content: string;
  version: number;
  created_at?: string;
  updated_at?: string;
}

export interface Toast {
  id: string;
  type: 'error' | 'success' | 'warning';
  message: string;
}
