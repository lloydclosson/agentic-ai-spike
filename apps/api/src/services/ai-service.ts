const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

interface AiQueryResult {
  answer: string;
  confidence: number;
}

export async function queryAiService(query: string): Promise<AiQueryResult> {
  const response = await fetch(`${AI_SERVICE_URL}/api/v1/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI service error ${response.status}: ${text}`);
  }

  return response.json() as Promise<AiQueryResult>;
}
