"use client";

import type { PullRequestInfo } from "@yushi/github";
import {
  Check,
  Copy,
  FileDiff,
  GitBranch,
  LoaderCircle,
  Sparkles,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { readApiResponse } from "@/lib/api-response";
import { MAX_DIFF_BYTES, type ParsedDiff, parseDiff } from "@/lib/diff";

type UploadState = {
  name: string;
  raw: string;
  parsed: ParsedDiff;
  pr?: PullRequestInfo;
};

export default function CommitWorkspace({
  mode,
}: {
  mode: "upload" | "pull-request";
}) {
  const isPullRequest = mode === "pull-request";
  const [prUrl, setPrUrl] = useState("");
  const [upload, setUpload] = useState<UploadState>();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const version = useRef(0);
  const controller = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      version.current++;
      controller.current?.abort();
    },
    [],
  );

  function reset() {
    version.current++;
    controller.current?.abort();
    setBusy(false);
    setReading(false);
    setError("");
    setMessage("");
    setCopied(false);
    setUpload(undefined);
  }

  async function loadPullRequest() {
    reset();
    const current = version.current;
    const abort = new AbortController();
    controller.current = abort;
    setReading(true);
    try {
      const response = await fetch(
        `/api/pull-request?url=${encodeURIComponent(prUrl.trim())}`,
        { signal: abort.signal },
      );
      const data = await readApiResponse<{ raw: string; pr: PullRequestInfo }>(
        response,
      );
      const parsed = parseDiff(data.raw);
      if (current === version.current)
        setUpload({
          name: `${data.pr.repository}#${data.pr.number}`,
          raw: data.raw,
          parsed,
          pr: data.pr,
        });
    } catch (cause) {
      if (current === version.current && !abort.signal.aborted)
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load the PR. Please try again.",
        );
    } finally {
      if (current === version.current) setReading(false);
    }
  }

  async function load(file?: File) {
    if (!file) return;
    const current = ++version.current;
    controller.current?.abort();
    setBusy(false);
    setReading(true);
    setError("");
    setMessage("");
    setCopied(false);
    setUpload(undefined);
    try {
      if (!/\.(diff|patch)$/i.test(file.name))
        throw new Error("Please select a .diff or .patch file.");
      if (file.size > MAX_DIFF_BYTES)
        throw new Error(
          "The file exceeds 100 KB. Please split it before uploading.",
        );
      const raw = await file.text();
      const parsed = parseDiff(raw);
      if (current === version.current)
        setUpload({ name: file.name, raw, parsed });
    } catch (cause) {
      if (current === version.current)
        setError(
          cause instanceof Error ? cause.message : "Unable to read the file.",
        );
    } finally {
      if (current === version.current) setReading(false);
    }
  }

  async function generate() {
    if (!upload || busy) return;
    const current = version.current;
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setError("");
    setCopied(false);
    try {
      const response = await fetch("/api/commit-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diff: upload.raw }),
        signal: abort.signal,
      });
      const data = await readApiResponse<{ message: string }>(response);
      if (current === version.current) setMessage(data.message);
    } catch (cause) {
      if (current === version.current && !abort.signal.aborted)
        setError(
          cause instanceof Error
            ? cause.message
            : "A network error occurred. Please try again.",
        );
    } finally {
      if (current === version.current) setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      setError(
        "Unable to copy. Please select and copy the commit message manually.",
      );
    }
  }

  const files = upload?.parsed.files ?? [];
  const additions = files.reduce((sum, file) => sum + file.additions, 0);
  const deletions = files.reduce((sum, file) => sum + file.deletions, 0);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-8">
      <header className="flex items-center justify-between border-b pb-5">
        <a href="/" className="flex items-center gap-2 text-lg font-semibold">
          <GitBranch className="size-5" /> Yushi{" "}
          <span className="text-sm font-normal text-muted-foreground">
            / Portal
          </span>
        </a>
        <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
          Diff → Commit
        </span>
      </header>
      <nav aria-label="Change source" className="mt-6 flex gap-2 text-sm">
        <Link
          href="/"
          aria-current={!isPullRequest ? "page" : undefined}
          className={`rounded-lg px-4 py-2 ${!isPullRequest ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}
        >
          Upload file
        </Link>
        <Link
          href="/pull-request"
          aria-current={isPullRequest ? "page" : undefined}
          className={`rounded-lg px-4 py-2 ${isPullRequest ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}
        >
          GitHub Pull Request
        </Link>
      </nav>
      <section className="py-9">
        <p className="mb-3 text-xs font-semibold tracking-widest text-muted-foreground">
          MAKE EVERY COMMIT CLEAR
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Understand changes. Write better commits.
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {isPullRequest
            ? "Enter a public GitHub PR URL, review the changes, and let AI draft your commit message."
            : "Upload a diff or patch, review the changes, and let AI draft your commit message."}
        </p>
      </section>
      {isPullRequest ? (
        <section
          className="rounded-xl border bg-muted/30 p-6"
          aria-label="Import a GitHub PR"
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void loadPullRequest();
            }}
          >
            <label htmlFor="pr-url" className="text-sm font-medium">
              GitHub pull request URL
            </label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                id="pr-url"
                type="url"
                required
                maxLength={2048}
                value={prUrl}
                onChange={(event) => {
                  reset();
                  setPrUrl(event.target.value);
                }}
                placeholder="https://github.com/owner/repo/pull/123"
                className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm"
                aria-describedby="pr-help"
              />
              <button
                type="submit"
                disabled={reading || !prUrl.trim()}
                className="flex items-center justify-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm text-background disabled:opacity-40"
              >
                {reading && <LoaderCircle className="size-4 animate-spin" />}
                {reading ? "Loading…" : "Load PR"}
              </button>
            </div>
            <p id="pr-help" className="mt-3 text-xs text-muted-foreground">
              Public github.com repositories only. Private repositories are not
              supported yet. Maximum diff size: 100 KB. Changes are sent to AI
              only when you generate a message.
            </p>
            <p role="status" className="sr-only">
              {reading
                ? "Fetching changes from GitHub"
                : upload
                  ? "PR changes loaded"
                  : ""}
            </p>
          </form>
          {upload?.pr && (
            <div className="mt-5 border-t pt-4">
              <a
                href={upload.pr.url}
                target="_blank"
                rel="noreferrer"
                className="break-words font-medium hover:underline"
              >
                {upload.pr.title}
              </a>
              <p className="mt-2 text-xs text-muted-foreground">
                {upload.name} ·{" "}
                {
                  { open: "Open", closed: "Closed", merged: "Merged" }[
                    upload.pr.state
                  ]
                }
              </p>
            </div>
          )}
        </section>
      ) : (
        <section
          aria-label="Upload a diff or patch"
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void load(event.dataTransfer.files[0]);
          }}
          className={`relative rounded-xl border-2 border-dashed p-7 text-center transition-colors ${dragging ? "border-blue-500 bg-blue-50" : "border-border bg-muted/30"}`}
        >
          <Upload className="mx-auto mb-3 size-6 text-muted-foreground" />
          <label className="cursor-pointer font-medium" htmlFor="diff-upload">
            {reading
              ? "Reading…"
              : upload
                ? upload.name
                : "Drop a file here, or click to browse"}
          </label>
          <input
            id="diff-upload"
            type="file"
            accept=".diff,.patch"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 focus:opacity-100"
            aria-label="Select a diff or patch file"
            onChange={(event) => {
              void load(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            .diff / .patch · Up to 100 KB · Changes are sent to AI only when
            generating
          </p>
        </section>
      )}
      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}
      <div className="my-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0" aria-label="File diffs">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-semibold">
              <FileDiff className="size-4" /> Changed files{" "}
              <span className="rounded-full bg-muted px-2 text-xs leading-6">
                {files.length}
              </span>
            </h2>
            {upload && (
              <p className="font-mono text-xs">
                <span className="text-green-700">+{additions}</span>{" "}
                <span className="text-red-700">−{deletions}</span>
              </p>
            )}
          </div>
          {!upload ? (
            <div className="rounded-xl border px-6 py-20 text-center text-sm text-muted-foreground">
              {isPullRequest ? (
                "Load a public PR to review its changes line by line."
              ) : (
                <>
                  Upload a file to review its changes line by line.
                  <p className="mt-3 font-mono text-xs">
                    git diff &gt; changes.diff
                  </p>
                  <p className="mt-2 font-mono text-xs">
                    git format-patch -1 HEAD --stdout &gt; changes.patch
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {files.map((file, index) => (
                <details
                  // biome-ignore lint/suspicious/noArrayIndexKey: Files are an immutable snapshot, including repeated paths in patch series.
                  key={`${upload.name}-${index}`}
                  open
                  className="overflow-hidden rounded-lg border"
                >
                  <summary className="cursor-pointer break-all bg-muted/60 px-4 py-3 font-mono text-xs font-semibold">
                    {file.name}
                    <span className="ml-3 whitespace-nowrap font-normal">
                      <span className="text-green-700">+{file.additions}</span>{" "}
                      <span className="text-red-700">−{file.deletions}</span>
                    </span>
                  </summary>
                  <div className="overflow-x-auto">
                    <table
                      className="diff-table w-full border-collapse font-mono text-xs"
                      aria-label={`Diff for ${file.name}`}
                    >
                      <tbody>
                        {file.lines.map((line, row) => (
                          // biome-ignore lint/suspicious/noArrayIndexKey: Diff rows never reorder within an uploaded snapshot.
                          <tr key={row} className={`diff-${line.kind}`}>
                            <td className="diff-number select-none">
                              {line.old}
                            </td>
                            <td className="diff-number select-none">
                              {line.next}
                            </td>
                            <td className="whitespace-pre py-0.5 pr-4">
                              {line.text}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>
        <aside className="space-y-5 lg:sticky lg:top-6">
          {upload &&
            (upload.parsed.messages.length > 0 ||
              /\.patch$/i.test(upload.name)) && (
              <section className="rounded-xl border p-5">
                <h2 className="mb-4 text-sm font-semibold">
                  Original commit message
                </h2>
                {upload.parsed.messages.length ? (
                  upload.parsed.messages.map((original, index) => (
                    <pre
                      // biome-ignore lint/suspicious/noArrayIndexKey: Messages are immutable and may have identical text in patch series.
                      key={index}
                      className="mb-3 whitespace-pre-wrap break-words rounded-lg bg-muted/60 p-3 font-mono text-xs leading-6"
                    >
                      {original}
                    </pre>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This patch does not include a commit message.
                  </p>
                )}
              </section>
            )}
          <section className="rounded-xl border p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4" /> AI commit message
            </h2>
            <p className="mb-5 mt-2 text-xs leading-6 text-muted-foreground">
              Generate an English commit message following the Angular commit
              guidelines.
            </p>
            <button
              type="button"
              disabled={!upload || busy || reading}
              onClick={() => void generate()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {busy
                ? "Analyzing changes…"
                : message
                  ? "Regenerate"
                  : "Generate commit message"}
            </button>
            <div aria-live="polite" aria-busy={busy}>
              {message ? (
                <>
                  <pre className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-muted/60 p-4 font-mono text-xs leading-6">
                    {message}
                  </pre>
                  <button
                    type="button"
                    onClick={() => void copy()}
                    className="mt-3 flex items-center gap-2 text-xs"
                  >
                    {copied ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    {copied ? "Copied" : "Copy message"}
                  </button>
                </>
              ) : (
                <p className="mt-5 text-center text-xs text-muted-foreground">
                  {busy
                    ? "Generating your commit message. Please wait."
                    : "Your generated commit message will appear here."}
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
      <footer className="border-t py-5 text-xs text-muted-foreground">
        Yushi · Clearer commits start here.
      </footer>
    </main>
  );
}
