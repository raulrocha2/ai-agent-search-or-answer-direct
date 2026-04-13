import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { searchLcel } from "./router/search_lcel";
import { env } from "./shared/env";
import { JSON_BODY_LIMIT } from "./shared/constants";

const app = express();

app.use(
  cors({
    origin: env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()),
  }),
);

app.use(express.json({ limit: JSON_BODY_LIMIT }));

app.get("/ping", (_req: Request, res: Response) => {
  res.send("pong");
});

app.use("/search", searchLcel);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const server = app.listen(env.PORT, () => {
  console.log(`Server is running at http://localhost:${env.PORT}`);
});

function shutdown(signal: string) {
  console.log(`\n${signal} received — shutting down gracefully…`);
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});
