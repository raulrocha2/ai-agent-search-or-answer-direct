import {
  RunnableBranch,
  RunnableLambda,
  RunnableSequence,
} from "@langchain/core/runnables";
import { SearchInputType, SearchOutputType } from "../utils/schemas";
import { webPipeline } from "./webPipeline";
import { directPath } from "./directPipeline";
import { routerStep } from "./routeStrategy";
import { finalValidate } from "./finalValidate";

const runBranch = RunnableBranch.from<SearchOutputType, any>([
  [(input) => input.mode === "web", webPipeline],
  directPath,
]);

export const runRouterStrategy = RunnableSequence.from([
  routerStep,
  runBranch,
  finalValidate,
]);

export async function runSearch(input: SearchInputType) {
  return await runRouterStrategy.invoke(input);
}
