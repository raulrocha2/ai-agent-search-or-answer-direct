import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { searchLcel } from "./router/search_lcel";

const app = express();
const port = process.env.PORT || 3001;
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
  }),
);
app.use(express.json());

app.get("/ping", (req: Request, res: Response) => {
  res.send("pong");
});

app.use("/search", searchLcel);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
