/**
 * Global type declarations for third-party libraries
 * loaded via script tags in the HTML
 */

declare global {
  interface Window {
    /**
     * marked.js - Markdown parser
     * Library is loaded globally and provides markdown parsing
     */
    marked: {
      parse: (markdown: string) => string;
    };

    /**
     * mermaid.js - Diagram rendering engine
     * Library is loaded globally and provides diagram generation
     */
    mermaid: {
      /**
       * Validate mermaid diagram syntax
       */
      parse: (text: string) => Promise<boolean>;

      /**
       * Initialize mermaid with configuration options
       */
      initialize: (config: any) => void;

      /**
       * Render mermaid diagrams in the DOM
       * When called without arguments, processes all .mermaid elements
       */
      run: (config?: { nodes?: NodeListOf<Element> }) => void;
    };
  }
}

export {};
