const COLOR_MAP: Record<string, string> = {
  blue: '#6366f1',
  indigo: '#6366f1',
  purple: '#a855f7',
  violet: '#8b5cf6',
  green: '#22c55e',
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  pink: '#ec4899',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  gray: '#64748b',
  grey: '#64748b',
};

export function resolveProjectColor(color?: string): string {
  if (!color?.trim()) return '#6366f1';
  const trimmed = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
  return COLOR_MAP[trimmed.toLowerCase()] || '#6366f1';
}
