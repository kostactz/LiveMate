/**
 * Advanced Formatting Detection
 * 
 * Detects text formatting by analyzing entire lines and document context,
 * rather than just the exact selected text. This provides more intuitive
 * behavior where selecting any part of a bold line shows bold as active.
 * 
 * IMPORTANT: For headers, we ONLY allow formatting on single-line selections.
 * Multi-line header formatting is disabled to prevent inconsistencies.
 */

import type { EditorState } from '@codemirror/state';
import type { Line } from '@codemirror/state';
import {
  isBold as textIsBold,
  isItalic as textIsItalic,
  isUnderline as textIsUnderline,
  isStrikethrough as textIsStrikethrough,
  isH1 as textIsH1,
  isH2 as textIsH2,
  isH3 as textIsH3,
  isBulletList as textIsBulletList,
  type FormatState,
} from '@/lib/formatting-actions';

/**
 * Get all lines containing the selection
 */
export function getSelectedLines(
  state: EditorState,
  from: number,
  to: number
): Line[] {
  const startLine = state.doc.lineAt(from);
  const endLine = state.doc.lineAt(to);
  
  const lines: Line[] = [];
  for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
    lines.push(state.doc.line(lineNum));
  }
  
  return lines;
}

/**
 * Check if ANY line in the selection has the given inline format
 * (This gives better UX - user can see they're in a bold section)
 */
function hasInlineFormatInSelection(
  state: EditorState,
  lines: Line[],
  formatChecker: (text: string) => boolean
): boolean {
  return lines.some((line) => {
    const lineContent = state.sliceDoc(line.from, line.to);
    return formatChecker(lineContent);
  });
}

/**
 * Check if ALL selected lines have the same header level
 * (For headers, we want consistency - all H1, all H2, etc.)
 */
function allLinesHaveHeaderLevel(
  state: EditorState,
  lines: Line[],
  headerChecker: (text: string) => boolean
): boolean {
  if (lines.length === 0) return false;
  
  return lines.every((line) => {
    const lineContent = state.sliceDoc(line.from, line.to);
    return headerChecker(lineContent);
  });
}

/**
 * Advanced format detection that considers entire lines
 * 
 * CRITICAL BEHAVIOR:
 * - Inline formatting (bold, italic, etc.): Show as active if ANY line has it
 * - Header formatting (h1, h2, h3): Show as active ONLY if:
 *   a) Selection is on a single line
 *   b) ALL selected content is within that line's header
 *   Multi-line selections CANNOT use header formatting (all h1/h2/h3 are false)
 * - Bullet lists: Show as active if ALL lines are bullet items
 * 
 * @param state CodeMirror editor state
 * @param from Selection start position
 * @param to Selection end position
 * @returns FormatState with context-aware detection
 * 
 * @example
 * const formatState = detectAdvancedFormatState(editorState, 10, 20);
 * // If user selected text within a bold line, formatState.bold will be true
 * // Headers only active if selection is entirely within a single line
 */
export function detectAdvancedFormatState(
  state: EditorState,
  from: number,
  to: number
): FormatState {
  // Get all lines containing the selection
  const selectedLines = getSelectedLines(state, from, to);
  
  if (selectedLines.length === 0) {
    return {
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      h1: false,
      h2: false,
      h3: false,
      bullet: false,
    };
  }

  // Check if this is a single-line or multi-line selection
  const isSingleLine = selectedLines.length === 1;

  return {
    // For inline formatting, show as active if ANY line has it
    // This provides better UX when selecting text within formatted blocks
    bold: hasInlineFormatInSelection(state, selectedLines, textIsBold),
    italic: hasInlineFormatInSelection(state, selectedLines, textIsItalic),
    underline: hasInlineFormatInSelection(state, selectedLines, textIsUnderline),
    strikethrough: hasInlineFormatInSelection(state, selectedLines, textIsStrikethrough),
    
    // For headers: ONLY show as active on single-line selections
    // Multi-line selections cannot use header formatting
    h1: isSingleLine && allLinesHaveHeaderLevel(state, selectedLines, textIsH1),
    h2: isSingleLine && allLinesHaveHeaderLevel(state, selectedLines, textIsH2),
    h3: isSingleLine && allLinesHaveHeaderLevel(state, selectedLines, textIsH3),
    
    // For bullet lists: show as active if ALL selected lines are bullet items
    bullet: selectedLines.length > 0 && selectedLines.every((line) => {
      const lineContent = state.sliceDoc(line.from, line.to);
      return textIsBulletList(lineContent);
    }),
  };
}

/**
 * Get the context for formatting operations
 * Returns all lines involved in the selection
 */
export function getSelectionContext(
  state: EditorState,
  from: number,
  to: number
): {
  lines: Line[];
  startLineFrom: number;
  endLineTo: number;
  selectedText: string;
} {
  const selectedLines = getSelectedLines(state, from, to);
  
  if (selectedLines.length === 0) {
    return {
      lines: [],
      startLineFrom: from,
      endLineTo: to,
      selectedText: '',
    };
  }

  const startLineFrom = selectedLines[0].from;
  const endLineTo = selectedLines[selectedLines.length - 1].to;
  const selectedText = state.sliceDoc(from, to);

  return {
    lines: selectedLines,
    startLineFrom,
    endLineTo,
    selectedText,
  };
}

/**
 * Get the content of a specific line
 */
export function getLineContent(state: EditorState, line: Line): string {
  return state.sliceDoc(line.from, line.to);
}

/**
 * Check if a selection spans multiple lines
 */
export function isMultiLineSelection(
  state: EditorState,
  from: number,
  to: number
): boolean {
  const startLine = state.doc.lineAt(from);
  const endLine = state.doc.lineAt(to);
  return startLine.number !== endLine.number;
}

/**
 * Get the header level (0 if not a header, 1-3 for H1-H3)
 */
export function getHeaderLevel(state: EditorState, line: Line): number {
  const content = getLineContent(state, line);
  const trimmed = content.trim();
  
  let level = 0;
  while (level < trimmed.length && trimmed[level] === '#') {
    level++;
  }
  
  // Valid header must have space after # and be 1-3 levels
  if (level > 0 && level <= 3 && trimmed[level] === ' ') {
    return level;
  }
  
  return 0;
}

/**
 * Check if all selected lines have the same header level
 */
export function allLinesHaveSameHeaderLevel(
  state: EditorState,
  lines: Line[]
): boolean {
  if (lines.length === 0) return false;
  
  const firstLevel = getHeaderLevel(state, lines[0]);
  
  // If first line is not a header, all must not be headers
  if (firstLevel === 0) {
    return lines.every(line => getHeaderLevel(state, line) === 0);
  }
  
  // All lines must have the same header level
  return lines.every(line => getHeaderLevel(state, line) === firstLevel);
}

/**
 * Get the common header level if all lines have the same level, 0 otherwise
 */
export function getCommonHeaderLevel(
  state: EditorState,
  lines: Line[]
): number {
  if (lines.length === 0) return 0;
  
  const firstLevel = getHeaderLevel(state, lines[0]);
  
  if (allLinesHaveSameHeaderLevel(state, lines)) {
    return firstLevel;
  }
  
  return 0;
}
