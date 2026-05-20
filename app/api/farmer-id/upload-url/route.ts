export const runtime = "nodejs";

type Body = {
  farmerAddress: string;
  fileName: string;
  contentType: string;
};

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body?.farmerAddress || !body?.fileName || !body?.contentType) {
      return Response.json(
        { ok: false, error: "Missing farmerAddress, fileName, or contentType" },
        { status: 400 },
      );
    }

    const bucketName = process.env.GCP_FARMER_ID_BUCKET ?? "";
    if (!bucketName) {
      return Response.json(
        { ok: false, error: "Missing GCP_FARMER_ID_BUCKET env var" },
        { status: 400 },
      );
    }

    type StorageLike = new (opts?: { credentials?: Record<string, unknown> }) => {
      bucket: (name: string) => {
        file: (path: string) => {
          getSignedUrl: (opts: {
            version: "v4";
            action: "write";
            expires: number;
            contentType: string;
          }) => Promise<[string]>;
        };
      };
    };

    let StorageCtor: StorageLike;
    try {
      const dynamicImport = new Function(
        "moduleName",
        "return import(moduleName);",
      ) as (moduleName: string) => Promise<Record<string, unknown>>;
      const storageModule = await dynamicImport("@google-cloud/storage");
      StorageCtor = storageModule.Storage as StorageLike;
    } catch {
      return Response.json(
        {
          ok: false,
          error:
            "Google Cloud Storage SDK not installed. Run: npm i @google-cloud/storage",
        },
        { status: 500 },
      );
    }

    const serviceAccountJson = process.env.GCP_SERVICE_ACCOUNT_JSON;
    const storage = serviceAccountJson
      ? new StorageCtor({ credentials: JSON.parse(serviceAccountJson) })
      : new StorageCtor();

    const safeName = sanitizeFileName(body.fileName);
    const objectPath = `farmer-ids/${body.farmerAddress}/${Date.now()}-${safeName}`;
    const file = storage.bucket(bucketName).file(objectPath);

    const [uploadUrl] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000,
      contentType: body.contentType,
    });

    return Response.json({
      ok: true,
      bucket: bucketName,
      objectPath,
      uploadUrl,
      expiresInSeconds: 900,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create upload URL";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
