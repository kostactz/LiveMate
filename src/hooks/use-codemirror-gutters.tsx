
'use client';

import { useMemo } from 'react';
import { gutter, GutterMarker, EditorView, lineNumbers } from '@codemirror/view';
import { StateField, StateEffect, RangeSet, type Range, type EditorState } from '@codemirror/state';
import { AlertCircle, Sparkles, Plus, type LucideProps } from 'lucide-react';
import { renderToString } from 'react-dom/server';
import type { MermaidError } from '@/hooks/use-mermaid-validator';

// --- Marker and State Effect Definitions ---

export class IconMarker extends GutterMarker {
  constructor(
    public readonly iconName: 'plus' | 'error' | 'describe',
    public readonly message: string | null,
    public readonly isProcessing: boolean = false
  ) {
    super();
  }

  toDOM() {
    const iconProps: LucideProps = {
      width: 18,
      height: 18,
      strokeWidth: 1.5,
    };
    let icon;
    let className = 'cursor-pointer';

    if (this.iconName === 'plus') {
      icon = renderToString(<Plus {...iconProps} />);
      className += ' text-muted-foreground hover:text-foreground';
    } else if (this.iconName === 'error') {
      icon = renderToString(<AlertCircle {...iconProps} />);
      className += ' text-destructive';
    } else { // describe
      icon = renderToString(<Sparkles {...iconProps} />);
      className += ' text-primary hover:text-primary/80';
      if (this.isProcessing) {
        // show a spinner animation when processing
        className += ' animate-spin';
      }
    }

    const dom = document.createElement('div');
    dom.innerHTML = icon;
    dom.className = `cm-gutter-icon ${className}`;
    dom.style.display = 'flex';
    dom.style.alignItems = 'center';
    dom.style.justifyContent = 'center';
    dom.style.padding = '0 4px';
    if (this.message) {
      dom.title = this.message;
    }
    return dom;
  }
}

export const findMermaidBlockAt = (state: EditorState, pos: number) => {
  const doc = state.doc.toString();
  const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
  let match;
  while ((match = mermaidRegex.exec(doc)) !== null) {
    const startIndex = match.index;
    const endIndex = startIndex + match[0].length;
    if (pos >= startIndex && pos <= endIndex) {
      return {
        from: startIndex,
        to: endIndex,
        script: match[1],
      };
    }
  }
  return null;
};


// --- Main Gutter Logic ---

/**
 * Callback for plus icon click with cursor position information
 */
export type OnPlusClickCallback = (cursorPos: {
  x: number;
  y: number;
  lineContent: string;
}) => void;

export const useCodeMirrorGutters = (
  mermaidError: MermaidError | null,
  onPlusClick: OnPlusClickCallback,
  onDescribeMermaid: (script: string, startIndex: number) => void,
  describeProcessing: boolean = false
) => {
  const customGutterExtension = useMemo(() => {
    const markerStateField = StateField.define<RangeSet<GutterMarker>>({
      create() {
        return RangeSet.empty;
      },
      update(markers, tr) {
        markers = markers.map(tr.changes);
        
        if (!tr.docChanged && !tr.selection) {
            return markers;
        }

        const newMarkers: Range<GutterMarker>[] = [];
        
        // 1. Handle Mermaid Error Marker
        if (mermaidError) {
          try {
            const errorLine = tr.state.doc.lineAt(mermaidError.startCharIndex);
            const marker = new IconMarker('error', mermaidError.message);
            newMarkers.push(marker.range(errorLine.from));
          } catch (e) {}
        }
        
        // 2. Handle Contextual Plus/Describe Marker
        const cursorPos = tr.state.selection.main.head;
        const cursorLine = tr.state.doc.lineAt(cursorPos);
        const mermaidBlock = findMermaidBlockAt(tr.state, cursorPos);

    if (mermaidBlock) {
      const blockStartLine = tr.state.doc.lineAt(mermaidBlock.from);
      const marker = new IconMarker('describe', describeProcessing ? 'AI processing...' : 'Describe with AI', describeProcessing);
      newMarkers.push(marker.range(blockStartLine.from));
    } else {
      const marker = new IconMarker('plus', 'Insert content...');
      newMarkers.push(marker.range(cursorLine.from));
    }

        return RangeSet.of(newMarkers, true);
      },
    });

    return [
      lineNumbers(),
      markerStateField,
      gutter({
        class: 'cm-custom-gutter',
        markers: (v) => v.state.field(markerStateField),
        domEventHandlers: {
            mousedown(view, line, event) {
                const target = event.target as HTMLElement;
                if (!target.closest('.cm-gutter-icon')) return false;

                // Stop event propagation to prevent other handlers from firing
                event.preventDefault();
                (event as any).codemirrorIgnore = true;

                const pos = line.from;
                let handled = false;
                
                view.state.field(markerStateField).between(pos, pos, (from, to, marker) => {
                    const iconMarker = marker as IconMarker;
                     if (iconMarker.iconName === 'plus') {
                        // Get line content for insert menu
                        const cursorLine = view.state.doc.lineAt(pos);
                        const lineContent = view.state.sliceDoc(cursorLine.from, cursorLine.to);
                        
                        // Get gutter icon position
                        const gutterIcon = (event.target as HTMLElement).closest('.cm-gutter-icon');
                        if (gutterIcon) {
                          const rect = gutterIcon.getBoundingClientRect();
                            // Debug: log calculated coordinates for insert menu
                          onPlusClick({
                            x: rect.right + 8, // Position menu to the right of icon
                            y: rect.top,
                            lineContent,
                          });
                        }
                        handled = true;
                     } else if (iconMarker.iconName === 'describe') {
                        const mermaidBlock = findMermaidBlockAt(view.state, pos);
                        if (mermaidBlock) {
                            onDescribeMermaid(mermaidBlock.script, mermaidBlock.from);
                            handled = true;
                        }
                     }
                });
                return handled;
            },
        }
      }),
    ]
  }, [mermaidError, onPlusClick, onDescribeMermaid, describeProcessing]);

  return { customGutterExtension };
};
