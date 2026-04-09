import { z } from "zod";

export const WebSearchResultSchema = z.object({
  title: z.string().min(1),
  url: z.url(),
  snippet: z.string().min(1).optional().default(""),
});

export const WebSearchResultsSchema = z.array(WebSearchResultSchema).max(10);

export type WebSearchResults = z.infer<typeof WebSearchResultsSchema>;

export const OpenUrlInputSchema = z.object({
  url: z.url(),
});

export const OpenUrlOutputSchema = z.object({
  url: z.url(),
  content: z.string().min(1),
});

export const SummarizeInputSchema = z.object({
  text: z.string().min(50, "Text must be at least 50 characters long"),
});

export const SummarizeOutputSchema = z.object({
  summary: z.string().min(1),
});

export const SearchInputSchema = z.object({
  query: z.string().min(5, "Query is required please provide a query"),
});
export type SearchInputType = z.infer<typeof SearchInputSchema>;

export const SearchOutputSchema = z.object({
  query: z.string().min(5, "Query is required please provide a query"),
  mode: z.enum(["web", "direct"]),
});
export type SearchOutputType = z.infer<typeof SearchOutputSchema>;

export const WebSearchOutputSchema = z.object({
  query: z.string().min(5, "Query is required please provide a query"),
  mode: z.enum(["web", "direct"]),
  results: WebSearchResultsSchema,
});
export type WebSearchOutputType = z.infer<typeof WebSearchOutputSchema>;

export const StepComposeInputSchema = z.object({
  query: z.string().min(5, "Query is required please provide a query"),
  mode: z.enum(["web", "direct"]),
  fallback: z
    .enum(["no-results", "snippets", "none"])
    .optional()
    .default("none"),
  pageSummaries: z
    .array(
      z.object({
        url: z.url(),
        summary: z.string().min(1),
      }),
    )
    .optional()
    .default([]),
});
export type StepComposeInputType = z.infer<typeof StepComposeInputSchema>;

export const SearchAnswerSchema = z.object({
  answer: z.string().min(1),
  sources: z.array(z.url()).default([]),
});

export type SearchAnswerType = z.infer<typeof SearchAnswerSchema>;
