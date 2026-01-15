"use server";
// Use Cloudflare Functions endpoints for AI

export async function enhanceText(markdownContent: string): Promise<string> {
    try {
        console.log('[AI][Server] enhanceText called with markdownContent:', markdownContent);
    const response = await fetch('/api/enhance-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ markdownContent }),
        });
        if (!response.ok) {
            throw new Error('Failed to enhance text with AI.');
        }
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        console.log('[AI][Server] enhanceText response:', data);
        return data.enhancedText;
    } catch (error) {
        console.error('[AI][Server] enhanceText error:', error);
        throw new Error('Failed to enhance text with AI.');
    }
}

export async function describeMermaid(mermaidScript: string): Promise<string> {
    try {
        console.log('[AI][Server] describeMermaid called with mermaidScript:', mermaidScript);
    const response = await fetch('/api/describe-mermaid-diagram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mermaidScript }),
        });
        if (!response.ok) {
            throw new Error('Failed to describe Mermaid diagram with AI.');
        }
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        console.log('[AI][Server] describeMermaid response:', data);
        return data.description;
    } catch (error) {
        console.error('[AI][Server] describeMermaid error:', error);
        throw new Error('Failed to describe Mermaid diagram with AI.');
    }
}
