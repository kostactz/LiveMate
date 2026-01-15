"use client";

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface MarkdownPreviewProps {
  className?: string;
  markdown: string;
}

export default function MarkdownPreview({ markdown, className }: MarkdownPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (typeof window.mermaid !== 'undefined' && !isInitialized.current) {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        fontFamily: "'Inter', sans-serif",
        themeVariables: {
          background: '#282c34',
          primaryColor: '#3a3f4c',
          primaryTextColor: '#fff',
          primaryBorderColor: '#75A9FF',
          lineColor: '#C792EA',
          secondaryColor: '#3a3f4c',
          tertiaryColor: '#3a3f4c',
          textColor: '#fff',
          clusterBkg: "#20232A",
          clusterBorder: "#aaaaaa"
        }
      });
      isInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (previewRef.current && typeof window.marked !== 'undefined' && isInitialized.current) {
      
      const rawHtml = window.marked.parse(markdown);
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = rawHtml;

      const codeBlocks = tempDiv.querySelectorAll('pre > code.language-mermaid');
      codeBlocks.forEach(block => {
        const pre = block.parentElement;
        if (pre) {
          const mermaidDiv = document.createElement('div');
          mermaidDiv.className = 'mermaid';
          mermaidDiv.textContent = block.textContent || '';
          pre.replaceWith(mermaidDiv);
        }
      });
      
      previewRef.current.innerHTML = tempDiv.innerHTML;
      
      if(typeof window.mermaid !== 'undefined') {
        try {
            window.mermaid.run();
        } catch(e) {
            console.error("Error rendering mermaid diagram:", e);
        }
      }
    }
  }, [markdown]);

  return (
    <div
      ref={previewRef}
      id="printable-area"
      className={cn('prose-styles p-8 w-full max-w-none animate-in fade-in duration-300', className)}
    />
  );
}
