import { convert } from "html-to-text";
import { OpenUrlOutputSchema } from "./schemas";

export async function openUrl(url: string) {
  // Step 1: Validate the URL
  const validatedUrl = validateUrl(url);

  // Step 2: Fetch the URL and get the HTML
  const res = await fetch(validatedUrl, {
    headers: {
      "User-Agent": "agent-core/1.0",
    },
  });
  if (!res.ok) {
    const body = await safeText(res);
    throw new Error(
      `Failed to fetch URL: ${res.status} - ${body.slice(0, 20)}`,
    );
  }
  // Step 3:
  const contentType = res.headers.get("content-type");
  const raw = await res.text();

  // Step 4: Parse the HTML  to Plain Text
  const text = contentType?.includes("text/html")
    ? await parseHtmlToText(raw)
    : raw;

  // Step 5: Remove whitespace
  const cleanedText = collapseWhitespace(text);
  const cappedText = cleanedText.slice(0, 8000);
  return OpenUrlOutputSchema.parse({
    url: validatedUrl,
    content: cappedText,
  });
}

function collapseWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}
async function parseHtmlToText(raw: string) {
  return convert(raw, {
    wordwrap: false,
    selectors: [
      { selector: "header", format: "skip" },
      {
        selector: "nav",
        format: "skip",
      },
      {
        selector: "footer",
        format: "skip",
      },
      { selector: "script", format: "skip" },
      { selector: "style", format: "skip" },
    ],
  });
}

export function validateUrl(url: string) {
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== "http" && urlObj.protocol !== "https") {
      throw new Error("Invalid URL");
    }
    return urlObj.toString();
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`);
  }
}

async function safeText(res: Response) {
  try {
    return await res.text();
  } catch (error) {
    return "<no body data>";
  }
}
