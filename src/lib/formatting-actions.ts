/**
 * Text Formatting Actions
 * 
 * This module provides utilities to detect and apply HTML-based formatting
 * to text selections. It handles all major formatting types:
 * - Bold (<b>), Italic (<i>), Underline (<u>), Strikethrough (HTML)
 * - Headers (H1, H2, H3)
 * - Bullet Lists
 * 
 * Design: Functions are pure and stateless, making them easily testable
 * and composable. All functions operate on plain text strings.
 * 
 * NOTE: Bold and Italic use HTML tags instead of markdown (* and **) for
 * better compatibility with rich text editing.
 */

/**
 * Supported formatting types
 */
export type FormatType = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'h1' | 'h2' | 'h3' | 'bullet';

/**
 * Represents the detected formatting state of selected text
 */
export interface FormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  h1: boolean;
  h2: boolean;
  h3: boolean;
  bullet: boolean;
}

/**
 * Represents formatting state for a specific text selection
 */
export interface TextFormatting {
  text: string;
  formatState: FormatState;
}

/**
 * Detect if text is bold (wrapped in <b></b>)
 */
export function isBold(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith('<b>') && trimmed.endsWith('</b>') && trimmed.length > 7;
}

/**
 * Apply bold formatting to text using HTML <b> tags
 */
export function applyBold(text: string): string {
  return `<b>${text}</b>`;
}

/**
 * Remove bold formatting from text
 * Handles cleanup of nested tags
 * Example: "This is <b>bold</b>" -> "This is bold"
 * Example: "<b><b>text</b></b>" -> "text" (removes all layers)
 */
export function removeBold(text: string): string {
  let result = text.trim();
  
  // Remove all outer <b></b> pairs until none remain
  while (result.startsWith('<b>') && result.endsWith('</b>') && result.length > 7) {
    result = result.slice(3, -4); // Remove <b> (3 chars) and </b> (4 chars)
  }
  
  return result;
}

/**
 * Toggle bold formatting - apply if not present, remove if present
 */
export function toggleBold(text: string): string {
  return isBold(text) ? removeBold(text) : applyBold(text);
}

// ============================================================================
// ITALIC FORMATTING
// ============================================================================

/**
 * Detect if text is italic (wrapped in <i></i>)
 * Must not be bold (<b></b>) to be considered italic
 */
export function isItalic(text: string): boolean {
  const trimmed = text.trim();
  // Check for <i></i> but not <b></b> (bold)
  if (trimmed.startsWith('<b>') || trimmed.endsWith('</b>')) {
    return false;
  }
  return trimmed.startsWith('<i>') && trimmed.endsWith('</i>') && trimmed.length > 7;
}

/**
 * Apply italic formatting to text using HTML <i> tags
 */
export function applyItalic(text: string): string {
  return `<i>${text}</i>`;
}

/**
 * Remove italic formatting from text
 */
export function removeItalic(text: string): string {
  let result = text.trim();
  
  while (result.startsWith('<i>') && result.endsWith('</i>') && result.length > 7) {
    // Check if these are bold markers (<b></b>), not italic (<i></i>)
    if (result.startsWith('<b>') || result.endsWith('</b>')) {
      break; // Don't remove bold markers
    }
    result = result.slice(3, -4); // Remove <i> (3 chars) and </i> (4 chars)
  }
  
  return result;
}

/**
 * Toggle italic formatting
 */
export function toggleItalic(text: string): string {
  return isItalic(text) ? removeItalic(text) : applyItalic(text);
}

// ============================================================================
// STRIKETHROUGH FORMATTING
// ============================================================================

/**
 * Detect if text has strikethrough (wrapped in ~~)
 */
export function isStrikethrough(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith('~~') && trimmed.endsWith('~~') && trimmed.length > 4;
}

/**
 * Apply strikethrough formatting to text
 */
export function applyStrikethrough(text: string): string {
  return `~~${text}~~`;
}

/**
 * Remove strikethrough formatting from text
 */
export function removeStrikethrough(text: string): string {
  const trimmed = text.trim();
  if (isStrikethrough(trimmed)) {
    return trimmed.slice(2, -2);
  }
  return text;
}

/**
 * Toggle strikethrough formatting
 */
export function toggleStrikethrough(text: string): string {
  return isStrikethrough(text) ? removeStrikethrough(text) : applyStrikethrough(text);
}

// ============================================================================
// UNDERLINE FORMATTING
// ============================================================================

/**
 * Detect if text has underline formatting (HTML <u>text</u>)
 * Note: Markdown doesn't have native underline, so we use HTML
 */
export function isUnderline(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith('<u>') && trimmed.endsWith('</u>') && trimmed.length > 7;
}

/**
 * Apply underline formatting to text (using HTML)
 */
export function applyUnderline(text: string): string {
  return `<u>${text}</u>`;
}

/**
 * Remove underline formatting from text
 */
export function removeUnderline(text: string): string {
  const trimmed = text.trim();
  if (isUnderline(trimmed)) {
    return trimmed.slice(3, -4);
  }
  return text;
}

