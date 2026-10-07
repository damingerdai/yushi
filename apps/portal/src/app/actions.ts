"use server";

import {
  buildCommitPrompt,
  commitOptionsSchema,
} from "@yushi/core/commit-options";
import { fetchPublicPullRequest, PullRequestError } from "@yushi/github";
import { headers } from "next/headers";
import { MAX_DIFF_BYTES, parseDiff } from "@/lib/diff";
import { validatePullRequestDiff } from "@/lib/pull-request-diff";
import { checkRateLimit } from "@/lib/rate-limit";

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; retryAfter?: number };

export async function loadPullRequestAction(
  url: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof fetchPublicPullRequest>>>> {
  const limited = await checkRateLimit("pull-request", await headers());
  if (limited) return { ok: false, ...limited };
  if (typeof url !== "string" || url.length > 2048)
    return {
      ok: false,
      error:
        "Enter a valid public GitHub PR URL, such as https://github.com/owner/repo/pull/123.",
    };
  try {
    const result = await fetchPublicPullRequest(url, {
      maxDiffBytes: MAX_DIFF_BYTES,
    });
    validatePullRequestDiff(result);
    return { ok: true, data: result };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof PullRequestError
          ? error.message
          : "Unable to load the PR. Please try again later.",
    };
  }
}

export async function generateCommitMessageAction(
  diff: unknown,
  options: unknown = {},
): Promise<ActionResult<{ message: string }>> {
  const limited = await checkRateLimit("commit-message", await headers());
  if (limited) return { ok: false, ...limited };
  let parsed: ReturnType<typeof parseDiff>;
  try {
    if (typeof diff !== "string") throw new Error("Missing diff");
    parsed = parseDiff(diff);
  } catch {
    return {
      ok: false,
      error:
        "Invalid diff content. Please upload a complete diff or patch (up to 100 KB).",
    };
  }
  const selected = commitOptionsSchema.safeParse(options);
  if (!selected.success)
    return {
      ok: false,
      error: "Invalid commit options. Check type, scope, and footer.",
    };
  if (!process.env.DEEPSEEK_API_KEY)
    return {
      ok: false,
      error: "DEEPSEEK_API_KEY is not configured on the server.",
    };
  try {
    const { mastra } = await import("@yushi/core");
    const result = await mastra.getAgent("commitAgent").generate(
      buildCommitPrompt(
        parsed.diff,
        parsed.files.map((file) => file.name),
        selected.data,
      ),
    );
    if (!result.text.trim()) throw new Error("Empty model response");
    return { ok: true, data: { message: result.text.trim() } };
  } catch {
    return {
      ok: false,
      error:
        "AI generation failed. Please try again later or check the server model configuration.",
    };
  }
}
