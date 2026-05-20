import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      ndviBps: number;
      cropType?: string;
      region?: string;
    };

    const { ndviBps, cropType, region } = body;

    if (ndviBps === undefined || ndviBps === null) {
      return Response.json({ error: "ndviBps is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 },
      );
    }

    const ndviPercent = ((ndviBps / 100).toFixed(2)) + "%";
    const vegHealth =
      ndviBps > 6000
        ? "dense, healthy vegetation"
        : ndviBps > 4000
          ? "moderate vegetation"
          : ndviBps > 2000
            ? "sparse vegetation"
            : "very little vegetation (possibly bare soil or water)";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are an agricultural analyst. Given the following satellite NDVI data for a crop parcel, explain what it means in plain language (2-3 sentences max) and give a short harvest recommendation.

NDVI: ${ndviPercent} (${ndviBps} basis points)
Vegetation health classification: ${vegHealth}
${cropType ? `Crop type: ${cropType}` : ""}
${region ? `Region: ${region}` : ""}

Respond in JSON format:
{
  "summary": "plain language explanation of what this NDVI means",
  "recommendation": "short actionable recommendation for buyer/farmer",
  "healthLabel": "Healthy" | "Moderate" | "Needs Attention"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let parsed: { summary: string; recommendation: string; healthLabel: string };
    try {
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        summary: `NDVI at ${ndviPercent} indicates ${vegHealth}. This suggests the parcel has visible photosynthetic activity consistent with ${cropType || "vegetation"} growth.`,
        recommendation: ndviBps > 5000
          ? "Good conditions — proceed with the forward contract."
          : "Consider waiting for improved vegetation index before committing.",
        healthLabel: ndviBps > 5000 ? "Healthy" : ndviBps > 3000 ? "Moderate" : "Needs Attention",
      };
    }

    return Response.json({ ok: true, ...parsed, ndviBps, ndviPercent, vegHealth, cropType, region });
  } catch (err) {
    console.error("NDVI summary error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to generate NDVI summary" },
      { status: 500 },
    );
  }
}