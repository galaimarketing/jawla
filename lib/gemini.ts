import { google } from "@ai-sdk/google";
import { generateText } from "ai";

function fallbackDescription(title: string, language: string) {
  if (language === "ar") {
    return `جولة افتراضية 360°: ${title}`;
  }
  return `${title} — interactive 360° virtual tour`;
}

/**
 * Best-effort marketing blurb; never throws. Publishing must not depend on AI availability.
 */
export async function generateTourDescription(title: string, language: string) {
  if (!process.env.GEMINI_API_KEY?.trim()) {
    return fallbackDescription(title, language);
  }

  try {
    const result = await generateText({
      model: google("gemini-2.0-flash"),
      prompt: `Write a one-sentence public description for a real-estate style 360 tour. Title: ${title}. Language code: ${language}. Keep it concise and friendly.`,
    });
    const text = result.text.trim();
    return text || fallbackDescription(title, language);
  } catch {
    return fallbackDescription(title, language);
  }
}
