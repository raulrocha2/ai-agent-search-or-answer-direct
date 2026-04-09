import { Router } from "express";
import { runSearch } from "../search-tool/runBranch";
import { Request, Response } from "express";
import { SearchInputSchema } from "../utils/schemas";

export const searchLcel = Router();

searchLcel.post("/", async (req: Request, res: Response) => {
  try {
    const input = SearchInputSchema.parse(req.body);

    const result = await runSearch(input);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in /search_lcel:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});
