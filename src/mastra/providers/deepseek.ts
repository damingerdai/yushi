import { createOpenAI } from "@ai-sdk/openai";

const apiKey = process.env.DEEPSEEK_API_KEY;

if (!apiKey) {
  throw new Error("DEEPSEEK_API_KEY is not configured");
}

export const deepseek = createOpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey,
});
