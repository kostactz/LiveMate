/**
 * useSelectionWithMouseTracking Hook
 * 
 * Enhanced version of useSelectionPosition that also tracks the mouse position
 * when a selection change is triggered by a mouse event (click/drag).
 * 
 * This allows the formatting island to appear near the mouse cursor rather than
 * at an arbitrary position in the editor.
 */

import { useMemo } from 'react';
import type { EditorView } from '@codemirror/view';

/**
 * Extended selection position that includes mouse tracking
 */
export interface SelectionWithMousePosition {
  /** Position of the selection/cursor */
  selectionX: number;
  selectionY: number;
  /** Position of the mouse if tracked */
  mouseX?: number;
  mouseY?: number;
  /** Which position to use for UI (mouse takes priority) */
  preferredX: number;
  preferredY: number;
  /** Whether the selection is visible in viewport */
  isVisible: boolean;
}

/**
 * Get the position for the formatting island
 * Prefers mouse position if available, falls back to selection position
 */
export function useFormattingIslandPosition(
  view: EditorView | null,
  lastMouseEvent?: MouseEvent | null
): SelectionWithMousePosition {
  return useMemo(() => {
    if (!view) {
      return {
        selectionX: 0,
        selectionY: 0,
        preferredX: 0,
        preferredY: 0,
        isVisible: false,
      };
    }

    try {
      // Get selection position
      const cursorPos = view.state.selection.main.head;
      const coords = view.coordsAtPos(cursorPos);
      
      if (!coords) {
        return {
          selectionX: 0,
          selectionY: 0,
          preferredX: 0,
          preferredY: 0,
          isVisible: false,
        };
      }

      // Check if selection is in viewport
      const viewport = view.viewport;
      const isSelectionInViewport = 
        cursorPos >= viewport.from && 
        cursorPos <= viewport.to;

      if (!isSelectionInViewport) {
        return {
          selectionX: 0,
          selectionY: 0,
          preferredX: 0,
          preferredY: 0,
          isVisible: false,
        };
      }

      // Get scroll position
      const scrollDOM = view.scrollDOM;
      const scrollRect = scrollDOM.getBoundingClientRect();

      // Convert editor coordinates to screen coordinates
      const selectionX = coords.left + scrollRect.left;
      const selectionY = coords.top + scrollRect.top;

      // Use mouse position if available, otherwise use selection position
      const preferredX = lastMouseEvent ? lastMouseEvent.clientX : selectionX;
      const preferredY = lastMouseEvent ? lastMouseEvent.clientY : selectionY;

      return {
        selectionX,
        selectionY,
        mouseX: lastMouseEvent?.clientX,
        mouseY: lastMouseEvent?.clientY,
        preferredX,
        preferredY,
        isVisible: true,
      };
    } catch (error) {
      console.error('Error calculating formatting island position:', error);
      return {
        selectionX: 0,
        selectionY: 0,
        preferredX: 0,
        preferredY: 0,
        isVisible: false,
      };
    }
  }, [view, lastMouseEvent?.clientX, lastMouseEvent?.clientY]);
}
