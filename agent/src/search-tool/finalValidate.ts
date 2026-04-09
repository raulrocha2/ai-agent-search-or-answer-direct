import { RunnableLambda } from "@langchain/core/runnables";
import { candidate } from "./types";
import { SearchAnswerSchema, SearchAnswerType } from "../utils/schemas";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getChatModel } from "../shared/models";

export const finalValidate = RunnableLambda.from(async (input: candidate) => {
  const finalDraft = {
    answer: input.answer,
    sources: input.sources,
  };
  const finalDraftSchema = SearchAnswerSchema.safeParse(finalDraft);
  if (finalDraftSchema.success) return finalDraftSchema.data;

  // one short repair
  const repairDraft = await repairSearchAnswer(finalDraft);
  const repairDraftSchema = SearchAnswerSchema.safeParse(repairDraft);
  if (repairDraftSchema.success) return repairDraftSchema.data;
});

async function repairSearchAnswer(obj: any): Promise<SearchAnswerType> {
  const model = getChatModel({ temperature: 0.2 });
  const response = await model.invoke([
    new SystemMessage(
      [
        "You fix json objects to match a given schema",
        "Respond only with valid json object",
        "Schema: {answer: string; sources: string[] (urls as strings) }",
      ].join("\n"),
    ),
    new HumanMessage(
      [
        "Make this exactly to the schema. Ensure sources is an array of URL strings",
        "Input JSON:",
        JSON.stringify(obj),
      ].join("\n\n"),
    ),
  ]);

  const text =
    typeof response.content === "string"
      ? response.content
      : String(response.content);

  const json = extractJson(text);

  return {
    answer: String(json?.answer ?? "").trim(),
    sources: Array.isArray(json?.sources) ? json?.sources?.map(String) : [],
  };
}

function extractJson(input: string) {
  const start = input.indexOf("{");
  const end = input.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return {};

  try {
    return JSON.parse(input.slice(start, end + 1));
  } catch {
    return {};
  }
}
