// Light theme colors (matching the original game's visual style)
export const COLORS = {
  // Backgrounds
  bgGradientStart: '#EDF3FA',
  bgGradientEnd:   '#EDF3FA',

  // Card (arrow cell)
  cardBg:          '#FFFFFF',
  cardBgEscapable: '#FFFFFF',
  cardBgHint:      '#EDFAF3',
  cardBgRemoved:   'transparent',

  // Arrow icons
  arrowNormal:     '#17243A', // dark navy
  arrowEscapable:  '#17243A',
  arrowHint:       '#22C55E',
  arrowHighlight:  '#FF5A3D', // orange-red highlight

  // Borders
  borderEscapable: 'transparent',
  borderHint:      '#22C55E',

  // Empty dot
  dot:             '#A5B1C2',

  // Badge/Pill Background & Text
  badgeBg:         '#E9EEF5',
  badgeText:       '#17243A',

  // UI
  surface:         '#FFFFFF',
  text:            '#1F355E',
  textSecondary:   '#64748B',
  accent:          '#1F355E',
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
