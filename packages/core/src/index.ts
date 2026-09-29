import { Mastra } from "@mastra/core";
import { commitAgent } from "./agents/commit-agent";

export const mastra = new Mastra({
  agents: {
    commitAgent,
  },
});
