/**
 * usePopupPosition Hook
 * 
 * Calculates the optimal position for a popup/menu element, keeping it
 * within viewport bounds. Uses intelligent fallback positioning to ensure
 * the popup remains visible even near screen edges.
 * 
 * Algorithm:
 * 1. Calculate default position (try to place to bottom-right of target)
 * 2. Check if popup would exceed viewport boundaries
 * 3. If needed, try alternative positions (left-bottom, top-right, top-left)
 * 4. Return the best position that keeps popup fully visible
 */

import { useMemo } from 'react';

/**
 * Configuration options for popup positioning
 */
export interface PopupPositionOptions {
  /** Target element position from which popup should appear */
  targetX: number;
  targetY: number;
  
  /** Dimensions of the popup element */
  popupWidth: number;
  popupHeight: number;
  
  /** Optional offset from target position (useful for visual spacing) */
  offset?: {
    x: number;
    y: number;
  };
  
  /** Priority order for positioning attempts */
  priority?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

/**
 * Calculated popup position
 */
export interface PopupPosition {
  x: number;
  y: number;
  /** Which position was selected */
  alignment: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

/**
 * Safe margin from viewport edges (prevents popup from touching screen edge)
 */
const VIEWPORT_MARGIN = 16;

/**
 * Calculate popup position with intelligent viewport-aware positioning
 * 
 * @example
 * const position = usePopupPosition({
 *   targetX: 100,
 *   targetY: 50,
 *   popupWidth: 200,
 *   popupHeight: 300,
 *   offset: { x: 8, y: 8 },
 *   priority: 'bottom-right'
 * });
 */
export function usePopupPosition(
  options: PopupPositionOptions
): PopupPosition {
  return useMemo(() => {
    const {
      targetX,
      targetY,
      popupWidth,
      popupHeight,
      offset = { x: 8, y: 8 },
      priority = 'bottom-right',
    } = options;

    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;

    /**
     * Check if position is within viewport bounds
     */
    const isWithinViewport = (x: number, y: number): boolean => {
      return (
        x >= VIEWPORT_MARGIN &&
        x + popupWidth <= viewportWidth - VIEWPORT_MARGIN &&
        y >= VIEWPORT_MARGIN &&
        y + popupHeight <= viewportHeight - VIEWPORT_MARGIN
      );
    };

    /**
     * Try positioning to bottom-right of target
     */
    const tryBottomRight = (): PopupPosition | null => {
      const x = targetX + offset.x;
      const y = targetY + offset.y;
      if (isWithinViewport(x, y)) {
        return { x, y, alignment: 'bottom-right' };
      }
      return null;
    };

    /**
     * Try positioning to bottom-left of target
     */
    const tryBottomLeft = (): PopupPosition | null => {
      const x = targetX - popupWidth - offset.x;
      const y = targetY + offset.y;
      if (isWithinViewport(x, y)) {
        return { x, y, alignment: 'bottom-left' };
      }
      return null;
    };

    /**
     * Try positioning to top-right of target
     */
    const tryTopRight = (): PopupPosition | null => {
      const x = targetX + offset.x;
      const y = targetY - popupHeight - offset.y;
      if (isWithinViewport(x, y)) {
        return { x, y, alignment: 'top-right' };
      }
      return null;
    };

    /**
     * Try positioning to top-left of target
     */
    const tryTopLeft = (): PopupPosition | null => {
      const x = targetX - popupWidth - offset.x;
      const y = targetY - popupHeight - offset.y;
      if (isWithinViewport(x, y)) {
        return { x, y, alignment: 'top-left' };
      }
      return null;
    };

    /**
     * Define positioning strategies based on priority
     */
    const strategies: { [key: string]: (() => PopupPosition | null)[] } = {
      'bottom-right': [tryBottomRight, tryBottomLeft, tryTopRight, tryTopLeft],
      'bottom-left': [tryBottomLeft, tryBottomRight, tryTopLeft, tryTopRight],
      'top-right': [tryTopRight, tryTopLeft, tryBottomRight, tryBottomLeft],
      'top-left': [tryTopLeft, tryTopRight, tryBottomLeft, tryBottomRight],
    };

    const attemptStrategies = strategies[priority] || strategies['bottom-right'];

    // Try each strategy in order
    for (const strategy of attemptStrategies) {
      const result = strategy();
      if (result) {
        return result;
      }
    }

    /**
     * Fallback: clamp to viewport bounds
     * This ensures popup is always visible, even if not in ideal position
     */
    const clampedX = Math.max(
      VIEWPORT_MARGIN,
      Math.min(targetX + offset.x, viewportWidth - popupWidth - VIEWPORT_MARGIN)
    );
    const clampedY = Math.max(
      VIEWPORT_MARGIN,
      Math.min(targetY + offset.y, viewportHeight - popupHeight - VIEWPORT_MARGIN)
    );

    return {
      x: clampedX,
      y: clampedY,
      alignment: 'bottom-right',
    };
  }, [
    options.targetX,
    options.targetY,
    options.popupWidth,
    options.popupHeight,
    options.offset,
    options.priority,
  ]);
}
