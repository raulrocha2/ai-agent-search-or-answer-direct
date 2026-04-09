import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";
import { webSearch } from "../utils/webSearch";
import {
  SearchOutputType,
  StepComposeInputType,
  WebSearchOutputType,
} from "../utils/schemas";
import { openUrl } from "../utils/openUrl";
import { summarize } from "../utils/summarize";
import { getChatModel } from "../shared/models";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { candidate } from "./types";

const setTopResult = 5;

export const webSearchStep = RunnableLambda.from(
  async (input: SearchOutputType) => {
    const { query } = input;
    const results = await webSearch(query);
    return {
      ...input,
      results,
    };
  },
);

export const openAndSummarizeStep = RunnableLambda.from(
  async (input: WebSearchOutputType) => {
    const { results } = input;
    if (!Array.isArray(results) || results.length === 0) {
      return {
        ...input,
        pageSummaries: [],
        fallback: "no-results" as const,
      };
    }
    const extractTopResult = results.slice(0, setTopResult);
    const settledResults = await Promise.allSettled(
      extractTopResult.map(async (result) => {
        const openedUrl = await openUrl(result.url);
        const summarizedContent = await summarize(openedUrl.content);
        return {
          url: openedUrl.url,
          summary: summarizedContent.summary,
        };
      }),
    );
    const pageSummaries = settledResults
      .map((result) => (result.status === "fulfilled" ? result.value : null))
      .filter(
        (summary): summary is NonNullable<typeof summary> => summary !== null,
      );

    // Edge case: if no summaries are found, use the snippets as fallback
    if (pageSummaries.length === 0) {
      const fallbackSummaries = extractTopResult
        .map((result) => ({
          url: result.url,
          summary: String(result.snippet || result.title || "").trim(),
        }))
        .filter((summary) => summary.summary.length > 0);
      return {
        ...input,
        pageSummaries: fallbackSummaries,
        fallback: "snippets" as const,
      };
    }
    return {
      ...input,
      pageSummaries,
      fallback: "none" as const,
    };
  },
);

export const composeStep = RunnableLambda.from(
  async (input: StepComposeInputType): Promise<candidate> => {
    const { query, mode, fallback, pageSummaries } = input;
    const model = getChatModel({ temperature: 0.2 });
    if (!pageSummaries || pageSummaries.length === 0) {
      const directResponseFromModel = await model.invoke([
        new SystemMessage(
          [
            "You answer briefly and clearly for beginners",
            "If unsure, say so",
          ].join("\n"),
        ),
        new HumanMessage(query),
      ]);

      const directResponse = (
        typeof directResponseFromModel.content === "string"
          ? directResponseFromModel.content
          : String(directResponseFromModel.content)
      ).trim();
      return {
        mode: "direct",
        answer: directResponse,
        sources: [],
      };
    }

    const webResponseFromModel = await model.invoke([
      new SystemMessage(
        [
          "You concisely answer questions using provided page summaries",
          "Rules:",
          "- Be accurate and netral",
          "- 5-8 sentences max",
          "- Use only the provided summaries; do not invent new facts",
        ].join("\n"),
      ),
      new HumanMessage(
        [
          `Question: ${query}`,
          "Summaries:",
          JSON.stringify(pageSummaries, null, 2),
        ].join("\n"),
      ),
    ]);

    const finalAns =
      typeof webResponseFromModel.content === "string"
        ? webResponseFromModel.content
        : String(webResponseFromModel.content);

    const extractSources = pageSummaries.map((x) => x.url);

    return {
      answer: finalAns,
      sources: extractSources,
      mode: "web",
    };
  },
);

export const webPipeline = RunnableSequence.from([
  webSearchStep,
  openAndSummarizeStep,
  composeStep,
]);
