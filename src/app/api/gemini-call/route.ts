export const runtime = 'edge';

export async function POST(request: Request) {
  // Helper functions for mock mode
  function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  function randomDelay(minSeconds: number = 2, maxSeconds: number = 4): number {
    return (minSeconds + Math.random() * (maxSeconds - minSeconds)) * 1000;
  }
  function generateMockDescription(prompt: string): string {
    const mockDescriptions = [
      "This Mermaid diagram illustrates a multi-step process flow with decision points. The flow begins with a start event, proceeds through several conditional branches, and converges at multiple endpoints based on different outcomes. Each node represents a distinct action or decision, and the arrows indicate the sequence of operations.",
      "The diagram depicts a system architecture with interconnected components. It shows how different modules communicate and interact with each other. The primary flow moves from left to right, with feedback loops returning to earlier stages. This design pattern is commonly used for representing complex workflows.",
      "This flowchart represents a hierarchical decision tree. Multiple user inputs lead to different paths through the system. Each branch handles specific scenarios, and the diagram clearly shows how the system responds to various conditions. The final outcomes are consolidated at the bottom.",
      "The diagram shows a sequence of operations in a distributed system. Different actors or components are represented as columns, with messages or function calls shown as arrows between them. This pattern is useful for understanding system interactions and timing.",
      "This visualization represents a state machine with various states and transitions. The diagram shows the initial state, all possible transitions between states, and the final states. This is a common pattern for modeling complex behaviors and workflows.",
      "The diagram illustrates a data processing pipeline. Raw data enters from the left, goes through multiple transformation stages, and exits as processed data on the right. Each stage performs a specific operation, and the flow is linear with some optional feedback paths.",
    ];
    const promptHash = prompt.split('').reduce((h: number, c: string) => ((h << 5) - h) + c.charCodeAt(0), 0);
    const index = Math.abs(promptHash) % mockDescriptions.length;
    return mockDescriptions[index];
  }

  console.log('[DEBUG] api/dev Handler called');
  try {
    const { prompt } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY || '';
    const isMockMode = !apiKey || apiKey.trim() === '';
    if (isMockMode) {
      console.log('[Gemini API] MOCK MODE ENABLED - No API key detected, simulating response');
      const delayMs = randomDelay(1, 4);
      console.log(`[Gemini API] Mock mode: waiting ${(delayMs / 1000).toFixed(1)}s before responding`);
      await delay(delayMs);
      const isSuccess = Math.random() >= 0.5;
      if (isSuccess) {
        console.log('[Gemini API] Mock mode: returning SUCCESS response');
        const mockDescription = generateMockDescription(prompt);
        const mockData = {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: mockDescription
                  }
                ]
              }
            }
          ]
        };
        return new Response(JSON.stringify({ result: mockData }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        console.log('[Gemini API] Mock mode: returning FAILURE response (simulating 503 error)');
        const mockError = {
          error: {
            code: 503,
            message: 'The model is overloaded. Please try again later.',
            status: 'UNAVAILABLE'
          }
        };
        return new Response(JSON.stringify(mockError), { status: 503 });
      }
    }
    // Real API mode
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    });
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: errorText }), { status: response.status });
    }
    const data = await response.json();
    return new Response(JSON.stringify({ result: data }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}
