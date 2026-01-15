/**
 * useScrollSync Hook
 *
 * Manages bidirectional scroll synchronization between the CodeMirror editor
 * and the Markdown preview pane. Prevents infinite scroll loops using a
 * semaphore-based locking mechanism.
 *
 * Key Features:
 * - Line-number-based mapping instead of percentage-based
 * - Semaphore locks to prevent scroll loops
 * - Graceful error handling for missing elements
 * - Debounced lock release to prevent thrashing
 *
 * Usage:
 * ```tsx
 * const { canEditorScroll, canPreviewScroll, getTopVisibleLineInEditor, ... } =
 *   useScrollSync(150); // 150ms debounce window
 *
 * const handleEditorScroll = () => {
 *   if (!canEditorScroll()) return;
 *   const lineNum = getTopVisibleLineInEditor(editorView);
 *   syncToPreview(lineNum);
 *   acquireLock('editor');
 * };
 * ```
 */

import { useRef, useCallback } from 'react';
import type { EditorView as EditorViewType } from '@codemirror/view';

/**
 * Configuration options for the scroll sync hook
 */
interface ScrollSyncConfig {
  /**
   * Debounce window in milliseconds.
   * After scroll sync, locks are released after this duration.
   * Prevents rapid re-triggering of sync logic.
   * Default: 150ms
   */
  debounceMs?: number;
}

/**
 * Return type for the useScrollSync hook
 */
export interface UseScrollSyncReturn {
  /**
   * Check if the editor can initiate a scroll sync.
   * Returns false if preview is currently scrolling.
   */
  canEditorScroll: () => boolean;

  /**
   * Check if the preview can initiate a scroll sync.
   * Returns false if editor is currently scrolling.
   */
  canPreviewScroll: () => boolean;

  /**
   * Acquire a scroll lock for the given direction.
   * Prevents the opposite direction from responding to scroll events.
   * Lock is automatically released after debounceMs.
   */
  acquireLock: (direction: 'editor' | 'preview') => void;

  /**
   * Get the line number of the topmost visible line in the editor.
   * This is the source of truth for editor scroll position.
   *
   * @param editorView The CodeMirror EditorView instance
   * @returns Line number (1-indexed) or null if editor not available
   */
  getTopVisibleLineInEditor: (
    editorView: EditorViewType | null
  ) => number | null;

  /**
   * Get the line number of the topmost visible element in the preview.
   * Uses data-line-number attributes on preview elements.
   *
   * @param previewEl The preview container div
   * @returns Line number (0-indexed) or null if no element found
   */
  getTopVisibleLineInPreview: (previewEl: HTMLElement | null) => number | null;

  /**
   * Manually reset all locks.
   * Useful for emergency recovery if locks get stuck.
   */
  resetLocks: () => void;
}

/**
 * Hook for managing bidirectional scroll synchronization.
 *
 * This hook provides the synchronization logic needed to keep the editor
 * and preview panes in sync when the user scrolls either one.
 *
 * @param config Optional configuration object
 * @returns Object with scroll sync methods and state checkers
 */
