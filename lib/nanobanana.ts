interface CreatePanoramaInput {
  images: string[];
}

interface NanobananaCreatePanoramaResult {
  panoramaUrl: string;
}

interface NanobananaClient {
  createPanorama(input: CreatePanoramaInput): Promise<NanobananaCreatePanoramaResult>;
}

class NanobananaHttpClient implements NanobananaClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = process.env.NANOBANANA_API_URL || "";
    this.apiKey = process.env.GEMINI_API_KEY || "";
  }

  async createPanorama(input: CreatePanoramaInput): Promise<NanobananaCreatePanoramaResult> {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error("Nanobanana API is not configured.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);

    try {
      // TODO: Replace this payload and endpoint with the exact Nano Banana Pro API shape.
      const response = await fetch(`${this.baseUrl}/panorama/stitch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ images: input.images }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Nanobanana request failed (${response.status}): ${text}`);
      }

      const data = (await response.json()) as { panoramaUrl?: string; output_url?: string };
      const panoramaUrl = data.panoramaUrl || data.output_url;

      if (!panoramaUrl) {
        throw new Error("Nanobanana response did not include panorama URL.");
      }

      return { panoramaUrl };
    } finally {
      clearTimeout(timeout);
    }
  }
}

async function retry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i <= retries; i += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i === retries) break;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }

  throw lastError;
}

export async function stitchRoomToPanorama(photoUrls: string[]): Promise<{ panoramaUrl: string; fallback: boolean }> {
  if (photoUrls.length === 0) {
    throw new Error("No photos provided for stitching.");
  }

  const client = new NanobananaHttpClient();

  try {
    const result = await retry(() => client.createPanorama({ images: photoUrls }));
    return { panoramaUrl: result.panoramaUrl, fallback: false };
  } catch (error) {
    console.error("Nanobanana stitching failed, using fallback", error);
    // Fallback mode for MVP: keep the first image as pseudo-panorama.
    return { panoramaUrl: photoUrls[0], fallback: true };
  }
}
