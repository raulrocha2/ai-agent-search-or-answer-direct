import { Router } from "express";
import { runSearch } from "../search-tool/runBranch";
import { Request, Response } from "express";
import { SearchInputSchema } from "../utils/schemas";
import { ZodError } from "zod";
import {
  MAX_QUERY_LENGTH,
  THROTTLE_MAX_CONCURRENCY,
  THROTTLE_MAX_QUEUE_SIZE,
  THROTTLE_QUEUE_TIMEOUT_MS,
} from "../shared/constants";
import { createThrottle } from "../middleware/throttle";

const throttle = createThrottle({
  maxConcurrency: THROTTLE_MAX_CONCURRENCY,
  maxQueueSize: THROTTLE_MAX_QUEUE_SIZE,
  queueTimeoutMs: THROTTLE_QUEUE_TIMEOUT_MS,
});

export const searchLcel = Router();

searchLcel.post("/", throttle, async (req: Request, res: Response) => {
  try {
    if (
      typeof req.body?.query === "string" &&
      req.body.query.length > MAX_QUERY_LENGTH
    ) {
      res.status(400).json({
        error: `Query too long (max ${MAX_QUERY_LENGTH} characters).`,
      });
      return;
    }

    const input = SearchInputSchema.parse(req.body);
    const result = await runSearch(input);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: "Invalid request",
        details: error.issues.map((i) => i.message),
      });
      return;
    }
    console.error("Error in /search:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});
