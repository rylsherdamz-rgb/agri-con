const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1";

function getConfig() {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey || apiKey.trim() === "") return null;
  return { apiKey, model: process.env.AI_MODEL ?? "meta/llama-3.3-70b-instruct" };
}

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

    const ndviPercent = ((ndviBps / 100).toFixed(2)) + "%";
    const vegHealth =
      ndviBps > 6000
        ? "dense, healthy vegetation"
        : ndviBps > 4000
          ? "moderate vegetation"
          : ndviBps > 2000
            ? "sparse vegetation"
            : "very little vegetation (possibly bare soil or water)";

    const config = getConfig();
    if (!config) {
      const healthLabel = ndviBps > 5000 ? "Healthy" : ndviBps > 3000 ? "Moderate" : "Needs Attention";
      return Response.json({
        ok: true,
        summary: `NDVI at ${ndviPercent} indicates ${vegHealth}.`,
        recommendation: ndviBps > 5000 ? "Good conditions — proceed with the forward contract." : "Consider waiting for improved vegetation index before committing.",
        healthLabel,
        ndviBps, ndviPercent, vegHealth, cropType, region,
      });
    }

    const { apiKey, model } = config;

    const prompt = `You are an agricultural analyst. Given the following satellite NDVI data for a crop parcel, explain what it means in plain language (2-3 sentences max) and give a short harvest recommendation.

NDVI: ${ndviPercent} (${ndviBps} basis points)
Vegetation health classification: ${vegHealth}
${cropType ? `Crop type: ${cropType}` : ""}
${region ? `Region: ${region}` : ""}

Respond ONLY with valid JSON — no markdown, no code fences, no extra text:
{"summary":"plain language explanation","recommendation":"actionable recommendation","healthLabel":"Healthy"}`;

    const res = await fetch(`${NVIDIA_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You return ONLY valid JSON. No markdown, no backticks, no explanations outside the JSON object." },
          { role: "user", content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.3,
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

    const raw = (json.choices?.[0]?.message?.content ?? "").trim();
    let parsed: { summary: string; recommendation: string; healthLabel: string };
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        summary: raw.slice(0, 300) || `NDVI at ${ndviPercent} indicates ${vegHealth}.`,
        recommendation: ndviBps > 5000 ? "Good conditions — proceed with the forward contract." : "Consider waiting for improved vegetation index before committing.",
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