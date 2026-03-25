import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export async function generateTourDescription(title: string, language: string) {
  if (!process.env.GEMINI_API_KEY) {
    return `${title} virtual tour`;
  }

  const result = await generateText({
    model: google("gemini-1.5-flash"),
    prompt: `Write a one-sentence public description for a real-estate style 360 tour. Title: ${title}. Language code: ${language}. Keep it concise and friendly.`,
  });

  return result.text.trim();
}
