/**
 * useSelectionPosition Hook
 * 
 * Tracks the position of the user's text selection in the CodeMirror editor
 * and converts it to screen coordinates. This is used to position floating
 * UI elements (like the formatting toolbar) near the selection.
 * 
 * Returns the position of the selection end (cursor position) in screen space,
 * accounting for the editor container's position and the editor's scroll offset.
 */

import { useMemo } from 'react';
import type { EditorView } from '@codemirror/view';

/**
 * Position of selection in screen/viewport coordinates
 */
export interface SelectionPosition {
  /** X coordinate in pixels (from left of viewport) */
  x: number;
  /** Y coordinate in pixels (from top of viewport) */
  y: number;
  /** Whether the selection is visible in the current viewport */
  isVisible: boolean;
  /** The editor container element (useful for reference) */
  containerRect?: DOMRect;
}

/**
 * Calculate screen position of a text selection in CodeMirror
 * 
 * This hook:
 * 1. Gets the selection end position from CodeMirror state
 * 2. Finds the DOM element at that position using CodeMirror's coordinate conversion
 * 3. Converts editor coordinates to screen/viewport coordinates
 * 4. Checks if the position is visible in the viewport
 * 
 * @param view CodeMirror EditorView instance
 * @returns SelectionPosition with screen coordinates or { x: 0, y: 0, isVisible: false } if not available
 * 
 * @example
 * const editorView = editorRef.current?.view;
 * const selectionPos = useSelectionPosition(editorView);
 * 
 * if (selectionPos.isVisible) {
 *   // Position floating UI at selectionPos.x, selectionPos.y
 * }
 */
export function useSelectionPosition(view: EditorView | null): SelectionPosition {
  return useMemo(() => {
    if (!view) {
      return { x: 0, y: 0, isVisible: false };
    }

    try {
      // Get the head position (cursor position) from selection
      const cursorPos = view.state.selection.main.head;

      // Get the DOM position for the cursor
      const coords = view.coordsAtPos(cursorPos);
      
      if (!coords) {
        return { x: 0, y: 0, isVisible: false };
      }

      // Get the viewport to check visibility
      const viewport = view.viewport;
      const isSelectionInViewport = 
        cursorPos >= viewport.from && 
        cursorPos <= viewport.to;

      if (!isSelectionInViewport) {
        return { x: 0, y: 0, isVisible: false };
      }

      // Get the scroll DOM element to adjust for scroll offset
      const scrollDOM = view.scrollDOM;
      const scrollRect = scrollDOM.getBoundingClientRect();

      // Convert editor coordinates to screen coordinates
      // coords.top and coords.left are relative to the editor's scroll area
      const screenX = coords.left + scrollRect.left;
      const screenY = coords.top + scrollRect.top;

      return {
        x: screenX,
        y: screenY,
        isVisible: true,
        containerRect: scrollRect,
      };
    } catch (error) {
      // Gracefully handle any coordinate calculation errors
      console.error('Error calculating selection position:', error);
      return { x: 0, y: 0, isVisible: false };
    }
  }, [view]);
}

/**
 * Get the position of the cursor line (useful for gutter interactions)
 * Returns the position of the entire line containing the cursor
 */
export function useSelectionLinePosition(view: EditorView | null): SelectionPosition {
  return useMemo(() => {
    if (!view) {
      return { x: 0, y: 0, isVisible: false };
    }

    try {
      const cursorPos = view.state.selection.main.head;
      const line = view.state.doc.lineAt(cursorPos);
      
      // Get coords for start of line (at gutter position)
      const coords = view.coordsAtPos(line.from);
      
      if (!coords) {
        return { x: 0, y: 0, isVisible: false };
      }

      const scrollDOM = view.scrollDOM;
      const scrollRect = scrollDOM.getBoundingClientRect();

      const screenX = coords.left + scrollRect.left;
      const screenY = coords.top + scrollRect.top;

      return {
        x: screenX,
        y: screenY,
        isVisible: true,
        containerRect: scrollRect,
      };
    } catch (error) {
      console.error('Error calculating selection line position:', error);
      return { x: 0, y: 0, isVisible: false };
    }
  }, [view]);
}
