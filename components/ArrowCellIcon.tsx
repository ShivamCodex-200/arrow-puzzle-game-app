/**
 * ArrowCellIcon.tsx
 * 
 * Draws the arrow exactly like the real game:
 * - A line (stem) going in the direction
 * - An arrowhead at the leading end
 * - NO background, NO box, just strokes
 */

import React from 'react';
import Svg, { Line, Polyline } from 'react-native-svg';
import type { Direction } from '../engine/types';

interface Props {
  direction: Direction;
  size: number;       // cell size in px
  color: string;
  strokeWidth?: number;
}

export const ArrowCellIcon: React.FC<Props> = ({
  direction,
  size,
  color,
  strokeWidth = 2.2,
}) => {
  const s = size;
  const pad = s * 0.18;         // padding from cell edge
  const headSize = s * 0.22;    // arrowhead size

  const cx = s / 2;
  const cy = s / 2;

  let stemX1: number, stemY1: number, stemX2: number, stemY2: number;
  let headPoints: string;

  switch (direction) {
    case 'right':
      stemX1 = pad;
      stemY1 = cy;
      stemX2 = s - pad;
      stemY2 = cy;
      headPoints = `${s - pad - headSize},${cy - headSize * 0.6} ${s - pad},${cy} ${s - pad - headSize},${cy + headSize * 0.6}`;
      break;
    case 'left':
      stemX1 = s - pad;
      stemY1 = cy;
      stemX2 = pad;
      stemY2 = cy;
      headPoints = `${pad + headSize},${cy - headSize * 0.6} ${pad},${cy} ${pad + headSize},${cy + headSize * 0.6}`;
      break;
    case 'down':
      stemX1 = cx;
      stemY1 = pad;
      stemX2 = cx;
      stemY2 = s - pad;
      headPoints = `${cx - headSize * 0.6},${s - pad - headSize} ${cx},${s - pad} ${cx + headSize * 0.6},${s - pad - headSize}`;
      break;
    case 'up':
    default:
      stemX1 = cx;
      stemY1 = s - pad;
      stemX2 = cx;
      stemY2 = pad;
      headPoints = `${cx - headSize * 0.6},${pad + headSize} ${cx},${pad} ${cx + headSize * 0.6},${pad + headSize}`;
      break;
  }

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {/* Stem */}
      <Line
        x1={stemX1}
        y1={stemY1}
        x2={stemX2}
        y2={stemY2}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Arrowhead */}
      <Polyline
        points={headPoints}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
