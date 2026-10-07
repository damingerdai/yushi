import { describe, expect, test } from "bun:test";
import {
  buildCommitPrompt,
  commitOptionsSchema,
} from "../packages/core/src/commit-options";

describe("commit options", () => {
  test("keeps automatic defaults and normalizes blank fields", () => {
    expect(commitOptionsSchema.parse({})).toEqual({});
    expect(
      commitOptionsSchema.parse({ type: "  ", scope: "" }).type,
    ).toBeUndefined();
  });
  test("accepts custom types and multiline footers", () => {
    const options = {
      type: "release",
      scope: "core/api",
      footer: "BREAKING CHANGE: migrate config\n\nFixes #123",
    };
    expect(commitOptionsSchema.parse(options)).toEqual(options);
    expect(buildCommitPrompt("+change", ["file.ts"], options)).toContain(
      JSON.stringify(options),
    );
  });
  test("rejects malformed headers, controls, oversized fields, and non-string values", () => {
    for (const options of [
      { type: "feat\nfix" },
      { type: "Feat" },
      { scope: "core): fake" },
      { footer: "a\u0000b" },
      { footer: "a".repeat(4001) },
      { scope: 123 },
      { type: "a".repeat(25) },
      { scope: "a".repeat(41) },
      { extra: true },
    ]) {
      expect(commitOptionsSchema.safeParse(options).success).toBe(false);
    }
  });
});
