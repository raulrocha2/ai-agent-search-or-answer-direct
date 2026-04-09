import { RunnableLambda } from "@langchain/core/runnables";
import { SearchOutputType } from "../utils/schemas";
import { getChatModel } from "../shared/models";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export const directPath = RunnableLambda.from(
  async (input: SearchOutputType) => {
    const { query } = input;
    const model = getChatModel({ temperature: 0.2 });
    const directResponseFromModel = await model.invoke([
      new SystemMessage(
        [
          "You answer briefly and clearly for beginners",
          "If unsure, say so",
        ].join("\n"),
      ),
      new HumanMessage(query),
    ]);

    const directResponse = (
      typeof directResponseFromModel.content === "string"
        ? directResponseFromModel.content
        : String(directResponseFromModel.content)
    ).trim();
    return {
      mode: "direct",
      answer: directResponse,
      sources: [],
    };
  },
);
