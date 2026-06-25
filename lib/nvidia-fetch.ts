import https from "node:https";

const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1";

/**
 * Make an HTTPS request to NVIDIA API with HTTP/1.1 only
 * (avoids HTTP/2 GOAWAY issues). Includes automatic retry on socket errors.
 */
export function nvidiaFetch(
  path: string,
  options: { method: string; headers: Record<string, string>; body: string },
  retries = 1,
): Promise<{ ok: boolean; status: number; text: () => Promise<string>; json: () => Promise<unknown> }> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${NVIDIA_BASE}${path}`);
    const attempt = (remaining: number) => {
      const req = https.request(
        {
          hostname: url.hostname,
          path: url.pathname + url.search,
          method: options.method,
          headers: options.headers,
          ALPNProtocols: ["http/1.1"],
        } as any,
        (res) => {
          let data = "";
          res.on("data", (chunk: Buffer) => (data += chunk.toString()));
          res.on("end", () => {
            const status = res.statusCode ?? 500;
            resolve({
              ok: status < 400,
              status,
              text: async () => data,
              json: async () => JSON.parse(data),
            });
          });
        },
      );
      req.on("error", (err) => {
        if (remaining > 0) {
          setTimeout(() => attempt(remaining - 1), 300 * (retries - remaining + 1) ** 2);
        } else {
          reject(err);
        }
      });
      req.setTimeout(8_000, () => {
        req.destroy(new Error("Request timeout"));
      });
      req.write(options.body);
      req.end();
    };
    attempt(retries);
  });
}

export function getNvidiaConfig() {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey || apiKey.trim() === "") return null;
  return { apiKey, model: process.env.AI_MODEL ?? "meta/llama-3.3-70b-instruct" };
}