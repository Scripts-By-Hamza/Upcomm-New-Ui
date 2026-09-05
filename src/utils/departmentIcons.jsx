import React from 'react';
import {
  Building2,
  Code2,
  Megaphone,
  BriefcaseBusiness,
  PenTool,
  Users,
  CircleDollarSign,
  Headphones,
  LineChart,
  PackageSearch,
  Truck,
  Sparkles,
  LayoutGrid,
  ShieldCheck,
  Crown,
  Compass,
  FolderGit2,
  Share2,
  Bot,
  Target,
  Boxes,
  Palette,
  Headset,
  TrendingUp,
} from 'lucide-react';

export const DEPARTMENT_ICON_LIST = [
  { key: 'Code2', label: 'Dev & AI', icon: Code2 },
  { key: 'Megaphone', label: 'Marketing', icon: Megaphone },
  { key: 'CircleDollarSign', label: 'Finance', icon: CircleDollarSign },
  { key: 'Users', label: 'HR & Talent', icon: Users },
  { key: 'LineChart', label: 'Analysis', icon: LineChart },
  { key: 'PackageSearch', label: 'Sourcing', icon: PackageSearch },
  { key: 'LayoutGrid', label: 'Catalog', icon: LayoutGrid },
  { key: 'Share2', label: 'Social Media', icon: Share2 },
  { key: 'Truck', label: 'Supply Chain', icon: Truck },
  { key: 'Headphones', label: 'Customer Relations', icon: Headphones },
  { key: 'PenTool', label: 'UI/UX Design', icon: PenTool },
  { key: 'BriefcaseBusiness', label: 'Operations', icon: BriefcaseBusiness },
  { key: 'ShieldCheck', label: 'Security & QA', icon: ShieldCheck },
  { key: 'Crown', label: 'Executive', icon: Crown },
  { key: 'Target', label: 'Sales & Growth', icon: Target },
  { key: 'Bot', label: 'Automation', icon: Bot },
  { key: 'Compass', label: 'Discovery', icon: Compass },
  { key: 'Building2', label: 'Enterprise', icon: Building2 },
];

export const ICON_MAP = {
  code2: Code2,
  code: Code2,
  dev: Code2,
  megaphone: Megaphone,
  marketing: Megaphone,
  circledollarsign: CircleDollarSign,
  dollar: CircleDollarSign,
  finance: CircleDollarSign,
  cfo: CircleDollarSign,
  users: Users,
  hr: Users,
  people: Users,
  linechart: LineChart,
  chart: LineChart,
  analysis: LineChart,
  packagesearch: PackageSearch,
  hunting: PackageSearch,
  sourcing: PackageSearch,
  layoutgrid: LayoutGrid,
  listing: LayoutGrid,
  catalog: LayoutGrid,
  share2: Share2,
  smm: Share2,
  social: Share2,
  truck: Truck,
  supply: Truck,
  logistics: Truck,
  headphones: Headphones,
  headset: Headset,
  cr: Headphones,
  support: Headphones,
  pentool: PenTool,
  palette: Palette,
  design: PenTool,
  briefcasebusiness: BriefcaseBusiness,
  briefcase: BriefcaseBusiness,
  operations: BriefcaseBusiness,
  shieldcheck: ShieldCheck,
  crown: Crown,
  target: Target,
  bot: Bot,
  compass: Compass,
  foldergit2: FolderGit2,
  building2: Building2,
  sparkles: Sparkles,
  trendingup: TrendingUp,
  boxes: Boxes,
};

/**
 * Deterministic presentational icon mapper.
 * Sourced by department.icon or matched deterministically by department.name.
 */
export function getDepartmentIconComponent(department) {
  if (!department) return Building2;

  const rawIcon = (department.icon || '').trim();

  // If stored icon is a known Lucide icon key
  if (rawIcon && !rawIcon.startsWith('data:') && !rawIcon.startsWith('<svg') && !rawIcon.startsWith('http')) {
    const normalizedKey = rawIcon.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (ICON_MAP[normalizedKey]) {
      return ICON_MAP[normalizedKey];
    }
  }

  const name = (department.name || '').toLowerCase();
  const desc = (department.description || '').toLowerCase();
  const combined = `${name} ${desc}`;

  // Name / description based deterministic matching
  if (combined.includes('web') || combined.includes('dev') || combined.includes('software') || combined.includes('ai automation') || combined.includes('code')) {
    return Code2;
  }
  if (combined.includes('marketing') || combined.includes('campaign') || combined.includes('seo') || combined.includes('ppc') || combined.includes('lead generation')) {
    return Megaphone;
  }
  if (combined.includes('finance') || combined.includes('cfo') || combined.includes('budget') || combined.includes('account') || combined.includes('cash flow')) {
    return CircleDollarSign;
  }
  if (combined.includes('human resource') || combined.includes('talent') || combined.includes('employee') || combined.includes('hr') || combined.includes('onboarding')) {
    return Users;
  }
  if (combined.includes('product analysis') || combined.includes('analytics') || combined.includes('profit margin') || combined.includes('price analysis')) {
    return LineChart;
  }
  if (combined.includes('hunting') || combined.includes('sourcing') || combined.includes('sample validation') || combined.includes('vendor')) {
    return PackageSearch;
  }
  if (combined.includes('listing') || combined.includes('catalog') || combined.includes('metadata') || combined.includes('product upload')) {
    return LayoutGrid;
  }
  if (combined.includes('social') || combined.includes('smm') || combined.includes('brand awareness') || combined.includes('community engagement')) {
    return Share2;
  }
  if (combined.includes('supply chain') || combined.includes('logistics') || combined.includes('inventory') || combined.includes('fulfillment')) {
    return Truck;
  }
  if (combined.includes('customer') || combined.includes('grievance') || combined.includes('client communication') || combined.includes('support') || combined.includes('cr')) {
    return Headphones;
  }
  if (combined.includes('design') || combined.includes('ui') || combined.includes('ux') || combined.includes('creative')) {
    return PenTool;
  }
  if (combined.includes('operation') || combined.includes('workflow') || combined.includes('coo')) {
    return BriefcaseBusiness;
  }
  if (combined.includes('executive') || combined.includes('leadership') || combined.includes('ceo')) {
    return Crown;
  }

  return Building2;
}
