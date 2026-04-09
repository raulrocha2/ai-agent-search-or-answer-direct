import { convert } from "html-to-text";
import { OpenUrlOutputSchema } from "./schemas";
import {
  MAX_CONTENT_CHARS,
  FETCH_TIMEOUT_MS,
  MAX_BODY_BYTES,
} from "../shared/constants";

export function validateUrl(url: string): string {
  const urlObj = new URL(url);
  if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
    throw new Error(`Invalid protocol: ${urlObj.protocol}`);
  }
  return urlObj.toString();
}

async function readBodyWithLimit(
  res: globalThis.Response,
  maxBytes: number,
): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) throw new Error("Response has no body");

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.length;
      if (totalBytes > maxBytes) {
        chunks.push(value.slice(0, value.length - (totalBytes - maxBytes)));
        break;
      }
      chunks.push(value);
    }
  } finally {
    reader.cancel();
  }

  const combined = new Uint8Array(
    chunks.reduce((sum, c) => sum + c.length, 0),
  );
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(combined);
}

export async function openUrl(url: string) {
  const validatedUrl = validateUrl(url);

  const res = await fetch(validatedUrl, {
    headers: { "User-Agent": "agent-core/1.0" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    const body = await safeText(res);
    throw new Error(
      `Failed to fetch URL: ${res.status} - ${body.slice(0, 200)}`,
    );
  }

  const contentType = res.headers.get("content-type");
  const raw = await readBodyWithLimit(res, MAX_BODY_BYTES);

  const text = contentType?.includes("text/html")
    ? parseHtmlToText(raw)
    : raw;

  const cleanedText = collapseWhitespace(text);
  const cappedText = cleanedText.slice(0, MAX_CONTENT_CHARS);

  return OpenUrlOutputSchema.parse({
    url: validatedUrl,
    content: cappedText,
  });
}

function collapseWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function parseHtmlToText(raw: string) {
  return convert(raw, {
    wordwrap: false,
    selectors: [
      { selector: "header", format: "skip" },
      { selector: "nav", format: "skip" },
      { selector: "footer", format: "skip" },
      { selector: "script", format: "skip" },
      { selector: "style", format: "skip" },
    ],
  });
}

async function safeText(res: globalThis.Response) {
  try {
    return await res.text();
  } catch {
    return "<no body data>";
  }
}
