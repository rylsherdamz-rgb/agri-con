import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

function fallbackReply(userMessage: string, context?: string) {
  const lower = userMessage.toLowerCase();
  if (lower.includes("ndvi") || lower.includes("satellite")) {
    return "NDVI (Normalized Difference Vegetation Index) measures crop health from satellite imagery. Values above 60% indicate dense, healthy vegetation ready for harvest. Agri-Block uses Sentinel-2 data to verify crops before enabling purchases.";
  }
  if (lower.includes("buy") || lower.includes("purchase") || lower.includes("escrow")) {
    return "On Agri-Block, you can browse verified crop parcels with real NDVI data. Your USDC is held in escrow until delivery — the farmer gets 20% upfront and 70% on verified delivery, with 10% held in treasury as insurance.";
  }
  if (lower.includes("sell") || lower.includes("list") || lower.includes("mint")) {
    return "To sell crops, connect your Stellar wallet, register as a farmer, verify your ID, select your parcel, run satellite verification, then mint a Crop NFT. Buyers can then purchase it on the marketplace.";
  }
  if (lower.includes("nft") || lower.includes("token")) {
    return "Crop NFTs on Agri-Block represent real agricultural parcels. Each NFT contains crop type, quantity, price in USDC, harvest date, and satellite verification data — all settled on the Stellar blockchain.";
  }
  return "Agri-Block is a forward-contracts platform connecting farmers and buyers. Farmers mint verified Crop NFTs, buyers purchase with USDC held in escrow, and satellite data ensures transparency. How can I help you today?";
}

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

    const lastMessage = messages[messages.length - 1].content;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ ok: true, reply: fallbackReply(lastMessage, context) });
    }

    try {
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

      const result = await chat.sendMessage(lastMessage);
      const text = result.response.text();
      return Response.json({ ok: true, reply: text });
    } catch (geminiErr) {
      const msg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
      if (msg.includes("429") || msg.includes("quota") || msg.includes("Quota")) {
        return Response.json({ ok: true, reply: fallbackReply(lastMessage, context) });
      }
      throw geminiErr;
    }
  } catch (err) {
    console.error("AI chat error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to generate chat response" },
      { status: 500 },
    );
  }
}