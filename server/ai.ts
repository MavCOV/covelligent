/**
 * Covelligent AI Engine
 * Real Perplexity API integration with streaming, citations, and multiple modes.
 */

const PPLX_API_KEY = process.env.PPLX_API_KEY;
const PPLX_BASE = "https://api.perplexity.ai";

export interface AIResponse {
  content: string;
  citations: string[];
  model: string;
}

// Model map by search mode
const MODE_MODELS: Record<string, string> = {
  web: "sonar",
  academic: "sonar",
  reasoning: "sonar-reasoning",
  code: "sonar",
  news: "sonar",
  default: "sonar",
};

const MODE_SYSTEM_PROMPTS: Record<string, string> = {
  web: "You are Covelligent, the world's most advanced AI search and intelligence platform. Search the web thoroughly, synthesize information from multiple high-quality sources, and provide comprehensive, accurate answers with specific citations. Be thorough, precise, and insightful. Format your response with clear structure using markdown.",
  academic: "You are Covelligent in Academic Research mode. Focus on peer-reviewed sources, research papers, academic publications, and scholarly sources. Cite specific studies, authors, and publication dates. Be rigorous and precise.",
  reasoning: "You are Covelligent in Deep Reasoning mode. Think through complex problems step by step. Show your reasoning process. Break down difficult questions into components and reason through each carefully before reaching a conclusion.",
  code: "You are Covelligent in Code mode. You are an expert software engineer. Provide complete, working, production-ready code. Include explanations of what the code does and why design decisions were made. Use proper formatting with code blocks.",
  news: "You are Covelligent in News mode. Focus on the most recent news and current events. Search for the latest information, breaking news, and recent developments. Prioritize recency and provide dates for all news items cited.",
};

export async function queryPerplexity(
  query: string,
  mode: string = "web",
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<AIResponse> {
  if (!PPLX_API_KEY) {
    throw new Error("PPLX_API_KEY not configured");
  }

  const model = MODE_MODELS[mode] || MODE_MODELS.default;
  const systemPrompt = MODE_SYSTEM_PROMPTS[mode] || MODE_SYSTEM_PROMPTS.web;

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-10), // last 10 messages for context
    { role: "user", content: query },
  ];

  const response = await fetch(`${PPLX_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${PPLX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 2048,
      temperature: 0.2,
      return_citations: true,
      return_images: false,
      search_recency_filter: mode === "news" ? "day" : "month",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Perplexity API error ${response.status}: ${err}`);
  }

  const data = await response.json() as any;
  const content = data.choices?.[0]?.message?.content || "";
  const citations: string[] = data.citations || [];

  return { content, citations, model };
}

// Streaming version for real-time responses
export async function* streamPerplexity(
  query: string,
  mode: string = "web",
  conversationHistory: Array<{ role: string; content: string }> = []
): AsyncGenerator<{ type: "delta" | "citations" | "done"; content?: string; citations?: string[] }> {
  if (!PPLX_API_KEY) {
    throw new Error("PPLX_API_KEY not configured");
  }

  const model = MODE_MODELS[mode] || MODE_MODELS.default;
  const systemPrompt = MODE_SYSTEM_PROMPTS[mode] || MODE_SYSTEM_PROMPTS.web;

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-10),
    { role: "user", content: query },
  ];

  const response = await fetch(`${PPLX_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${PPLX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 2048,
      temperature: 0.2,
      return_citations: true,
      stream: true,
      search_recency_filter: mode === "news" ? "day" : "month",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Perplexity API error ${response.status}: ${err}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let citations: string[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") {
        yield { type: "citations", citations };
        yield { type: "done" };
        return;
      }
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield { type: "delta", content: delta };
        if (parsed.citations) citations = parsed.citations;
      } catch { /* skip malformed chunks */ }
    }
  }

  yield { type: "citations", citations };
  yield { type: "done" };
}
