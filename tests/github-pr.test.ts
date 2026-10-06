import { expect, test } from "bun:test";
import { validatePullRequestDiff } from "../apps/portal/src/lib/pull-request-diff";

const result = {
  raw: "diff --git a/a.ts b/a.ts\n--- a/a.ts\n+++ b/a.ts\n@@ -1 +1 @@\n-before\n+after\n",
  pr: {
    url: "https://github.com/example/project/pull/12",
    title: "Update",
    number: 12,
    repository: "example/project",
    state: "open" as const,
    changedFiles: 1,
  },
};

test("portal validates diff completeness and file counts", () => {
  expect(validatePullRequestDiff(result).files).toHaveLength(1);
  expect(() =>
    validatePullRequestDiff({
      ...result,
      raw: result.raw.replace("+after\n", ""),
    }),
  ).toThrow("incomplete");
  expect(() =>
    validatePullRequestDiff({
      ...result,
      pr: { ...result.pr, changedFiles: 2 },
    }),
  ).toThrow("incomplete");
});

test("route returns a non-cacheable validation error through the workspace package", async () => {
  const { GET } = await import("../apps/portal/src/app/api/pull-request/route");
  const response = await GET(
    new Request("https://portal.test/api/pull-request?url=invalid"),
  );
  expect(response.status).toBe(400);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect((await response.json()).error).toContain("GitHub PR");
});
