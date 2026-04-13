import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getVectorStore } from "./store";
import { getChatModel } from "../shared/models";

export type KBSource = {
  source: string;
  chunkId: number;
};

export type KBAskResult = {
  answer: string;
  sources: KBSource[];
  confidence: number;
};

export async function askKB(
  query: string,
  k: number = 2, // default to 2 chunks
): Promise<KBAskResult> {
  const validateQuery = (query ?? "").trim();
  if (!validateQuery) {
    throw new Error("Query is empty. Please provide a valid query.");
  }

  const store = getVectorStore();
  const embedQuery = await store.embeddings.embedQuery(validateQuery);

  // pairs looks like this below
  // [
  //     [Document {pageContent, metadata}],[Document {pageContent, metadata}]
  // ]

  const pairs = await store.similaritySearchVectorWithScore(embedQuery, k);
  const chunks = pairs.map(([doc]) => ({
    text: doc.pageContent ?? "",
    meta: doc.metadata ?? {},
  }));
  const scores = pairs.map(([_, score]) => Number(score));
  const context = buildContext(chunks);
  const answer = await askModelWithContext(validateQuery, context);

  const sources: KBSource[] = chunks.map((c) => ({
    source: String(c.meta?.source ?? "unknown"),
    chunkId: Number(c.meta?.chunkId) ?? 0,
  }));

  const confidence = buildConfidence(scores);
  return { answer, sources, confidence };
}

function buildConfidence(scores: number[]): number {
  if (!scores.length) return 0;
  const clamped = scores.map((score) => Math.max(0, Math.min(1, score))); // 0.5
  const avg = clamped.reduce((a, b) => a + b, 0) / scores.length;

  return Math.round(avg * 100) / 100; // -> 2 decimal places
}

async function askModelWithContext(query: string, context: string) {
  const model = getChatModel({ temperature: 0.2 });

  const res = await model.invoke([
    new SystemMessage(
      [
        "You are a helpful assistant that answers only using the provided context.",
        "If the answer is not found in the current context, say so briefly",
        "Be concise (4 - 5 sentences), neutral, and avoid any marketing info.",
        "Do not fabricate sources or cite anything that is not in the context",
      ].join("\n"),
    ),

    new HumanMessage(
      [
        `Question:\n${query}`,
        "",
        "Context: (quoted chunks) ->",
        context || "no relevant context",
      ].join("\n"),
    ),
  ]);

  const finalRes =
    typeof res.content === "string" ? res.content : String(res.content);

  return finalRes.trim().slice(0, 1500);
}
// 2 chunks
// [#1] doc.md #0
// [#2] doc.md #1

function buildContext(chunks: { text: string; meta: any }[]) {
  return chunks
    .map(({ text, meta }, i) =>
      [
        `[#${i + 1}] ${String(meta?.source ?? "unknown")} #${String(
          meta?.chunkId ?? "?",
        )}`,
        text ?? "Empty text",
      ].join("\n"),
    )
    .join("\n\n---\n\n");
}
