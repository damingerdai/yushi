import {
  buildCommitPrompt,
  type CommitOptions,
  commitOptionsSchema,
} from "@yushi/core/commit-options";
import { MAX_DIFF_BYTES, parseDiff } from "@/lib/diff";
import { rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = await rateLimitResponse("commit-message", request);
  if (limited) return limited;
  let options: CommitOptions;
  let parsed: ReturnType<typeof parseDiff>;
  try {
    // Bound the streamed request as well as the actual diff, including clients
    // that omit or forge Content-Length.
    const reader = request.body?.getReader();
    if (!reader)
      return Response.json(
        { error: "The request body must not be empty." },
        { status: 400 },
      );
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_DIFF_BYTES * 6 + 32_768) {
        await reader.cancel();
        return Response.json(
          {
            error: "The file exceeds 100 KB. Please split it before uploading.",
          },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
    const body = JSON.parse(await new Blob(chunks as BlobPart[]).text());
    if (typeof body?.diff !== "string")
      throw new Error("Diff content is missing.");
    parsed = parseDiff(body.diff);
    const selected = commitOptionsSchema.safeParse(body.options ?? {});
    if (!selected.success)
      return Response.json(
        { error: "Invalid commit options. Check type, scope, and footer." },
        { status: 400 },
      );
    options = selected.data;
  } catch {
    return Response.json(
      {
        error:
          "Invalid diff content. Please upload a complete diff or patch (up to 100 KB).",
      },
      { status: 400 },
    );
  }
  if (!process.env.DEEPSEEK_API_KEY) {
    return Response.json(
      { error: "DEEPSEEK_API_KEY is not configured on the server." },
      { status: 503 },
    );
  }
  try {
    const { mastra } = await import("@yushi/core");
    const result = await mastra.getAgent("commitAgent").generate(
      buildCommitPrompt(
        parsed.diff,
        parsed.files.map((file) => file.name),
        options,
      ),
    );
    if (!result.text.trim()) throw new Error("Empty model response");
    return Response.json(
      { message: result.text.trim() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      {
        error:
          "AI generation failed. Please try again later or check the server model configuration.",
      },
      { status: 502 },
    );
  }
}
