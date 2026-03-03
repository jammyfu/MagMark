/**
 * MagMark 2.0 - Base Grid Overlay Component
 * Visual baseline grid guide for React
 */
import React from 'react';

export interface BaseGridOverlayProps {
  /** Show/hide the grid */
  visible?: boolean;
  /** Baseline step in pixels */
  baselineStep?: number;
  /** Line height multiplier */
  lineHeight?: number;
  /** Grid line color */
  color?: string;
  /** Grid opacity */
  opacity?: number;
  /** Custom class name */
  className?: string;
}

/**
 * Base Grid Overlay Component
 * Renders a visual baseline grid for typography alignment
 */
export const BaseGridOverlay: React.FC<BaseGridOverlayProps> = ({
  visible = true,
  baselineStep = 8,
  lineHeight = 1.75,
  color = '#e0e0e0',
  opacity = 0.5,
  className = '',
}) => {
  if (!visible) return null;

  const gridHeight = baselineStep * lineHeight;
  const linePosition = 100 - (1 / lineHeight) * 100;

  return (
    <div
      className={`mm-base-grid-overlay ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        backgroundImage: `linear-gradient(
          to bottom,
          transparent ${linePosition}%,
          ${color} ${linePosition}%
        )`,
        backgroundSize: `100% ${gridHeight}px`,
        opacity,
      }}
    />
  );
};

/**
 * Baseline Grid Guide Component
 * Shows grid measurements and info
 */
export const BaselineGridGuide: React.FC<{
  baselineStep?: number;
  lineHeight?: number;
}> = ({ baselineStep = 8, lineHeight = 1.75 }) => {
  const gridHeight = baselineStep * lineHeight;

  return (
    <div className="mm-baseline-guide" style={{
      position: 'fixed',
      bottom: 16,
      right: 16,
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '12px 16px',
      borderRadius: 8,
      fontSize: 12,
      fontFamily: 'monospace',
      zIndex: 10000,
    }}>
      <div style={{ marginBottom: 4 }}>
        <strong>Baseline Grid</strong>
      </div>
      <div>Step: {baselineStep}px</div>
      <div>Line Height: {lineHeight}</div>
      <div>Grid Height: {gridHeight}px</div>
    </div>
  );
};

/**
 * CSS for baseline grid
 */
export const baseGridStyles = `
  .mm-base-grid-overlay {
    /* Base styles applied inline */
  }
  
  .mm-with-baseline-grid {
    position: relative;
  }
  
  .mm-with-baseline-grid > * {
    /* Ensure content aligns to baseline */
    line-height: calc(var(--baseline-step, 8px) * var(--line-height, 1.75));
  }
`;

export default BaseGridOverlay;
