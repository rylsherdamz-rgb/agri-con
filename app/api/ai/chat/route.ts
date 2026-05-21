const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1";

function getConfig() {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error("NVIDIA_API_KEY not configured");
  return { apiKey, model: process.env.AI_MODEL ?? "meta/llama-3.3-70b-instruct" };
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
      context?: string;
    };
    const { messages, context } = body;

    if (!messages?.length) {
      return Response.json({ error: "messages array is required" }, { status: 400 });
    }

    const { apiKey, model } = getConfig();

    const systemPrompt = `You are AgriAI, an agricultural assistant for the Agri-Block platform on the Stellar blockchain. You help farmers and buyers understand:
- Satellite NDVI data and what vegetation health means for crop yields
- Weather impacts on harvest predictions
- Forward contract terms (USDC escrow, 20% upfront + 70% on delivery + 10% treasury)
- When to buy or sell crop NFTs

Keep answers concise (2-4 sentences). Use plain language.${context ? `\n\nCurrent context: ${context}` : ""}`;

    const apiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m) => ({
        role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
        content: m.content,
      })),
    ];

    const res = await fetch(`${NVIDIA_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: apiMessages,
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message: string };
    };

    if (!res.ok || json.error) {
      const msg = json.error?.message ?? `NVIDIA API returned ${res.status}`;
      return Response.json({ error: msg }, { status: 502 });
    }

    const reply = json.choices?.[0]?.message?.content ?? "";
    return Response.json({ ok: true, reply });
  } catch (err) {
    console.error("AI chat error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to generate response" },
      { status: 500 },
    );
  }
}