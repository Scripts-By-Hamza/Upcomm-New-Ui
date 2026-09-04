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
} from 'lucide-react';

/**
 * Deterministic presentational icon mapper.
 * Sourced by department.icon or matched deterministically by department.name.
 * Pure UI presentation mapping without database schema modification.
 */
export function getDepartmentIconComponent(department) {
  if (!department) return Building2;

  const iconKey = (department.icon || '').toLowerCase();
  const name = (department.name || '').toLowerCase();

  // 1. Direct icon key matches if stored
  if (iconKey === 'code' || iconKey === 'code2' || iconKey === 'dev') return Code2;
  if (iconKey === 'megaphone' || iconKey === 'marketing') return Megaphone;
  if (iconKey === 'briefcase' || iconKey === 'operations' || iconKey === 'business') return BriefcaseBusiness;
  if (iconKey === 'pentool' || iconKey === 'design' || iconKey === 'palette') return PenTool;
  if (iconKey === 'users' || iconKey === 'hr' || iconKey === 'people') return Users;
  if (iconKey === 'dollar' || iconKey === 'finance' || iconKey === 'cfo') return CircleDollarSign;
  if (iconKey === 'headphones' || iconKey === 'support' || iconKey === 'cr') return Headphones;
  if (iconKey === 'chart' || iconKey === 'analysis' || iconKey === 'analytics') return LineChart;
  if (iconKey === 'sourcing' || iconKey === 'hunting') return PackageSearch;
  if (iconKey === 'supply' || iconKey === 'logistics') return Truck;

  // 2. Name-based deterministic keyword matching
  if (name.includes('web') || name.includes('dev') || name.includes('software') || name.includes('ai') || name.includes('automation') || name.includes('code')) {
    return Code2;
  }
  if (name.includes('marketing') || name.includes('campaign') || name.includes('seo') || name.includes('ppc')) {
    return Megaphone;
  }
  if (name.includes('design') || name.includes('ui') || name.includes('ux') || name.includes('creative') || name.includes('brand')) {
    return PenTool;
  }
  if (name.includes('operation') || name.includes('coo') || name.includes('workflow')) {
    return BriefcaseBusiness;
  }
  if (name.includes('supply') || name.includes('logistics') || name.includes('inventory')) {
    return Truck;
  }
  if (name.includes('social') || name.includes('smm') || name.includes('media')) {
    return Share2;
  }
  if (name.includes('listing') || name.includes('catalog')) {
    return LayoutGrid;
  }
  if (name.includes('analysis') || name.includes('analytics') || name.includes('research')) {
    return LineChart;
  }
  if (name.includes('hunting') || name.includes('sourcing') || name.includes('vendor')) {
    return Compass;
  }
  if (name.includes('human') || name.includes('hr') || name.includes('people') || name.includes('talent')) {
    return Users;
  }
  if (name.includes('finance') || name.includes('cfo') || name.includes('budget') || name.includes('account')) {
    return CircleDollarSign;
  }
  if (name.includes('customer') || name.includes('relation') || name.includes('support') || name.includes('cr')) {
    return Headphones;
  }
  if (name.includes('executive') || name.includes('ceo') || name.includes('leadership')) {
    return Crown;
  }

  // Fallback icon
  return Building2;
}
