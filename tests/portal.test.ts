import { describe, expect, test } from "bun:test";
import { parseDiff } from "../apps/portal/src/lib/diff";

const diff = `diff --git a/example.ts b/example.ts
index 123..456 100644
--- a/example.ts
+++ b/example.ts
@@ -2,2 +2,3 @@
 same
-old
+new
+extra
`;

describe("portal diff parser", () => {
  test("counts changes and tracks both line numbers", () => {
    const file = parseDiff(diff).files[0]!;
    expect(file.name).toBe("example.ts");
    expect([file.additions, file.deletions]).toEqual([2, 1]);
    expect(file.lines.filter(l => l.kind === "add").map(l => l.next)).toEqual([3, 4]);
    expect(file.lines.find(l => l.kind === "delete")?.old).toBe(3);
  });
  test("extracts folded subjects and body, excluding diffstat and signature", () => {
    const patch = `From ${"a".repeat(40)} Mon Sep 17 00:00:00 2001\nFrom: Developer <dev@example.com>\nSubject: [PATCH 1/1] fix: update\n example\n\nExplain why.\n\n---\n example.ts | 3 ++-\n\n${diff}-- \n2.50.0\n`;
    expect(parseDiff(patch).messages).toEqual(["fix: update example\n\nExplain why."]);
    expect(parseDiff(patch).diff).not.toContain("2.50.0");
  });
  test("supports plain unified diffs, deleted and added files", () => {
    const parsed = parseDiff("--- /dev/null\n+++ b/new.txt\n@@ -0,0 +1 @@\n+hello\n--- a/old.txt\n+++ /dev/null\n@@ -1 +0,0 @@\n-bye\n");
    expect(parsed.files.map(f => f.name)).toEqual(["new.txt", "old.txt"]);
  });
  test("supports rename-only and binary changes", () => {
    expect(parseDiff("diff --git a/old b/new\nsimilarity index 100%\nrename from old\nrename to new\n").files[0]?.name).toBe("new");
    expect(parseDiff("diff --git a/a.png b/a.png\nBinary files a/a.png and b/a.png differ\n").files).toHaveLength(1);
  });
  test("decodes Git quoted UTF-8 paths", () => {
    expect(parseDiff('diff --git "a/\\344\\270\\255.txt" "b/\\344\\270\\255.txt"\n').files[0]?.name).toBe("中.txt");
  });
  test("handles CRLF and no-newline markers", () => {
    expect(parseDiff(diff.replace(/\n/g, "\r\n") + "\\ No newline at end of file\n").files[0]?.additions).toBe(2);
  });
  test("rejects empty, unrelated, binary, oversized and incomplete input", () => {
    for (const value of ["", "hello", "\0", "a".repeat(100_001), diff.replace("+extra\n", "")]) expect(() => parseDiff(value)).toThrow();
  });
});

describe("commit message API validation", () => {
  test("rejects malformed JSON and invalid diff before model access", async () => {
    const { POST } = await import("../apps/portal/src/app/api/commit-message/route");
    for (const body of ["{", JSON.stringify({ diff: "hello" }), JSON.stringify({ diff: 42 })]) {
      const response = await POST(new Request("http://localhost/api/commit-message", { method: "POST", body }));
      expect(response.status).toBe(400);
    }
  });
  test("enforces streamed body limit without trusting Content-Length", async () => {
    const { POST } = await import("../apps/portal/src/app/api/commit-message/route");
    const response = await POST(new Request("http://localhost/api/commit-message", { method: "POST", body: "x".repeat(602_000) }));
    expect(response.status).toBe(413);
  });
  test("reports missing server configuration", async () => {
    const { POST } = await import("../apps/portal/src/app/api/commit-message/route");
    const original = process.env.DEEPSEEK_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;
    try {
      const response = await POST(new Request("http://localhost/api/commit-message", { method: "POST", body: JSON.stringify({ diff }) }));
      expect(response.status).toBe(503);
    } finally {
      if (original !== undefined) process.env.DEEPSEEK_API_KEY = original;
    }
  });
});
