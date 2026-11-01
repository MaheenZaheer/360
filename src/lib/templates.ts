export type TemplateId = 'default' | 'warm' | 'dark' | 'vibrant' | 'minimal';

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  category: string;
  description: string;
  badge: string;
  previewColors: {
    bg: string;
    card: string;
    accent: string;
    text: string;
  };
  styles: {
    pageWrapper: string;
    headerIconWrapper: string;
    titleClass: string;
    descClass: string;
    websiteLink: string;
    cardWrapper: string;
    starActive: string;
    starInactive: string;
    ratingLabel: string;
    inputLabel: string;
    inputClass: string;
    textareaClass: string;
    buttonClass: string;
    footerClass: string;
    successIconWrapper: string;
    successTitle: string;
    successDesc: string;
  };
}

export const REVIEW_TEMPLATES: Record<TemplateId, TemplateDefinition> = {
  default: {
    id: 'default',
    name: 'Modern Indigo (Default)',
    category: 'Universal / SaaS',
    description: 'Crisp, contemporary aesthetic with white surfaces and indigo accents.',
    badge: 'Standard',
    previewColors: {
      bg: '#f8fafc',
      card: '#ffffff',
      accent: '#4f46e5',
      text: '#0f172a',
    },
    styles: {
      pageWrapper: 'min-h-screen bg-slate-50 text-slate-900',
      headerIconWrapper: 'bg-indigo-600 text-white shadow-indigo-100 shadow-lg',
      titleClass: 'text-gray-900',
      descClass: 'text-gray-600',
      websiteLink: 'text-indigo-600 hover:text-indigo-800',
      cardWrapper: 'bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 sm:p-8',
      starActive: 'fill-amber-400 text-amber-400',
      starInactive: 'text-gray-200 hover:text-amber-200',
      ratingLabel: 'text-gray-700',
      inputLabel: 'text-gray-700',
      inputClass: 'bg-white border-gray-300 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500',
      textareaClass: 'bg-white border-gray-300 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500',
      buttonClass: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 shadow-md',
      footerClass: 'text-gray-400',
      successIconWrapper: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      successTitle: 'text-gray-900',
      successDesc: 'text-gray-600',
    },
  },

  warm: {
    id: 'warm',
    name: 'Warm Dining & Cafe',
    category: 'Restaurants / Hospitality',
    description: 'Cozy terracotta and amber tones tailored for eateries, cafes, and hospitality.',
    badge: 'Hospitality',
    previewColors: {
      bg: '#fffbeb',
      card: '#ffffff',
      accent: '#ea580c',
      text: '#451a03',
    },
    styles: {
      pageWrapper: 'min-h-screen bg-gradient-to-b from-amber-50/80 via-orange-50/40 to-amber-50/80 text-amber-950',
      headerIconWrapper: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-orange-200 shadow-lg',
      titleClass: 'text-amber-950 font-serif',
      descClass: 'text-amber-800/80',
      websiteLink: 'text-orange-600 hover:text-orange-800',
      cardWrapper: 'bg-white/95 backdrop-blur-sm rounded-3xl border border-amber-200/70 shadow-lg shadow-amber-900/5 p-6 sm:p-8',
      starActive: 'fill-amber-500 text-amber-500',
      starInactive: 'text-amber-200 hover:text-amber-400',
      ratingLabel: 'text-amber-900 font-medium',
      inputLabel: 'text-amber-900 font-medium',
      inputClass: 'bg-amber-50/30 border-amber-200 text-amber-950 focus:ring-orange-500 focus:border-orange-500 placeholder:text-amber-400',
      textareaClass: 'bg-amber-50/30 border-amber-200 text-amber-950 focus:ring-orange-500 focus:border-orange-500 placeholder:text-amber-400',
      buttonClass: 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-orange-300/40 shadow-md',
      footerClass: 'text-amber-700/60',
      successIconWrapper: 'bg-amber-100 text-orange-600 border border-amber-200',
      successTitle: 'text-amber-950 font-serif',
      successDesc: 'text-amber-800',
    },
  },

  dark: {
    id: 'dark',
    name: 'Midnight Luxury',
    category: 'Nightlife / Tech / Premium',
    description: 'Sleek dark theme with gold stars and glowing violet accents for a luxury feel.',
    badge: 'Luxury Dark',
    previewColors: {
      bg: '#090d16',
      card: '#131b2e',
      accent: '#6366f1',
      text: '#f8fafc',
    },
    styles: {
      pageWrapper: 'min-h-screen bg-slate-950 text-slate-100',
      headerIconWrapper: 'bg-indigo-600 text-white shadow-indigo-900/50 shadow-xl border border-indigo-400/30',
      titleClass: 'text-white',
      descClass: 'text-slate-400',
      websiteLink: 'text-indigo-400 hover:text-indigo-300',
      cardWrapper: 'bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl p-6 sm:p-8',
      starActive: 'fill-amber-400 text-amber-400',
      starInactive: 'text-slate-700 hover:text-amber-400',
      ratingLabel: 'text-slate-200',
      inputLabel: 'text-slate-300',
      inputClass: 'bg-slate-950/80 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-indigo-500 focus:border-indigo-500',
      textareaClass: 'bg-slate-950/80 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-indigo-500 focus:border-indigo-500',
      buttonClass: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 shadow-lg border border-indigo-400/20',
      footerClass: 'text-slate-500',
      successIconWrapper: 'bg-slate-800 text-emerald-400 border border-slate-700',
      successTitle: 'text-white',
      successDesc: 'text-slate-300',
    },
  },

  vibrant: {
    id: 'vibrant',
    name: 'Fresh Mint & Wellness',
    category: 'Healthcare / Wellness / Retail',
    description: 'Refreshing emerald and teal palette evoking vitality, health, and trust.',
    badge: 'Wellness & Fresh',
    previewColors: {
      bg: '#ecfdf5',
      card: '#ffffff',
      accent: '#059669',
      text: '#064e3b',
    },
    styles: {
      pageWrapper: 'min-h-screen bg-gradient-to-b from-emerald-50 via-teal-50/30 to-emerald-50 text-emerald-950',
      headerIconWrapper: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-200 shadow-lg',
      titleClass: 'text-emerald-950',
      descClass: 'text-emerald-800/80',
      websiteLink: 'text-emerald-700 hover:text-emerald-900',
      cardWrapper: 'bg-white rounded-2xl border border-emerald-200/80 shadow-md shadow-emerald-900/5 p-6 sm:p-8',
      starActive: 'fill-amber-400 text-amber-400',
      starInactive: 'text-emerald-100 hover:text-amber-300',
      ratingLabel: 'text-emerald-900',
      inputLabel: 'text-emerald-900',
      inputClass: 'bg-emerald-50/30 border-emerald-200 text-emerald-950 focus:ring-emerald-500 focus:border-emerald-500',
      textareaClass: 'bg-emerald-50/30 border-emerald-200 text-emerald-950 focus:ring-emerald-500 focus:border-emerald-500',
      buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 shadow-md',
      footerClass: 'text-emerald-700/60',
      successIconWrapper: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      successTitle: 'text-emerald-950',
      successDesc: 'text-emerald-800',
    },
  },

  minimal: {
    id: 'minimal',
    name: 'Monochrome Minimal',
    category: 'Consulting / Design / Legal',
    description: 'Black-and-white editorial aesthetic with stark contrasts and crisp geometry.',
    badge: 'Minimalist',
    previewColors: {
      bg: '#ffffff',
      card: '#ffffff',
      accent: '#18181b',
      text: '#18181b',
    },
    styles: {
      pageWrapper: 'min-h-screen bg-white text-zinc-900',
      headerIconWrapper: 'bg-zinc-900 text-white shadow-sm border border-zinc-900',
      titleClass: 'text-zinc-900 tracking-tight font-mono',
      descClass: 'text-zinc-500 font-mono text-xs',
      websiteLink: 'text-zinc-900 hover:underline',
      cardWrapper: 'bg-white rounded-none border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] p-6 sm:p-8',
      starActive: 'fill-zinc-900 text-zinc-900',
      starInactive: 'text-zinc-200 hover:text-zinc-900',
      ratingLabel: 'text-zinc-900 font-mono text-xs uppercase',
      inputLabel: 'text-zinc-900 font-mono text-xs uppercase',
      inputClass: 'bg-zinc-50 rounded-none border-2 border-zinc-900 text-zinc-900 focus:ring-0 focus:border-zinc-900',
      textareaClass: 'bg-zinc-50 rounded-none border-2 border-zinc-900 text-zinc-900 focus:ring-0 focus:border-zinc-900',
      buttonClass: 'bg-zinc-900 hover:bg-zinc-800 text-white rounded-none font-mono uppercase tracking-wider',
      footerClass: 'text-zinc-400 font-mono',
      successIconWrapper: 'bg-zinc-100 text-zinc-900 border-2 border-zinc-900',
      successTitle: 'text-zinc-900 font-mono',
      successDesc: 'text-zinc-600 font-mono',
    },
  },
};

export function getTemplate(templateId?: string | null): TemplateDefinition {
  if (templateId && templateId in REVIEW_TEMPLATES) {
    return REVIEW_TEMPLATES[templateId as TemplateId];
  }
  return REVIEW_TEMPLATES.default;
}
