import { chunkText } from "./chunk";
import { addChunks } from "./store";

export type IngestTextInput = {
  text: string;
  source?: string;
};

export type IngestTextOutput = {
  chunkCount: number;
  source: string;
  docCount: number;
};

export async function ingestText(
  input: IngestTextInput,
): Promise<IngestTextOutput> {
  const raw = (input.text ?? "").trim();
  if (!raw) {
    throw new Error("Text is empty");
  }

  const source = input.source ?? "pasted-text";

  const chunks = chunkText(raw, source);
  const chunkCount = await addChunks(chunks);
  return { chunkCount, source, docCount: 1 };
}
