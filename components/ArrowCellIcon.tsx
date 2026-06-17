/**
 * components/ArrowCellIcon.tsx
 *
 * Pure SVG arrow icon, centered, clean thin-stroke style.
 */

import React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { Direction } from '../engine/types';

interface ArrowCellIconProps {
  direction: Direction;
  size: number;
  color: string;
}

export const ArrowCellIcon: React.FC<ArrowCellIconProps> = ({
  direction,
  size,
  color,
}) => {
  // Arrow path pointing UP in a 24x24 viewport:
  // Stem: (12, 19) to (12, 5). Head: (6, 11) -> (12, 5) -> (18, 11)
  // Let's make it look like a sleek chevron-style or clean arrow.
  const getRotation = () => {
    switch (direction) {
      case 'right': return '90deg';
      case 'down': return '180deg';
      case 'left': return '270deg';
      case 'up':
      default: return '0deg';
    }
  };

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ transform: [{ rotate: getRotation() }] }}
    >
      <Path
        d="M12 20V4M12 4L6 10M12 4L18 10"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
