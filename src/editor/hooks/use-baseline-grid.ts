/**
 * MagMark 2.0 - Baseline Grid Hook
 * React hook for baseline grid visualization
 */
import { useState, useEffect, useCallback } from 'react';

export interface BaselineGridOptions {
  /** Baseline step in pixels (default: 8) */
  baselineStep?: number;
  /** Line height multiplier (default: 1.75) */
  lineHeight?: number;
  /** Show grid overlay */
  visible?: boolean;
  /** Grid color */
  color?: string;
  /** Grid opacity */
  opacity?: number;
}

export interface BaselineGridState {
  visible: boolean;
  baselineStep: number;
  lineHeight: number;
  toggle: () => void;
  show: () => void;
  hide: () => void;
  setBaselineStep: (step: number) => void;
  setLineHeight: (height: number) => void;
  getGridStyle: () => React.CSSProperties;
}

/**
 * React hook for baseline grid functionality
 */
export function useBaselineGrid(options: BaselineGridOptions = {}): BaselineGridState {
  const {
    baselineStep: initialStep = 8,
    lineHeight: initialLineHeight = 1.75,
    visible: initialVisible = false,
    color = '#e0e0e0',
    opacity = 0.5,
  } = options;

  const [visible, setVisible] = useState(initialVisible);
  const [baselineStep, setBaselineStep] = useState(initialStep);
  const [lineHeight, setLineHeight] = useState(initialLineHeight);

  const toggle = useCallback(() => {
    setVisible(v => !v);
  }, []);

  const show = useCallback(() => {
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  const getGridStyle = useCallback((): React.CSSProperties => {
    if (!visible) {
      return {};
    }

    const gridHeight = baselineStep * lineHeight;
    
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 9999,
      backgroundImage: `linear-gradient(
        to bottom,
        transparent ${100 - (1 / lineHeight * 100)}%,
        ${color} ${100 - (1 / lineHeight * 100)}%
      )`,
      backgroundSize: `100% ${gridHeight}px`,
      opacity,
    };
  }, [visible, baselineStep, lineHeight, color, opacity]);

  return {
    visible,
    baselineStep,
    lineHeight,
    toggle,
    show,
    hide,
    setBaselineStep,
    setLineHeight,
    getGridStyle,
  };
}

/**
 * Hook for snap-to-grid functionality
 */
export function useSnapToGrid(baselineStep: number = 8) {
  const snap = useCallback((value: number): number => {
    return Math.round(value / baselineStep) * baselineStep;
  }, [baselineStep]);

  const snapUp = useCallback((value: number): number => {
    return Math.ceil(value / baselineStep) * baselineStep;
  }, [baselineStep]);

  const snapDown = useCallback((value: number): number => {
    return Math.floor(value / baselineStep) * baselineStep;
  }, [baselineStep]);

  return { snap, snapUp, snapDown };
}

/**
 * Hook for calculating proper line heights
 */
export function useTypographyMetrics(options: {
  fontSize?: number;
  lineHeight?: number;
  baselineStep?: number;
} = {}) {
  const { fontSize = 16, lineHeight = 1.75, baselineStep = 8 } = options;

  const calculatedLineHeight = Math.ceil((fontSize * lineHeight) / baselineStep) * baselineStep;
  const lineHeightRatio = calculatedLineHeight / fontSize;
  const marginBottom = calculatedLineHeight;

  return {
    fontSize,
    lineHeight: lineHeightRatio,
    calculatedLineHeight,
    marginBottom,
  };
}

export default useBaselineGrid;
