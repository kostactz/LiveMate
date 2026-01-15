/**
 * Insert Actions Utilities
 * 
 * Functions to generate markdown for various insert operations:
 * - Tables with configurable dimensions
 * - Images with alt text and URL
 * - Links with text and URL
 * 
 * Each function handles cursor positioning intelligently:
 * - If the cursor line is empty, insert directly on that line
 * - If the cursor line has content, insert on a new line below
 */

/**
 * Configuration for table generation
 */
export interface TableConfig {
  /** Number of columns (default: 3) */
  columns: number;
  /** Number of rows (default: 3) */
  rows: number;
  /** Whether to add header row (default: true) */
  hasHeader: boolean;
}

/**
 * Result of checking if a line is empty
 */
interface LineInfo {
  isEmpty: boolean;
  needsNewline: boolean;
}

/**
 * Check if a line is empty and determine if we need a newline
 * 
 * @param lineContent The content of the line where cursor is
 * @returns Object with isEmpty and needsNewline flags
 */
function checkLineEmpty(lineContent: string): LineInfo {
  const trimmed = lineContent.trim();
  const isEmpty = trimmed.length === 0;
  
  return {
    isEmpty,
    // Need newline if line has content
    needsNewline: !isEmpty,
  };
}

/**
 * Generate a markdown table with the specified configuration
 * 
 * @param config Table configuration
 * @returns Markdown table string
 * 
 * @example
 * generateTable({ columns: 3, rows: 2, hasHeader: true })
 * // Returns:
 * // | Header 1 | Header 2 | Header 3 |
 * // |----------|----------|----------|
 * // |          |          |          |
 * // |          |          |          |
 */
export function generateTable(config: Partial<TableConfig> = {}): string {
  const {
    columns = 3,
    rows = 3,
    hasHeader = true,
  } = config;

  const lines: string[] = [];

  // Generate header row
  if (hasHeader) {
    const headerCells = Array.from({ length: columns }, (_, i) => `**Header ${i + 1}**`);
    lines.push(`| ${headerCells.join(' | ')} |`);

    // Generate separator row
    const separators = Array.from({ length: columns }, () => '----------');
    lines.push(`|${separators.join('|')}|`);
  }

  // Generate data rows
  for (let i = 0; i < rows; i++) {
    const cells = Array.from({ length: columns }, () => '');
    lines.push(`| ${cells.join(' | ')} |`);
  }

  return lines.join('\n');
}

/**
 * Insert a table at the current cursor position
 * 
 * @param currentLineContent The content of the line where cursor is
 * @param config Table configuration
 * @returns The text to insert (with newlines if needed)
 */
export function insertTable(
  currentLineContent: string,
  config: Partial<TableConfig> = {}
): string {
  const { isEmpty, needsNewline } = checkLineEmpty(currentLineContent);
  const tableContent = generateTable(config);

  if (isEmpty) {
    return tableContent;
  }

  // Add newline before table if line has content
  return `\n\n${tableContent}`;
}

/**
 * Generate markdown image syntax
 * 
 * @param altText Alternative text for the image
 * @param url Image URL
 * @returns Markdown image string
 * 
 * @example
 * generateImage('Alt text', 'https://example.com/image.jpg')
 * // Returns: ![Alt text](https://example.com/image.jpg)
 */
export function generateImage(altText: string = 'Image', url: string = ''): string {
  return `![${altText}](${url})`;
}

/**
 * Insert an image at the current cursor position
 * 
 * @param currentLineContent The content of the line where cursor is
 * @param altText Alternative text for the image
 * @param url Image URL
 * @returns The text to insert (with newlines if needed)
 */
export function insertImage(
  currentLineContent: string,
  altText: string = 'Image',
  url: string = ''
): string {
  const { isEmpty, needsNewline } = checkLineEmpty(currentLineContent);
  const imageContent = generateImage(altText, url);

  if (isEmpty) {
    return imageContent;
  }

  return `\n${imageContent}`;
}

/**
 * Generate markdown link syntax
 * 
 * @param text Link text
 * @param url Link URL
 * @returns Markdown link string
 * 
 * @example
 * generateLink('Click here', 'https://example.com')
 * // Returns: [Click here](https://example.com)
 */
export function generateLink(text: string = 'Link text', url: string = ''): string {
  return `[${text}](${url})`;
}

/**
 * Insert a link at the current cursor position
 * 
 * @param currentLineContent The content of the line where cursor is
 * @param text Link text
 * @param url Link URL
 * @returns The text to insert (with newlines if needed)
 */
export function insertLink(
  currentLineContent: string,
  text: string = 'Link text',
  url: string = ''
): string {
  const { isEmpty, needsNewline } = checkLineEmpty(currentLineContent);
  const linkContent = generateLink(text, url);

  if (isEmpty) {
    return linkContent;
  }

  return `\n${linkContent}`;
}

/**
 * Generate a code block with syntax highlighting
 * 
 * @param language Programming language for syntax highlighting
 * @param code Code content
 * @returns Markdown code block string
 */
export function generateCodeBlock(language: string = 'javascript', code: string = ''): string {
  return `\`\`\`${language}\n${code}\n\`\`\``;
}

/**
 * Insert a code block at the current cursor position
 */
export function insertCodeBlock(
  currentLineContent: string,
  language: string = 'javascript',
  code: string = ''
): string {
  const { isEmpty } = checkLineEmpty(currentLineContent);
  const codeContent = generateCodeBlock(language, code);

  if (isEmpty) {
    return codeContent;
  }

  return `\n\n${codeContent}`;
}

/**
 * Generate a blockquote
 * 
 * @param text Quote text
 * @returns Markdown blockquote string
 */
export function generateBlockquote(text: string = ''): string {
  return `> ${text}`;
}

/**
 * Insert a blockquote at the current cursor position
 */
export function insertBlockquote(
  currentLineContent: string,
  text: string = ''
): string {
  const { isEmpty } = checkLineEmpty(currentLineContent);
  const quoteContent = generateBlockquote(text);

  if (isEmpty) {
    return quoteContent;
  }

  return `\n${quoteContent}`;
}

/**
 * Generate an unordered list
 * 
 * @param items List items
 * @returns Markdown list string
 */
export function generateUnorderedList(items: string[] = ['Item 1', 'Item 2', 'Item 3']): string {
  return items.map((item) => `- ${item}`).join('\n');
}

/**
 * Insert an unordered list at the current cursor position
 */
export function insertUnorderedList(
  currentLineContent: string,
  items: string[] = ['Item 1', 'Item 2', 'Item 3']
): string {
  const { isEmpty } = checkLineEmpty(currentLineContent);
  const listContent = generateUnorderedList(items);

  if (isEmpty) {
    return listContent;
  }

  return `\n\n${listContent}`;
}

/**
 * Generate an ordered list
 * 
 * @param items List items
 * @returns Markdown list string
 */
export function generateOrderedList(items: string[] = ['Item 1', 'Item 2', 'Item 3']): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

/**
 * Insert an ordered list at the current cursor position
 */
export function insertOrderedList(
  currentLineContent: string,
  items: string[] = ['Item 1', 'Item 2', 'Item 3']
): string {
  const { isEmpty } = checkLineEmpty(currentLineContent);
  const listContent = generateOrderedList(items);

  if (isEmpty) {
    return listContent;
  }

  return `\n\n${listContent}`;
}
