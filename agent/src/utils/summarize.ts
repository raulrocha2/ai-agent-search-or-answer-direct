import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { SummarizeInputSchema, SummarizeOutputSchema } from "./schemas";
import { getChatModel } from "../shared/models";
import {
  MAX_SUMMARY_INPUT_CHARS,
  MAX_SUMMARY_OUTPUT_CHARS,
} from "../shared/constants";

export async function summarize(text: string) {
  const { text: rawText } = SummarizeInputSchema.parse({ text });
  const clippedText = clipText(rawText, MAX_SUMMARY_INPUT_CHARS);
  const model = getChatModel({ temperature: 0.2 });
  const resLLM = await model.invoke([
    new SystemMessage(
      [
        "You are a helpful assistant that writes short, accurate summaries.",
        "Guidelines: ",
        "- be factual and neutral, avoid marketing language.",
        "- 5-8 sentences; no lists unless absolutely necessary.",
        "- Do not invent information; only summarize the content provided.",
        "- Keep it readable for beginners.",
      ].join("\n"),
    ),
    new HumanMessage(
      [
        "Summarize the following content for a beginner friendly audience:",
        "Focus on key facts and remove any unnecessary details.",
        "TEXT:",
        clippedText,
      ].join("\n"),
    ),
  ]);
  const rawModelOutput =
    typeof resLLM.content === "string"
      ? resLLM.content
      : String(resLLM.content);

  const cleanedOutput = removeWhitespace(rawModelOutput);
  return SummarizeOutputSchema.parse({
    summary: cleanedOutput,
  });
}

function clipText(text: string, maxLength: number) {
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function removeWhitespace(text: string) {
  const cleanedText = text
    .replace(/\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return cleanedText.slice(0, MAX_SUMMARY_OUTPUT_CHARS);
}
