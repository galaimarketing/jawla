import { stitchPhotosWithGeminiImage } from "@/lib/stitch-gemini-image";

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

    const generateRes = await fetch(`${this.baseUrl}/api/nano-banana-pro/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        prompt:
          "Multiple photos show the same interior room from different angles. " +
          "Generate ONE photorealistic equirectangular 360° panorama texture. " +
          "Output must be exactly 2:1 aspect (width = 2× height) for a spherical viewer — not 16:9. " +
          "Left and right image edges must tile seamlessly (360° wrap). " +
          "Blend all inputs; straight walls/lines stay straight in the mid band (no fisheye barrel look); no stretch/squash. " +
          "Consistent lighting; no text or logos.",
        mode: "edit",
        aspectRatio: "2:1",
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
        continue;
      }

      const statusData = (await statusRes.json()) as CheckStatusResponse;

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

export type StitchSource = "nanobanana" | "gemini" | "raw";

export type StitchBytesResult = {
  bytes: Uint8Array;
  contentType: string;
  fallback: boolean;
  source: StitchSource;
};

async function fetchUrlBytes(url: string): Promise<{ bytes: Uint8Array; contentType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
  const contentType = res.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
  return { bytes: new Uint8Array(await res.arrayBuffer()), contentType };
}

/**
 * Order: Nanobanana (when configured) → Gemini image (GEMINI_API_KEY) → first photo bytes.
 */
export async function stitchRoomToPanorama(photoUrls: string[]): Promise<StitchBytesResult> {
  if (photoUrls.length === 0) {
    throw new Error("No photos provided for stitching.");
  }

  const client = new NanobananaHttpClient();

  try {
    const result = await retry(() => client.createPanorama({ images: photoUrls }));
    const { bytes, contentType } = await fetchUrlBytes(result.panoramaUrl);
    return { bytes, contentType, fallback: false, source: "nanobanana" };
  } catch (error) {
    console.error("[stitch] Nanobanana unavailable or failed", error);
  }

  const geminiBytes = await stitchPhotosWithGeminiImage(photoUrls);
  if (geminiBytes?.length) {
    return {
      bytes: geminiBytes,
      contentType: "image/png",
      fallback: false,
      source: "gemini",
    };
  }

  console.warn("[stitch] Using raw first photo as panorama (expect stretch in viewer until you restitch).");
  const raw = await fetchUrlBytes(photoUrls[0]);
  return {
    bytes: raw.bytes,
    contentType: raw.contentType,
    fallback: true,
    source: "raw",
  };
}
