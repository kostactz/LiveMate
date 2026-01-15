/**
 * useTextFormatting Hook
 * 
 * Provides text formatting capabilities integrated with CodeMirror.
 * This hook detects which formatting is applied to the current selection
 * and provides functions to apply, remove, or toggle formatting.
 * 
 * Uses advanced formatting detection that considers entire lines/context,
 * not just the exact selected text. This provides more intuitive UX.
 * 
 * IMPORTANT BEHAVIORS:
 * - When NO selection: inline formats (bold, italic, strikethrough) are disabled
 *   but headers and bullets work on the entire current line
 * - When single-line selection: all formats available
 * - When multi-line selection:
 *   - Headers disabled
 *   - Bullets apply to entire lines (beginning of each line)
 *   - Inline formats apply to selection
 */

import { useMemo, useCallback } from 'react';
import type { EditorView } from '@codemirror/view';
import {
  toggleFormat,
  toggleH1,
  toggleH2,
  toggleH3,
  toggleBulletList,
  type FormatState,
  type FormatType,
} from '@/lib/formatting-actions';
import { detectAdvancedFormatState, getSelectedLines, getLineContent } from '@/lib/advanced-formatting';

/**
 * Result of the useTextFormatting hook
 */
export interface UseTextFormattingReturn {
  /** Current formatting state of the selection */
  formatState: FormatState;
  
  /** Whether there is an active selection (not just a cursor) */
  hasSelection: boolean;
  
  /** The selected text */
  selectedText: string;
  
  /** Apply/remove formatting by toggling the format type */
  toggleFormat: (formatType: FormatType) => void;
}

/**
 * Hook to detect and apply text formatting to selections
 * 
 * @param view CodeMirror EditorView instance
 * @returns Object with format state and formatting functions
 * 
 * @example
 * const { formatState, toggleFormat, hasSelection } = useTextFormatting(editorView);
 * 
 * if (hasSelection) {
 *   // User has text selected
 *   if (formatState.bold) {
 *     // Selected text is bold
 *   }
 *   
 *   // Toggle bold on selection
 *   toggleFormat('bold');
 * }
 */
export function useTextFormatting(
  view: EditorView | null
): UseTextFormattingReturn {
  // Get selection info and format state
  const { formatState, selectedText, hasSelection } = useMemo(() => {
    if (!view) {
      return {
        formatState: {
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
          h1: false,
          h2: false,
          h3: false,
          bullet: false,
        },
        selectedText: '',
        hasSelection: false,
      };
    }

    const selection = view.state.selection.main;
    const hasSelection = selection.from !== selection.to;

    // When NO selection, check formatting on the current line
    if (!hasSelection) {
      const line = view.state.doc.lineAt(selection.from);
      const lineContent = view.state.sliceDoc(line.from, line.to);
      
      // For no selection: headers and bullets are enabled, but inline formats are disabled
      const formatState = detectAdvancedFormatState(
        view.state,
        line.from,
        line.to
      );
      
      // Disable inline formats when no selection is made
      formatState.bold = false;
      formatState.italic = false;
      formatState.underline = false;
      formatState.strikethrough = false;

      return {
        formatState,
        selectedText: '',
        hasSelection: false,
      };
    }

    // Extract selected text
    const selectedText = view.state.sliceDoc(selection.from, selection.to);
    
    // Use advanced formatting detection that considers entire lines
    const formatState = detectAdvancedFormatState(
      view.state,
      selection.from,
      selection.to
    );

    return {
      formatState,
      selectedText,
      hasSelection: true,
    };
  }, [view]);

  // Function to apply formatting
  const applyFormatting = useCallback((formatType: FormatType) => {
    if (!view) return;

    const selection = view.state.selection.main;
    
    // When no selection is made, operate on the current line
    if (selection.from === selection.to) {
      const line = view.state.doc.lineAt(selection.from);
      const lineContent = view.state.sliceDoc(line.from, line.to);
      
      // Only allow headers and bullets when no selection
      if (formatType !== 'h1' && formatType !== 'h2' && formatType !== 'h3' && formatType !== 'bullet') {
        console.warn('Inline formatting not allowed without selection');
        return;
      }

      let formattedLine: string;
      if (formatType === 'h1') {
        formattedLine = toggleH1(lineContent);
      } else if (formatType === 'h2') {
        formattedLine = toggleH2(lineContent);
      } else if (formatType === 'h3') {
        formattedLine = toggleH3(lineContent);
      } else if (formatType === 'bullet') {
        formattedLine = toggleBulletList(lineContent);
      } else {
        formattedLine = lineContent;
      }

      view.dispatch({
        changes: {
          from: line.from,
          to: line.to,
          insert: formattedLine,
        },
      });

      view.focus();
      return;
    }

    // Has selection - handle based on selection type
    const selectedLines = getSelectedLines(view.state, selection.from, selection.to);
    const isSingleLine = selectedLines.length === 1;

    // Prevent header formatting on multi-line selections
    if ((formatType === 'h1' || formatType === 'h2' || formatType === 'h3') && !isSingleLine) {
      console.warn('Header formatting not allowed on multi-line selections');
      return;
    }

    // Handle bullet formatting on multi-line selections - apply to each line
    if (formatType === 'bullet' && !isSingleLine) {
      const changes: any[] = [];
      for (const line of selectedLines) {
        const lineContent = getLineContent(view.state, line);
        const formattedLine = toggleBulletList(lineContent);
        changes.push({
          from: line.from,
          to: line.to,
          insert: formattedLine,
        });
      }
      view.dispatch({ changes });
      view.focus();
      return;
    }

    // For other formats on single-line or inline formats
    const selectedText = view.state.sliceDoc(selection.from, selection.to);
    const formattedText = toggleFormat(selectedText, formatType);

    view.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: formattedText,
      },
      selection: {
        anchor: selection.from,
        head: selection.from + formattedText.length,
      },
    });

    // Keep focus on editor
    view.focus();
  }, [view]);

  return {
    formatState,
    hasSelection,
    selectedText,
    toggleFormat: applyFormatting,
  };
}
