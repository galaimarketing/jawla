import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateImage } from "ai";

const MAX_REF_IMAGES = 8;

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
    "You are given multiple photographs of the SAME interior room (different viewpoints). " +
    "Generate exactly ONE new image: a photorealistic equirectangular 360° panorama texture. " +
    "CRITICAL OUTPUT SPECS: aspect ratio must be exactly 2:1 (width = 2× height), e.g. 4096×2048 or 2048×1024 pixels conceptually — " +
    "this is required for a spherical 360 viewer; do not output 16:9 or 4:3. " +
    "The left and right edges must match seamlessly for horizontal wrap (360°). " +
    "Use information from ALL input photos: merge walls, floor, ceiling consistently; no duplicated furniture at the seam. " +
    "Keep straight architectural lines straight in the central horizontal band (rectilinear / undistorted look); avoid fisheye barrel distortion and avoid stretching or squashing objects. " +
    "Even lighting, no text, no logos, no watermark.";

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
    console.error("[stitch-gemini-image] 2:1 generateImage failed", err);
  }

  // Never fall back to 16:9 — wrong aspect maps badly onto equirectangular viewers (seams, stretch).
  return null;
}
