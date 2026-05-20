import { GoogleGenerativeAI } from "@google/generative-ai";

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 },
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPrompt = `You are AgriAI, an agricultural assistant for the Agri-Block platform. You help farmers and buyers understand:
- Satellite NDVI data and what vegetation health means for crop yields
- Weather impacts on harvest predictions
- Forward contract terms (USDC escrow, payment splits)
- When to buy or sell crop NFTs on the Stellar blockchain

Keep answers concise (2-4 sentences). Use plain language.${context ? `\n\nCurrent context: ${context}` : ""}`;

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      systemInstruction: { role: "user", parts: [{ text: systemPrompt }] },
      history,
    });

    const result = await chat.sendMessage(messages[messages.length - 1].content);
    const text = result.response.text();

    return Response.json({ ok: true, reply: text });
  } catch (err) {
    console.error("AI chat error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to generate chat response" },
      { status: 500 },
    );
  }
}