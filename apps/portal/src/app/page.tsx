"use client";

import { useRef, useState } from "react";
import { Check, Copy, FileDiff, GitBranch, LoaderCircle, Sparkles, Upload } from "lucide-react";
import { MAX_DIFF_BYTES, parseDiff, type ParsedDiff } from "@/lib/diff";

type UploadState = { name: string; raw: string; parsed: ParsedDiff };

export default function Home() {
  const [upload, setUpload] = useState<UploadState>();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const version = useRef(0);
  const controller = useRef<AbortController | null>(null);

  async function load(file?: File) {
    if (!file) return;
    const current = ++version.current;
    controller.current?.abort();
    setBusy(false); setReading(true); setError(""); setMessage(""); setCopied(false); setUpload(undefined);
    try {
      if (!/\.(diff|patch)$/i.test(file.name)) throw new Error("请选择 .diff 或 .patch 文件。");
      if (file.size > MAX_DIFF_BYTES) throw new Error("文件超过 100 KB，请拆分后上传。");
      const raw = await file.text();
      const parsed = parseDiff(raw);
      if (current === version.current) setUpload({ name: file.name, raw, parsed });
    } catch (cause) {
      if (current === version.current) setError(cause instanceof Error ? cause.message : "文件读取失败。");
    } finally { if (current === version.current) setReading(false); }
  }

  async function generate() {
    if (!upload || busy) return;
    const current = version.current;
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true); setError(""); setCopied(false);
    try {
      const response = await fetch("/api/commit-message", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diff: upload.raw }), signal: abort.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "生成失败，请重试。");
      if (current === version.current) setMessage(data.message);
    } catch (cause) {
      if (current === version.current && !abort.signal.aborted) setError(cause instanceof Error ? cause.message : "网络异常，请重试。");
    } finally { if (current === version.current) setBusy(false); }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(message); setCopied(true); }
    catch { setError("复制失败，请手动选择并复制提交说明。"); }
  }

  const files = upload?.parsed.files ?? [];
  const additions = files.reduce((sum, file) => sum + file.additions, 0);
  const deletions = files.reduce((sum, file) => sum + file.deletions, 0);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-8">
      <header className="flex items-center justify-between border-b pb-5">
        <a href="/" className="flex items-center gap-2 text-lg font-semibold"><GitBranch className="size-5" /> Yushi <span className="text-sm font-normal text-muted-foreground">/ Portal</span></a>
        <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">Diff → Commit</span>
      </header>
      <section className="py-9">
        <p className="mb-3 text-xs font-semibold tracking-widest text-muted-foreground">让每一次提交更清晰</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">读懂变更，写好提交。</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">上传 diff 或 patch，查看代码差异，再让 AI 为你总结 commit message。</p>
      </section>
      <section aria-label="上传变更文件" onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); void load(event.dataTransfer.files[0]); }} className={`relative rounded-xl border-2 border-dashed p-7 text-center transition-colors ${dragging ? "border-blue-500 bg-blue-50" : "border-border bg-muted/30"}`}>
        <Upload className="mx-auto mb-3 size-6 text-muted-foreground" />
        <label className="cursor-pointer font-medium" htmlFor="diff-upload">{reading ? "正在读取…" : upload ? upload.name : "拖放文件到这里，或点击选择文件"}</label>
        <input id="diff-upload" type="file" accept=".diff,.patch" className="absolute inset-0 h-full w-full cursor-pointer opacity-0 focus:opacity-100" aria-label="选择 diff 或 patch 文件" onChange={event => { void load(event.target.files?.[0]); event.target.value = ""; }} />
        <p className="mt-2 text-xs text-muted-foreground">.diff / .patch · 最大 100 KB · 生成时才会将变更发送给 AI</p>
      </section>
      {error && <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      <div className="my-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0" aria-label="文件差异">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-semibold"><FileDiff className="size-4" /> 文件变更 <span className="rounded-full bg-muted px-2 text-xs leading-6">{files.length}</span></h2>
            {upload && <p className="font-mono text-xs"><span className="text-green-700">+{additions}</span> <span className="text-red-700">−{deletions}</span></p>}
          </div>
          {!upload ? <div className="rounded-xl border px-6 py-20 text-center text-sm text-muted-foreground">上传文件后，在这里逐行查看代码变更。<p className="mt-3 font-mono text-xs">git diff &gt; changes.diff</p><p className="mt-2 font-mono text-xs">git format-patch -1 HEAD --stdout &gt; changes.patch</p></div> : <div className="space-y-4">{files.map((file, index) => (
            <details key={`${upload.name}-${index}`} open className="overflow-hidden rounded-lg border">
              <summary className="cursor-pointer break-all bg-muted/60 px-4 py-3 font-mono text-xs font-semibold">{file.name}<span className="ml-3 whitespace-nowrap font-normal"><span className="text-green-700">+{file.additions}</span> <span className="text-red-700">−{file.deletions}</span></span></summary>
              <div className="overflow-x-auto"><table className="diff-table w-full border-collapse font-mono text-xs" aria-label={`${file.name} 的代码差异`}><tbody>{file.lines.map((line, row) => <tr key={row} className={`diff-${line.kind}`}><td className="diff-number select-none">{line.old}</td><td className="diff-number select-none">{line.next}</td><td className="whitespace-pre py-0.5 pr-4">{line.text}</td></tr>)}</tbody></table></div>
            </details>
          ))}</div>}
        </section>
        <aside className="space-y-5 lg:sticky lg:top-6">
          {upload && (upload.parsed.messages.length > 0 || /\.patch$/i.test(upload.name)) && <section className="rounded-xl border p-5"><h2 className="mb-4 text-sm font-semibold">原始 commit message</h2>{upload.parsed.messages.length ? upload.parsed.messages.map((original, index) => <pre key={index} className="mb-3 whitespace-pre-wrap break-words rounded-lg bg-muted/60 p-3 font-mono text-xs leading-6">{original}</pre>) : <p className="text-sm text-muted-foreground">此 patch 未包含提交说明。</p>}</section>}
          <section className="rounded-xl border p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4" /> AI commit message</h2>
            <p className="mb-5 mt-2 text-xs leading-6 text-muted-foreground">根据代码变更生成符合 Angular 提交规范的说明。</p>
            <button type="button" disabled={!upload || busy || reading} onClick={() => void generate()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-40">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}{busy ? "正在分析变更…" : message ? "重新生成" : "生成 commit message"}</button>
            <div aria-live="polite" aria-busy={busy}>{message ? <><pre className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-muted/60 p-4 font-mono text-xs leading-6">{message}</pre><button type="button" onClick={() => void copy()} className="mt-3 flex items-center gap-2 text-xs">{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{copied ? "已复制" : "复制提交说明"}</button></> : <p className="mt-5 text-center text-xs text-muted-foreground">{busy ? "正在生成提交说明，请稍候。" : "生成的提交说明将显示在这里。"}</p>}</div>
          </section>
        </aside>
      </div>
      <footer className="border-t py-5 text-xs text-muted-foreground">Yushi · Clearer commits start here.</footer>
    </main>
  );
}
