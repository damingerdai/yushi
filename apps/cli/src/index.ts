import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { mastra } from "@yushi/core";
import {
  buildCommitPrompt,
  commitOptionsSchema,
} from "@yushi/core/commit-options";
import { readGitDiff } from "@yushi/core/git-diff";

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    type: { type: "string" },
    scope: { type: "string" },
    footer: { type: "string" },
    repo: {
      type: "string",
      default: process.cwd(),
    },
    unstaged: {
      type: "boolean",
      default: false,
    },
  },
});

async function main() {
  const options = commitOptionsSchema.parse({
    type: values.type,
    scope: values.scope,
    footer: values.footer,
  });
  const repo = resolve(values.repo!);

  const { diff, files } = await readGitDiff({
    repo,
    staged: !values.unstaged,
  });

  if (!diff.trim()) {
    console.log("No Git changes found.");
    return;
  }

  // Prevent accidentally sending excessively
  // large diffs to the model.
  if (diff.length > 100_000) {
    throw new Error("Git diff is too large. Please split your changes.");
  }

  const agent = mastra.getAgent("commitAgent");

  const response = await agent.generate(
    buildCommitPrompt(diff, files, options),
  );

  console.log("\nSuggested commit message:\n");
  console.log(response.text);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
