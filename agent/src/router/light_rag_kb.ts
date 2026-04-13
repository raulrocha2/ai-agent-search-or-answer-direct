import { Router } from "express";
import { Request, Response } from "express";
import { KBAASKRAGInputSchema, KBARAGInputSchema } from "../utils/schemas";
import { ingestText } from "../light-rag-kb/ingest";
import { ZodError } from "zod";
import { resetVectorStore } from "../light-rag-kb/store";
import { askKB } from "../light-rag-kb/ask";

export const lightRagKbRouter = Router();

lightRagKbRouter.post("/ingest", async (req: Request, res: Response) => {
  try {
    const body = KBARAGInputSchema.parse(req.body);
    const result = await ingestText({
      text: body.query,
      source: body.source,
    });
    res.status(201).json({
      ok: true,
      ...result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: "Invalid request",
        details: error.issues.map((i) => i.message),
      });
      return;
    }
    console.error("Error in /ingest:", error);
    res.status(500).json({ error: "An error occurred while ingesting text." });
  }
});

lightRagKbRouter.post("reset", async (req: Request, res: Response) => {
  try {
    resetVectorStore();
    res
      .status(200)
      .json({ ok: true, message: "Vector store reset successfully." });
  } catch (error) {
    console.error("Error in /reset:", error);
    res
      .status(500)
      .json({ error: "An error occurred while resetting the KB." });
  }
});

lightRagKbRouter.post("/ask", async (req: Request, res: Response) => {
  try {
    const body = KBAASKRAGInputSchema.parse(req.body);
    const result = await askKB(body.query, body.k ?? 2);
    res.status(200).json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: "Invalid request",
        details: error.issues.map((i) => i.message),
      });
      return;
    }
    console.error("Error in /ask:", error);
    res.status(500).json({ error: "An error occurred while asking the KB." });
  }
});
