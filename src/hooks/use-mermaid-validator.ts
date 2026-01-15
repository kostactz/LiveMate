
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';

export interface MermaidError {
  message: string;
  startCharIndex: number;
  endCharIndex: number;
}

const findFirstMermaidBlock = (markdown: string) => {
  const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/;
  const match = markdown.match(mermaidRegex);
  
  if (match) {
    const startIndex = match.index || 0;
    return {
      script: match[1],
      startCharIndex: startIndex,
      endCharIndex: startIndex + match[0].length,
    };
  }
  return null;
};


export function useMermaidValidator(
  markdown: string,
): { mermaidError: MermaidError | null } {
  const [mermaidError, setMermaidError] = useState<MermaidError | null>(null);
  const [debouncedMarkdown] = useDebounce(markdown, 500);

  useEffect(() => {
    const validate = async () => {
      if (typeof window.mermaid === 'undefined') return;

      const block = findFirstMermaidBlock(debouncedMarkdown);

      if (!block) {
        setMermaidError(null);
        return;
      }

      const { script, startCharIndex, endCharIndex } = block;
      
      try {
        if (script.trim() === '') {
            setMermaidError(null);
            return;
        }
        await window.mermaid.parse(script);
        setMermaidError(null);
      } catch (error: any) {
        const errorMessage: string = error.str || error.message || 'Unknown Mermaid error';
        
        setMermaidError({
          message: errorMessage,
          startCharIndex: startCharIndex,
          endCharIndex: endCharIndex,
        });
      }
    };

    validate();
  }, [debouncedMarkdown]);

  return { mermaidError };
}
