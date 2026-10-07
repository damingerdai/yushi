import { afterAll, expect, mock, test } from "bun:test";

// Actions receive server-owned headers from Next's request context.
mock.module("next/headers", () => ({ headers: async () => new Headers() }));
const { generateCommitMessageAction, loadPullRequestAction } = await import(
  "../apps/portal/src/app/actions"
);
const diff =
  "diff --git a/a.ts b/a.ts\n--- a/a.ts\n+++ b/a.ts\n@@ -1 +1 @@\n-before\n+after\n";
const originalKey = process.env.DEEPSEEK_API_KEY;
afterAll(() => {
  if (originalKey === undefined) delete process.env.DEEPSEEK_API_KEY;
  else process.env.DEEPSEEK_API_KEY = originalKey;
});

test("actions reject invalid and oversized input before external access", async () => {
  for (const value of [undefined, 42, "hello", "x".repeat(100_001)]) {
    const result = await generateCommitMessageAction(value);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Invalid diff");
  }
  for (const options of [
    { type: "feat\nfix" },
    { footer: 42 },
    { footer: "x".repeat(4001) },
    null,
  ]) {
    const result = await generateCommitMessageAction(diff, options);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Invalid commit options");
  }
  for (const url of [
    42,
    "invalid",
    "https://example.com/pull/1",
    "x".repeat(2049),
  ]) {
    const result = await loadPullRequestAction(url);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("GitHub PR");
  }
});

test("action returns a serializable missing-configuration error", async () => {
  delete process.env.DEEPSEEK_API_KEY;
  const result = await generateCommitMessageAction(diff);
  expect(result).toEqual({
    ok: false,
    error: "DEEPSEEK_API_KEY is not configured on the server.",
  });
  expect(JSON.parse(JSON.stringify(result))).toEqual(result);
});

const generate = mock(
  async (_prompt: string): Promise<{ text: string }> => ({
    text: "  feat(core): improve validation\n\nExplain why validation is needed.  ",
  }),
);
mock.module("@yushi/core", () => ({
  mastra: { getAgent: () => ({ generate }) },
}));

test("generation returns trimmed text and forwards selected options", async () => {
  process.env.DEEPSEEK_API_KEY = "test-only";
  const options = { type: "release", scope: "core", footer: "Fixes #123" };
  const result = await generateCommitMessageAction(diff, options);
  expect(result).toEqual({
    ok: true,
    data: {
      message:
        "feat(core): improve validation\n\nExplain why validation is needed.",
    },
  });
  expect(generate.mock.calls.at(-1)?.[0]).toContain(JSON.stringify(options));
});

test("empty model responses and failures return safe action errors", async () => {
  process.env.DEEPSEEK_API_KEY = "test-only";
  generate.mockImplementationOnce(async () => ({ text: "  " }));
  const empty = await generateCommitMessageAction(diff);
  expect(empty.ok).toBe(false);
  generate.mockImplementationOnce(async () => {
    throw new Error("private provider diagnostic");
  });
  const failed = await generateCommitMessageAction(diff);
  expect(failed.ok).toBe(false);
  expect(JSON.stringify(failed)).not.toContain("private provider diagnostic");
});
