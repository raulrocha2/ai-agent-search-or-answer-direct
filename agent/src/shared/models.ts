import { ChatGoogle } from "@langchain/google";
import { env } from "./env";
import { ChatOllama } from "@langchain/ollama";
import { ChatGroq } from "@langchain/groq";
import { ChatOpenAI } from "@langchain/openai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

type ModelOpts = {
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
};

export function getChatModel(opts: ModelOpts): BaseChatModel {
  const { temperature = 0.2, maxTokens = 1000, maxRetries = 3 } = opts;
  switch (env.MODEL_PROVIDER) {
    case "gemini":
      console.log("Using Gemini model:", env.GEMINI_MODEL);
      return new ChatGoogle({
        apiKey: env.GOOGLE_API_KEY,
        model: env.GEMINI_MODEL,
        temperature,
        maxRetries: maxRetries,
      });
    case "openai":
      console.log("Using OpenAI model:", env.OPENAI_MODEL);
      return new ChatOpenAI({
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL,
        temperature,
        maxTokens,
      });
    case "groq":
      console.log("Using Groq model:", env.GROQ_MODEL);
      return new ChatGroq({
        apiKey: env.GROQ_API_KEY,
        model: env.GROQ_MODEL,
        temperature,
        maxTokens,
      });
    case "ollama":
      console.log("Using Ollama model:", env.OLLAMA_MODEL);
      return new ChatOllama({
        model: env.OLLAMA_MODEL,
        temperature,
        maxRetries: maxRetries,
      });
    default:
      throw new Error(`Unsupported model provider: ${env.MODEL_PROVIDER}`);
  }
}
