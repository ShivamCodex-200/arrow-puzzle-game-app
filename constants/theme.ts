// Light theme colors (matching the original game's visual style)
export const COLORS = {
  // Backgrounds
  bgGradientStart: '#EBF0F5',
  bgGradientEnd:   '#EBF0F5',

  // Card (arrow cell)
  cardBg:          '#FFFFFF',
  cardBgEscapable: '#FFFFFF',
  cardBgHint:      '#EDFAF3',
  cardBgRemoved:   'transparent',

  // Arrow icons
  arrowNormal:     '#1B2B4B',
  arrowEscapable:  '#1B2B4B',
  arrowHint:       '#22C55E',

  // Borders
  borderEscapable: 'transparent',
  borderHint:      '#22C55E',

  // Empty dot
  dot:             '#94A3B8',

  // UI
  surface:         '#FFFFFF',
  text:            '#1B2B4B',
  textSecondary:   '#64748B',
  accent:          '#1B2B4B',
  danger:          '#EF4444',
  success:         '#22C55E',
  warning:         '#F59E0B',

  // Bottom bar
  bottomBar:       '#FFFFFF',
  bottomBarShadow: '#00000010',
};

export const SHADOWS = {
  card: {
    shadowColor: '#1A2340',
    shadowOpacity: 0.10,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  surface: {
    shadowColor: '#1A2340',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
};
