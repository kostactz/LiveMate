/**
 * Cursor Stability Detection Hook
 * 
 * Detects when the cursor has remained in the same position for a certain
 * duration. This is useful for showing context-aware UI elements (like
 * formatting popups) only when the user has intentionally stopped editing.
 * 
 * The popup should show:
 * - Only when cursor is stable (hasn't moved for N milliseconds)
 * - Only for selections, not just cursor
 * - Only for single-line selections for headers/bullets
 * - Near the cursor position
 */

import { useEffect, useRef, useState } from 'react';
import type { EditorView } from '@codemirror/view';

export interface CursorStability {
  /** Whether the cursor has been stable for the threshold duration */
  isStable: boolean;
  
  /** Current cursor position (x, y in screen coordinates) */
  cursorPosition: {
    x: number;
    y: number;
  } | null;
  
  /** Whether there is an active selection */
  hasSelection: boolean;
  
  /** Number of lines in the selection (1 for single-line) */
  selectionLineCount: number;
}

/**
 * Hook to detect cursor stability
 * 
 * @param view CodeMirror EditorView instance
 * @param stabilityThreshold How many milliseconds the cursor must be stable (default 300ms)
 * @returns Cursor stability information
 * 
 * @example
 * const cursorStability = useCursorStability(editorView, 300);
 * 
 * if (cursorStability.isStable && cursorStability.hasSelection) {
 *   showFormattingPopup(cursorStability.cursorPosition);
 * }
 */
export function useCursorStability(
  view: EditorView | null,
  stabilityThreshold: number = 300 // milliseconds
): CursorStability {
  const [isStable, setIsStable] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [selectionLineCount, setSelectionLineCount] = useState(1);

  // Track timeout for debouncing
  const stabilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!view) {
      setIsStable(false);
      return;
    }

    // Clear previous timeout
    if (stabilityTimeoutRef.current) {
      clearTimeout(stabilityTimeoutRef.current);
    }

    // Reset stability immediately when selection/cursor changes
    setIsStable(false);

    // Get current selection
    const selection = view.state.selection.main;
    const currentHasSelection = selection.from !== selection.to;
    setHasSelection(currentHasSelection);

    // Calculate number of lines in selection
    if (currentHasSelection) {
      const startLine = view.state.doc.lineAt(selection.from).number;
      const endLine = view.state.doc.lineAt(selection.to).number;
      const lineCount = endLine - startLine + 1;
      setSelectionLineCount(lineCount);
    } else {
      setSelectionLineCount(1);
    }

    // Always try to get cursor position (for selection end or just cursor position)
    const posToCheck = currentHasSelection ? selection.to : selection.from;
    const coords = view.coordsAtPos(posToCheck);
    if (coords) {
      setCursorPosition({
        x: coords.left,
        y: coords.top,
      });
    } else {
      setCursorPosition(null);
    }

    // Set timeout to mark as stable (works for both selection and cursor-only)
    stabilityTimeoutRef.current = setTimeout(() => {
      setIsStable(true);
    }, stabilityThreshold);

    return () => {
      if (stabilityTimeoutRef.current) {
        clearTimeout(stabilityTimeoutRef.current);
      }
    };
  }, [view?.state.selection, stabilityThreshold, view]);

  return {
    isStable,
    cursorPosition,
    hasSelection,
    selectionLineCount,
  };
}
