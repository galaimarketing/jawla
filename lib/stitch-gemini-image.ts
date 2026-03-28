import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateImage } from "ai";

const MAX_REF_IMAGES = 6;

function googleImageProvider() {
  const apiKey =
    process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (!apiKey) return null;
  return createGoogleGenerativeAI({ apiKey });
}

/**
 * Fuse room photos into a single wide panorama using Gemini image models (2:1 when supported).
 * Returns null if no API key or generation fails.
 */
export async function stitchPhotosWithGeminiImage(photoUrls: string[]): Promise<Uint8Array | null> {
  const provider = googleImageProvider();
  if (!provider) return null;

  const buffers: Uint8Array[] = [];
  for (const url of photoUrls.slice(0, MAX_REF_IMAGES)) {
    const res = await fetch(url);
    if (!res.ok) continue;
    buffers.push(new Uint8Array(await res.arrayBuffer()));
  }
  if (buffers.length === 0) return null;

  const modelId =
    process.env.GEMINI_IMAGE_MODEL?.trim() || "gemini-2.5-flash-image";

  const promptText =
    "These are photos of the same interior room from different angles. " +
    "Generate ONE seamless equirectangular 360° panorama texture: 2:1 width-to-height ratio, " +
    "full 360° horizontal wrap, 180° vertical range, photorealistic, consistent lighting, " +
    "no text or logos. Blend overlaps naturally.";

  const prompt = {
    images: [...buffers],
    text: promptText,
  };

  try {
    const result = await generateImage({
      model: provider.image(modelId),
      aspectRatio: "2:1",
      prompt,
    });
    const file = result.image;
    if (file?.uint8Array?.length) return file.uint8Array;
  } catch (err) {
    console.warn("[stitch-gemini-image] 2:1 attempt failed, retrying with 16:9", err);
  }

  try {
    const result = await generateImage({
      model: provider.image(modelId),
      aspectRatio: "16:9",
      prompt,
    });
    const file = result.image;
    if (file?.uint8Array?.length) return file.uint8Array;
  } catch (err) {
    console.error("[stitch-gemini-image] generateImage failed", err);
  }

  return null;
}
