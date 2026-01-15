
'use client';

import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useEffect,
  useState,
} from 'react';
import ReactCodeMirror, {
  type EditorView as EditorViewType,
  type ReactCodeMirrorRef,
} from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands';
import { keymap } from '@codemirror/view';

import { useCodeMirrorGutters, type OnPlusClickCallback } from '@/hooks/use-codemirror-gutters';
import { useSelectionPosition } from '@/hooks/use-selection-position';
import { useFormattingIslandPosition } from '@/hooks/use-selection-with-mouse-tracking';
import { useTextFormatting } from '@/hooks/use-text-formatting';
import { useCursorStability } from '@/hooks/use-cursor-stability';
import TextFormattingIsland from '@/components/TextFormattingIsland';
import type { MermaidError } from '@/hooks/use-mermaid-validator';

export interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  mermaidError: MermaidError | null;
  onPlusClick: OnPlusClickCallback;
  onDescribeMermaid: (script: string, startIndex: number) => void;
  onScroll: () => void;
  isExternalScrolling?: boolean; // Hide formatting island when any external scroll happens
  isDescribeProcessing?: boolean; // show processing state on gutter describe icon
}

export interface CodeMirrorEditorRef {
  insertText: (text: string) => void;
  getView: () => EditorViewType | null;
}

const CodeMirrorEditor = forwardRef<
  CodeMirrorEditorRef,
  CodeMirrorEditorProps
>(
  (
    {
      value,
      onChange,
      mermaidError,
      onPlusClick,
      onDescribeMermaid,
      onScroll,
      isExternalScrolling = false,
      isDescribeProcessing = false,
    },
    ref
  ) => {
    const editorRef = useRef<ReactCodeMirrorRef>(null);
    const [selectionUpdateCount, setSelectionUpdateCount] = useState(0);
    const [lastMouseEvent, setLastMouseEvent] = useState<MouseEvent | null>(null);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasScrolledRef = useRef(false); // Track if we've scrolled (island won't reappear until cursor moves)

    // Track the editor view for selection position and formatting
    const editorView = editorRef.current?.view || null;

    // Use cursor stability to show formatting popup only when cursor is stable
    const cursorStability = useCursorStability(editorView, 300); // 300ms threshold

    // Always call hooks unconditionally (Rules of Hooks)
    const fallbackPosition = useFormattingIslandPosition(editorView, lastMouseEvent);

    // Get formatting island position (prefers cursor position if available and stable)
    const islandPosition = cursorStability.isStable && cursorStability.cursorPosition
      ? {
          x: cursorStability.cursorPosition.x,
          y: cursorStability.cursorPosition.y,
          isVisible: true,
        }
      : fallbackPosition;

    const { formatState, hasSelection, toggleFormat } = useTextFormatting(editorView);

    const updateListener = EditorView.updateListener.of(update => {
      // Call onScroll on any view change - the parent will determine
      // if it's an actual scroll based on viewport position
      if (update.view) {
        onScroll();
      }
      
      // Detect scrolling and hide the formatting island
      // Island will not reappear until cursor/selection moves again
      if (update.viewportChanged) {
        setIsScrolling(true);
        hasScrolledRef.current = true; // Mark that we scrolled
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      }
      
      // When cursor/selection moves, reset the scroll flag so island can reappear
      if (update.selectionSet) {
        hasScrolledRef.current = false;
        setIsScrolling(false);
        setSelectionUpdateCount(c => c + 1);
      }
    });

    // Track mouse events to position the formatting island near the cursor
    useEffect(() => {
      const handleMouseUp = (e: MouseEvent) => {
        const editor = editorRef.current?.view;
        if (editor && editor.hasFocus) {
          // Store the mouse position when selection changes via mouse
          setLastMouseEvent(e);
          // Clear after a short delay so future updates don't use stale position
          setTimeout(() => setLastMouseEvent(null), 100);
        }
      };

      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, []);

    // Cleanup scroll timeout on unmount
    useEffect(() => {
      return () => {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }, []);

    const { customGutterExtension } = useCodeMirrorGutters(
      mermaidError,
      onPlusClick,
      onDescribeMermaid,
      isDescribeProcessing
    );

    useImperativeHandle(ref, () => ({
      insertText: (text: string) => {
        const view = editorRef.current?.view;
        if (view) {
          const { from, to } = view.state.selection.main;
          view.dispatch({
            changes: { from, to, insert: text },
            selection: { anchor: from + text.length },
          });
          view.focus();
        }
      },
      getView: () => editorRef.current?.view || null,
    }));
    
    // All theme related styles are now in globals.css
    // This empty theme is to just set font-family and line-height
    const customTheme = EditorView.theme({
        '&': {
            fontFamily: 'var(--font-code)',
            lineHeight: '1.75'
        },
        '.cm-scroller': {
            fontFamily: 'var(--font-code)',
            lineHeight: '1.75'
        }
    });


    const extensions = [
      customTheme,
      markdown(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      ...customGutterExtension,
      updateListener,
      EditorView.lineWrapping,
    ];

    // Determine position and visibility
    // Show popup if:
    // - Selection exists AND position is valid, OR
    // - Cursor is stable (even without selection)
    // BUT hide if currently scrolling, if we've scrolled, or if external scroll happened
    const islandVisible = !isScrolling && !hasScrolledRef.current && !isExternalScrolling && ((hasSelection && islandPosition.isVisible) || cursorStability.isStable);
    const islandPos = {
      x: 'preferredX' in islandPosition ? islandPosition.preferredX : islandPosition.x,
      y: 'preferredY' in islandPosition ? islandPosition.preferredY : islandPosition.y,
    };

    // Determine if this is a single-line selection
    // When hasSelection is true AND selectionLineCount is 1 -> single-line selection
    // When hasSelection is false -> no selection (cursor on current line) -> treat as "single-line"
    const isSingleLineSelection = !hasSelection || cursorStability.selectionLineCount === 1;

    return (
      <>
        <TextFormattingIsland
          isOpen={islandVisible}
          position={islandPos}
          formatState={formatState}
          onFormat={toggleFormat}
          onClose={() => {
            // Clear selection by clicking editor
            editorRef.current?.view?.focus();
          }}
          hasSelection={hasSelection}
          isSingleLineSelection={isSingleLineSelection}
        />
        <ReactCodeMirror
          ref={editorRef}
          value={value}
          onChange={onChange}
          extensions={extensions}
          style={{ height: '100%' }}
        />
      </>
    );
  }
);

CodeMirrorEditor.displayName = 'CodeMirrorEditor';

export default CodeMirrorEditor;
