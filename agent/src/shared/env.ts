import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("3001"),
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000"),
  SEARCH_PROVIDER: z.enum(["tavily", "google"]),
  TAVILY_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  GROQ_MODEL: z.string().default("groq-1"),
  OLLAMA_MODEL: z.string().default("llama3.1:latest"),
  MODEL_PROVIDER: z
    .enum(["gemini", "openai", "groq", "ollama"])
    .default("gemini"),
});

export const env = envSchema.parse(process.env);

export function loadEnv(): void {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment variables:", result.error.format());
    process.exit(1);
  }
}
