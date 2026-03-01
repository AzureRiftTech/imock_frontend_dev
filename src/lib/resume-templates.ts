export type TemplateId  = 'classic' | 'modern' | 'executive' | 'minimal' | 'creative' | 'tech' | 'nexus' | 'corporate' | 'spectrum' | 'prestige'
export type PlanTier    = 'basic' | 'pro' | 'enterprise'

export const TIER_LEVEL: Record<PlanTier, number> = { basic: 0, pro: 1, enterprise: 2 }

export interface TemplateMeta {
  id: TemplateId
  name: string
  desc: string
  tier: PlanTier
  /** Primary accent colour for mini-preview */
  accent: string
  /** Background colour of mini-preview header area */
  headerBg: string
  /** Header text colour */
  headerText: string
  /** Body background */
  bodyBg: string
  /** Whether the layout has a dark sidebar (two-column) */
  hasSidebar: boolean
  /** Sidebar background (only if hasSidebar) */
  sidebarBg?: string
  icon: string
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: 'classic',
    name: 'Classic',
    desc: 'Timeless serif layout',
    tier: 'basic',
    accent: '#DC2626',
    headerBg: '#fff',
    headerText: '#111827',
    bodyBg: '#fff',
    hasSidebar: false,
    icon: '📄',
  },
  {
    id: 'modern',
    name: 'Modern',
    desc: 'Clean indigo accent header',
    tier: 'basic',
    accent: '#4F46E5',
    headerBg: '#EEF2FF',
    headerText: '#1E1B4B',
    bodyBg: '#fff',
    hasSidebar: false,
    icon: '🔷',
  },
  {
    id: 'executive',
    name: 'Executive',
    desc: 'Dark sidebar, amber accents',
    tier: 'basic',
    accent: '#B45309',
    headerBg: '#1E293B',
    headerText: '#F1F5F9',
    bodyBg: '#fff',
    hasSidebar: true,
    sidebarBg: '#1E293B',
    icon: '🌑',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    desc: 'Ultra-clean ATS-optimised',
    tier: 'basic',
    accent: '#6B7280',
    headerBg: '#fff',
    headerText: '#111827',
    bodyBg: '#fff',
    hasSidebar: false,
    icon: '⬜',
  },
  {
    id: 'creative',
    name: 'Creative',
    desc: 'Bold teal gradient header',
    tier: 'pro',
    accent: '#0D9488',
    headerBg: '#0D9488',
    headerText: '#fff',
    bodyBg: '#fff',
    hasSidebar: false,
    icon: '🎨',
  },
  {
    id: 'tech',
    name: 'Tech',
    desc: 'Developer-centric dark sidebar',
    tier: 'pro',
    accent: '#10B981',
    headerBg: '#0F172A',
    headerText: '#F8FAFC',
    bodyBg: '#fff',
    hasSidebar: true,
    sidebarBg: '#0F172A',
    icon: '💻',
  },
  {
    id: 'nexus',
    name: 'Nexus',
    desc: 'Equal two-column cards',
    tier: 'pro',
    accent: '#7C3AED',
    headerBg: '#FAFAFA',
    headerText: '#1F2937',
    bodyBg: '#FAFAFA',
    hasSidebar: false,
    icon: '⚡',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    desc: 'Formal navy banking style',
    tier: 'enterprise',
    accent: '#1D4ED8',
    headerBg: '#1E3A8A',
    headerText: '#FFFFFF',
    bodyBg: '#fff',
    hasSidebar: false,
    icon: '🏛️',
  },
  {
    id: 'spectrum',
    name: 'Spectrum',
    desc: 'Colourful skill timeline',
    tier: 'enterprise',
    accent: '#EC4899',
    headerBg: '#fff',
    headerText: '#111827',
    bodyBg: '#fff',
    hasSidebar: false,
    icon: '🌈',
  },
  {
    id: 'prestige',
    name: 'Prestige',
    desc: 'Black & gold luxury edition',
    tier: 'enterprise',
    accent: '#D97706',
    headerBg: '#111827',
    headerText: '#D97706',
    bodyBg: '#111827',
    hasSidebar: false,
    icon: '👑',
  },
]
