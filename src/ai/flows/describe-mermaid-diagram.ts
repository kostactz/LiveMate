'use server';
/**
 * @fileOverview A flow for generating a description for a Mermaid diagram.
 *
 * - describeMermaidDiagram - A function that takes a Mermaid diagram script and generates a description.
 * - DescribeMermaidDiagramInput - The input type for the describeMermaidDiagram function.
 * - DescribeMermaidDiagramOutput - The return type for the describeMermaidDiagram function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DescribeMermaidDiagramInputSchema = z.object({
  mermaidScript: z.string().describe('The Mermaid diagram script to describe.'),
});

export type DescribeMermaidDiagramInput = z.infer<typeof DescribeMermaidDiagramInputSchema>;

const DescribeMermaidDiagramOutputSchema = z.object({
  description: z.string().describe('The generated description of the Mermaid diagram.'),
});

export type DescribeMermaidDiagramOutput = z.infer<typeof DescribeMermaidDiagramOutputSchema>;

export async function describeMermaidDiagram(
  input: DescribeMermaidDiagramInput
): Promise<DescribeMermaidDiagramOutput> {
  console.log('[Genkit][describeMermaidDiagram] called with input:', input);
  try {
    const result = await describeMermaidDiagramFlow(input);
    console.log('[Genkit][describeMermaidDiagram] flow response:', result);
    return result;
  } catch (error: any) {
    let reason = error?.message || error?.toString() || 'Unknown error';
    let content = error?.response?.data || error?.response || null;
    console.error('[Genkit][describeMermaidDiagram] flow error:', {
      reason,
      content,
      input,
    });
    throw error;
  }
}

const describeMermaidDiagramPrompt = ai.definePrompt({
  name: 'describeMermaidDiagramPrompt',
  input: {schema: DescribeMermaidDiagramInputSchema},
  output: {schema: DescribeMermaidDiagramOutputSchema},
  prompt: `You are an expert technical writer. Your task is to analyze the following Mermaid diagram script and generate a clear, concise, and accurate description of what it represents. Explain the components and their relationships in plain English. Do not wrap your response in markdown. Here is the script:

{{{mermaidScript}}}`,
});

const describeMermaidDiagramFlow = ai.defineFlow(
  {
    name: 'describeMermaidDiagramFlow',
    inputSchema: DescribeMermaidDiagramInputSchema,
    outputSchema: DescribeMermaidDiagramOutputSchema,
  },
  async input => {
    const {output} = await describeMermaidDiagramPrompt(input);
    return output!;
  }
);
