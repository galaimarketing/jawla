interface CreatePanoramaInput {
  images: string[];
}

interface NanobananaCreatePanoramaResult {
  panoramaUrl: string;
}

interface GenerateResponse {
  success: boolean;
  generationId?: string;
  taskId?: string;
  status?: string;
  error?: string;
}

interface CheckStatusResponse {
  success: boolean;
  status: "pending" | "generating" | "completed" | "failed";
  imageUrl?: string;
  generationId?: string;
  progress?: number;
  error?: string;
}

interface NanobananaClient {
  createPanorama(input: CreatePanoramaInput): Promise<NanobananaCreatePanoramaResult>;
}

const POLL_INTERVAL_MS = 4_000;
const MAX_POLLS = 30;

class NanobananaHttpClient implements NanobananaClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = process.env.NANOBANANA_API_URL || "";
    this.apiKey = process.env.GEMINI_API_KEY || "";
  }

  async createPanorama(input: CreatePanoramaInput): Promise<NanobananaCreatePanoramaResult> {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error("Nanobanana API is not configured. Set NANOBANANA_API_URL and GEMINI_API_KEY.");
    }

    const limitedImages = input.images.slice(0, 8);

    // Step 1: submit generation task using edit mode
    const generateRes = await fetch(`${this.baseUrl}/api/nano-banana-pro/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        prompt:
          "Create a seamless equirectangular 360-degree panorama image from these room photos. " +
          "The output should be a single wide panoramic photograph suitable for a virtual tour viewer. " +
          "Maintain realistic lighting and perspective consistency.",
        mode: "edit",
        aspectRatio: "16:9",
        imageQuality: "2K",
        inputImageUrls: limitedImages,
      }),
    });

    if (!generateRes.ok) {
      const text = await generateRes.text();
      throw new Error(`Nanobanana generate failed (${generateRes.status}): ${text}`);
    }

    const generateData = (await generateRes.json()) as GenerateResponse;

    if (!generateData.success || !generateData.generationId) {
      throw new Error(`Nanobanana generate rejected: ${generateData.error || "unknown error"}`);
    }

    const { generationId } = generateData;
    console.log(`[nanobanana] Task created: ${generationId}`);

    // Step 2: poll for completion
    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

      const statusRes = await fetch(`${this.baseUrl}/api/nano-banana-pro/check-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ generationId }),
      });

      if (!statusRes.ok) {
        console.warn(`[nanobanana] Status poll ${i + 1} HTTP ${statusRes.status}`);
        continue;
      }

      const statusData = (await statusRes.json()) as CheckStatusResponse;
      console.log(`[nanobanana] Poll ${i + 1}: status=${statusData.status} progress=${statusData.progress ?? "?"}%`);

      if (statusData.status === "completed" && statusData.imageUrl) {
        return { panoramaUrl: statusData.imageUrl };
      }

      if (statusData.status === "failed") {
        throw new Error(`Nanobanana generation failed: ${statusData.error || "unknown"}`);
      }
    }

    throw new Error(`Nanobanana generation timed out after ${MAX_POLLS} polls.`);
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
    console.error("[nanobanana] Stitching failed, using fallback", error);
    return { panoramaUrl: photoUrls[0], fallback: true };
  }
}
