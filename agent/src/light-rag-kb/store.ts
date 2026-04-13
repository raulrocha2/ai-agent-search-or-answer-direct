import { OpenAIEmbeddings } from "@langchain/openai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";

type Provider = "openai" | "google" | "groq" | "ollama";

function getProvider(): Provider {
  const provider = (process.env.MODEL_PROVIDER ?? "openai").toLowerCase();
  switch (provider) {
    case "openai":
      return "openai";
    case "gemini":
      return "google";
    case "groq":
      return "groq";
    case "ollama":
      return "ollama";
    default:
      return "openai";
  }
}

function makeOpenAiEmbeddings() {
  const key = process.env.OPENAI_API_KEY ?? "";
  if (!key) {
    throw new Error("Openai api key is missing");
  }
  console.log("Openai model embedding: ", process.env.RAG_MODEL_EMBEDDING);
  return new OpenAIEmbeddings({
    apiKey: key,
    model: process.env.RAG_MODEL_EMBEDDING ?? "text-embedding-3-small",
  });
}

function makeGoogleEmbeddings() {
  const key = process.env.GOOGLE_API_KEY ?? "";
  if (!key) {
    throw new Error("Google api key is missing");
  }
  console.log("Google model embedding: ", process.env.RAG_MODEL_EMBEDDING);
  return new GoogleGenerativeAIEmbeddings({
    apiKey: key,
    model: process.env.RAG_MODEL_EMBEDDING ?? "gemini-embedding-001",
    taskType: TaskType.RETRIEVAL_DOCUMENT,
  });
}

function makeEmbeddings(provider: Provider) {
  switch (provider) {
    case "openai":
      console.log("Making openai embeddings");
      return makeOpenAiEmbeddings();
    case "google":
      console.log("Making google embeddings");
      return makeGoogleEmbeddings();
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

let store: MemoryVectorStore | null = null;
let currentSetProvider: Provider | null = null;

export function getVectorStore(): MemoryVectorStore {
  const provider = getProvider();
  if (store && currentSetProvider === provider) {
    return store;
  }
  currentSetProvider = provider;
  store = new MemoryVectorStore(makeEmbeddings(provider));
  return store;
}

export async function addChunks(chunks: Document[]): Promise<number> {
  if (!Array.isArray(chunks) || chunks.length === 0) return 0;
  const store = getVectorStore();
  await store.addDocuments(chunks);
  return chunks.length;
}

export function resetVectorStore() {
  store = null;
  currentSetProvider = null;
}