/**
 * Toggle underline formatting
 */
export function toggleUnderline(text: string): string {
  return isUnderline(text) ? removeUnderline(text) : applyUnderline(text);
}

// ============================================================================
// HEADER FORMATTING
// ============================================================================

/**
 * Detect header level (H1, H2, H3, or 0 for none)
 * Headers are determined by leading # characters at start of text
 */
function getHeaderLevel(text: string): number {
  const trimmed = text.trim();
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
 * Detect if text is H1 (single #)
 */
export function isH1(text: string): boolean {
  return getHeaderLevel(text) === 1;
}

/**
 * Detect if text is H2 (double ##)
 */
export function isH2(text: string): boolean {
  return getHeaderLevel(text) === 2;
}

/**
 * Detect if text is H3 (triple ###)
 */
export function isH3(text: string): boolean {
  return getHeaderLevel(text) === 3;
}

/**
 * Apply H1 formatting to text
 */
export function applyH1(text: string): string {
  const trimmed = text.trim();
  // Remove existing header markers if present
  const cleanedText = trimmed.replace(/^#+\s+/, '');
  return `# ${cleanedText}`;
}

/**
 * Apply H2 formatting to text
 */
export function applyH2(text: string): string {
  const trimmed = text.trim();
  const cleanedText = trimmed.replace(/^#+\s+/, '');
  return `## ${cleanedText}`;
}

/**
 * Apply H3 formatting to text
 */
export function applyH3(text: string): string {
  const trimmed = text.trim();
  const cleanedText = trimmed.replace(/^#+\s+/, '');
  return `### ${cleanedText}`;
}

/**
 * Remove header formatting from text
 */
export function removeHeader(text: string): string {
  const trimmed = text.trim();
  return trimmed.replace(/^#+\s+/, '');
}

/**
 * Toggle H1 - apply if not H1, remove if is H1
 */
export function toggleH1(text: string): string {
  return isH1(text) ? removeHeader(text) : applyH1(text);
}

/**
 * Toggle H2
 */
export function toggleH2(text: string): string {
  return isH2(text) ? removeHeader(text) : applyH2(text);
}

/**
 * Toggle H3
 */
export function toggleH3(text: string): string {
  return isH3(text) ? removeHeader(text) : applyH3(text);
}

// ============================================================================
// BULLET LIST FORMATTING
// ============================================================================

/**
 * Detect if text is a bullet list item (starts with - or * followed by space)
 */
export function isBulletList(text: string): boolean {
  const trimmed = text.trim();
  // Match "- " or "* " at the start
  return /^[-*]\s/.test(trimmed);
}

/**
 * Apply bullet list formatting to text
 * Converts a line to a bullet list item
 */
export function applyBulletList(text: string): string {
  const trimmed = text.trim();
  // Remove existing bullet if present
  const content = trimmed.replace(/^[-*]\s+/, '');
  return `- ${content}`;
}

/**
 * Remove bullet list formatting from text
 */
export function removeBulletList(text: string): string {
  const trimmed = text.trim();
  // Remove bullet marker and following space
  return trimmed.replace(/^[-*]\s+/, '');
}

/**
 * Toggle bullet list formatting
 */
export function toggleBulletList(text: string): string {
  return isBulletList(text) ? removeBulletList(text) : applyBulletList(text);
}

// ============================================================================
// COMPOSITE OPERATIONS
// ============================================================================

/**
 * Detect all formatting states for a given text selection
 * Returns a FormatState object with boolean flags for each format type
 */
export function detectFormatState(text: string): FormatState {
  return {
    bold: isBold(text),
    italic: isItalic(text),
    underline: isUnderline(text),
    strikethrough: isStrikethrough(text),
    h1: isH1(text),
    h2: isH2(text),
    h3: isH3(text),
    bullet: isBulletList(text),
  };
}

/**
 * Apply or remove a specific format type
 * Returns the formatted text
 */
export function toggleFormat(text: string, formatType: FormatType): string {
  switch (formatType) {
    case 'bold':
      return toggleBold(text);
    case 'italic':
      return toggleItalic(text);
    case 'underline':
      return toggleUnderline(text);
    case 'strikethrough':
      return toggleStrikethrough(text);
    case 'h1':
      return toggleH1(text);
    case 'h2':
      return toggleH2(text);
    case 'h3':
      return toggleH3(text);
    case 'bullet':
      return toggleBulletList(text);
    default:
      const _exhaustive: never = formatType;
      return _exhaustive;
  }
}

/**
 * Check if a specific format is applied to text
 */
export function isFormatApplied(text: string, formatType: FormatType): boolean {
  const state = detectFormatState(text);
  switch (formatType) {
    case 'bold':
      return state.bold;
    case 'italic':
      return state.italic;
    case 'underline':
      return state.underline;
    case 'strikethrough':
      return state.strikethrough;
    case 'h1':
      return state.h1;
    case 'h2':
      return state.h2;
    case 'h3':
      return state.h3;
    case 'bullet':
      return state.bullet;
    default:
      const _exhaustive: never = formatType;
      return _exhaustive;
  }
}
