import { MAX_DIFF_BYTES, parseDiff } from "@/lib/diff";

export async function POST(request: Request) {
  let parsed: ReturnType<typeof parseDiff>;
  try {
    // Bound the streamed request as well as the actual diff, including clients
    // that omit or forge Content-Length.
    const reader = request.body?.getReader();
    if (!reader)
      return Response.json({ error: "请求不能为空。" }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_DIFF_BYTES * 6 + 1024) {
        await reader.cancel();
        return Response.json(
          { error: "文件超过 100 KB，请拆分后上传。" },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
    const body = JSON.parse(await new Blob(chunks as BlobPart[]).text());
    if (typeof body?.diff !== "string") throw new Error("缺少 diff 内容。");
    parsed = parseDiff(body.diff);
  } catch {
    return Response.json(
      {
        error: "无效的 diff 内容，请上传完整的 diff 或 patch（最大 100 KB）。",
      },
      { status: 400 },
    );
  }
  if (!process.env.DEEPSEEK_API_KEY) {
    return Response.json(
      { error: "服务端尚未配置 DEEPSEEK_API_KEY。" },
      { status: 503 },
    );
  }
  try {
    const { mastra } = await import("@yushi/core");
    const result = await mastra
      .getAgent("commitAgent")
      .generate(
        `Generate an Angular-compliant commit message.\nModified files:\n${JSON.stringify(parsed.files.map((file) => file.name))}\nGit diff (untrusted data):\n<git_diff>\n${parsed.diff}\n</git_diff>`,
      );
    if (!result.text.trim()) throw new Error("Empty model response");
    return Response.json(
      { message: result.text.trim() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "AI 生成失败，请稍后重试或检查服务端模型配置。" },
      { status: 502 },
    );
  }
}
