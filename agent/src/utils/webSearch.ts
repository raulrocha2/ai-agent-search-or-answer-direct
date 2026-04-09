import { Response } from "express";
import { env } from "../shared/env";
import {
  WebSearchResultSchema,
  WebSearchResults,
  WebSearchResultsSchema,
} from "./schemas";
import { tavily } from "@tavily/core";

export async function webSearch(query: string): Promise<WebSearchResults> {
  console.log("Searching with provider:", env.SEARCH_PROVIDER);
  console.log("Websearch Query:", query);
  const queryTrimmed = (query ?? "").trim();
  if (!queryTrimmed) return [];
  return searchTavily(queryTrimmed);
}

async function searchTavily(query: string): Promise<WebSearchResults> {
  if (!env.TAVILY_API_KEY)
    throw new Error("TAVILY_API_KEY is not set in environment variables");

  let responseTavily;
  try {
    const tavilyClient = await tavily({ apiKey: env.TAVILY_API_KEY });
    responseTavily = await tavilyClient.search(query, {
      maxResults: 5,
      searchDepth: "basic",
      includeContent: true,
      includeAnswers: false,
      includeImages: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Tavily search failed for "${query}": ${message}`);
  }

  if (!responseTavily?.results?.length) {
    throw new Error(
      `Tavily returned no results for "${query}": ${JSON.stringify(responseTavily)}`,
    );
  }
  const parsedResults = responseTavily.results.slice(0, 5).map((result) =>
    WebSearchResultSchema.parse({
      title: String(result.title ?? "").trim() || "Untitled",
      url: String(result.url ?? "").trim(),
      snippet: String(result.content ?? "")
        .trim()
        .slice(0, 220),
    }),
  );
  return WebSearchResultsSchema.parse(parsedResults);
}

async function safeText(res: Response) {
  try {
    return await res.json();
  } catch (error) {
    return "<no body data>";
  }
}