export function useScrollSync(config: ScrollSyncConfig = {}): UseScrollSyncReturn {
  const debounceMs = config.debounceMs ?? 150;

  // Semaphore locks to prevent infinite scroll loops
  const isEditorScrolling = useRef(false);
  const isPreviewScrolling = useRef(false);
  const lockTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Check if editor scroll can proceed.
   * Blocked if preview is currently scrolling.
   */
  const canEditorScroll = useCallback(() => {
    return !isPreviewScrolling.current;
  }, []);

  /**
   * Check if preview scroll can proceed.
   * Blocked if editor is currently scrolling.
   */
  const canPreviewScroll = useCallback(() => {
    return !isEditorScrolling.current;
  }, []);

  /**
   * Acquire a lock for the specified direction.
   * This prevents the opposite pane from responding to scroll events.
   * The lock is automatically released after debounceMs to allow future syncs.
   *
   * Implementation:
   * 1. Set the appropriate lock flag
   * 2. Clear any existing timeout
   * 3. Schedule lock release after debounceMs
   *
   * The debounce window allows the DOM to settle after programmatic scroll,
   * which prevents spurious scroll events from triggering another sync cycle.
   */
  const acquireLock = useCallback(
    (direction: 'editor' | 'preview') => {
      // Set the lock
      if (direction === 'editor') {
        isEditorScrolling.current = true;
      } else {
        isPreviewScrolling.current = true;
      }

      // Clear any existing timeout
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current);
      }

      // Schedule lock release
      lockTimeoutRef.current = setTimeout(() => {
        isEditorScrolling.current = false;
        isPreviewScrolling.current = false;
        lockTimeoutRef.current = null;
      }, debounceMs);
    },
    [debounceMs]
  );

  /**
   * Get the top visible line number in the editor.
   *
   * Uses CodeMirror's viewport API:
   * - editorView.viewport.from is the character position at the top
   * - editorView.state.doc.lineAt() converts position to line number
   *
   * @param editorView CodeMirror EditorView instance
   * @returns Line number (1-indexed) or null if unavailable
   */
  const getTopVisibleLineInEditor = useCallback(
    (editorView: EditorViewType | null): number | null => {
      if (!editorView) {
        console.warn(
          '[ScrollSync] getTopVisibleLineInEditor: editorView not available'
        );
        return null;
      }

      try {
        const topVisibleLine = editorView.state.doc.lineAt(
          editorView.viewport.from
        );
        return topVisibleLine.number;
      } catch (error) {
        console.error(
          '[ScrollSync] Error getting top visible line in editor:',
          error
        );
        return null;
      }
    },
    []
  );

  /**
   * Get the top visible line number in the preview.
   *
   * Algorithm:
   * 1. Get all elements with data-line-number attribute
   * 2. For each element, check if its top edge is at or below the preview pane's top
   * 3. Return the line number of the first such element
   *
   * This works because:
   * - Elements are in document order
   * - Their top positions monotonically increase
   * - We want the first element that's visible or below the viewport
   *
   * @param previewEl The preview container div
   * @returns Line number (0-indexed) or null if no element found
   */
  const getTopVisibleLineInPreview = useCallback(
    (previewEl: HTMLElement | null): number | null => {
      if (!previewEl) {
        console.warn(
          '[ScrollSync] getTopVisibleLineInPreview: previewEl not available'
        );
        return null;
      }

      try {
        const previewRect = previewEl.getBoundingClientRect();
        const allLineElements = previewEl.querySelectorAll(
          '[data-line-number]'
        ) as NodeListOf<HTMLElement>;

        if (allLineElements.length === 0) {
          console.warn(
            '[ScrollSync] No elements with data-line-number found in preview'
          );
          return null;
        }

        // Find first element at or below the viewport top
        for (const element of allLineElements) {
          const elementRect = element.getBoundingClientRect();

          // Check if element is at or below the top of the viewport
          // (allowing small tolerance for subpixel positioning)
          if (elementRect.top >= previewRect.top - 1) {
            const lineNumStr = element.getAttribute('data-line-number');
            if (lineNumStr !== null) {
              const lineNum = parseInt(lineNumStr, 10);
              if (!isNaN(lineNum)) {
                return lineNum;
              }
            }
          }
        }

        // Fallback: return the last element if no element is above viewport
        // This handles the case where user scrolls past all elements
        if (allLineElements.length > 0) {
          const lastElement = allLineElements[allLineElements.length - 1];
          const lineNumStr = lastElement.getAttribute('data-line-number');
          if (lineNumStr !== null) {
            const lineNum = parseInt(lineNumStr, 10);
            if (!isNaN(lineNum)) {
              return lineNum;
            }
          }
        }

        return null;
      } catch (error) {
        console.error(
          '[ScrollSync] Error getting top visible line in preview:',
          error
        );
        return null;
      }
    },
    []
  );

  /**
   * Manually reset all locks.
   * Used for emergency recovery if locks somehow get stuck.
   */
  const resetLocks = useCallback(() => {
    isEditorScrolling.current = false;
    isPreviewScrolling.current = false;

    if (lockTimeoutRef.current) {
      clearTimeout(lockTimeoutRef.current);
      lockTimeoutRef.current = null;
    }

    console.log('[ScrollSync] Locks reset');
  }, []);

  return {
    canEditorScroll,
    canPreviewScroll,
    acquireLock,
    getTopVisibleLineInEditor,
    getTopVisibleLineInPreview,
    resetLocks,
  };
}
