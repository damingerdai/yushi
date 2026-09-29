import { createTool } from "@mastra/core/tools";
import z from "zod";

const inputSchema = z.object({
  repo: z.string(),
  staged: z.boolean().default(true),
});

const outputSchema = z.object({
  diff: z.string(),
  files: z.array(z.string()),
});

export async function readGitDiff(input: z.infer<typeof inputSchema>) {
  const { repo, staged } = input;
  const args = [
    "diff",
    ...(staged ? ["--cached"] : []),
    "--no-ext-diff",
    "--no-textconv",
    "--no-color",
  ];

  const diffProcess = Bun.spawn(["git", ...args], {
    cwd: repo,
    stdout: "pipe",
    stderr: "pipe",
  });

  const diff = await new Response(diffProcess.stdout).text();
  const stderr = await new Response(diffProcess.stderr).text();

  const exitCode = await diffProcess.exited;
  if (exitCode !== 0) {
    throw new Error(stderr);
  }

  const filesProcess = Bun.spawn(
    ["git", "diff", ...(staged ? ["--cached"] : []), "--name-only", "-z"],
    {
      cwd: repo,
      stdout: "pipe",
      stderr: "pipe",
    },
  );

  const filesOutput = await new Response(filesProcess.stdout).text();

  const filesError = await new Response(filesProcess.stderr).text();

  if ((await filesProcess.exited) !== 0) {
    throw new Error(filesError);
  }

  return {
    diff,
    files: filesOutput.split("\0").filter(Boolean),
  };
}

export const gitDiffTool = createTool({
  id: "read-git-diff",
  description: "Read local Git changes for commit message generation",

  inputSchema,
  outputSchema,

  execute: async (input) => {
    return readGitDiff(input);
  },
});
