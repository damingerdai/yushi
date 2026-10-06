"use client";

import type { PullRequestInfo } from "@yushi/github";
import { Alert, AlertDescription } from "@yushi/ui/components/alert";
import { Badge } from "@yushi/ui/components/badge";
import { Button } from "@yushi/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@yushi/ui/components/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@yushi/ui/components/collapsible";
import { Input } from "@yushi/ui/components/input";
import { Label } from "@yushi/ui/components/label";
import { Separator } from "@yushi/ui/components/separator";
import { Spinner } from "@yushi/ui/components/spinner";
import {
  Check,
  ChevronDown,
  Copy,
  FileDiff,
  Sparkles,
  Upload,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLocale } from "@/components/locale-provider";
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
  const { t } = useLocale();
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
        <Link
          href="/"
          aria-label={t("Yushi home")}
          className="flex items-center gap-3"
        >
          <Image
            src="/brand/yushi-mark.svg"
            alt=""
            width={36}
            height={36}
            unoptimized
          />
          <span className="font-[Georgia,'Times_New_Roman',serif] text-3xl tracking-tight">
            Yushi
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            / Portal
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden sm:inline-flex">
            Diff → Commit
          </Badge>
          <LanguageSwitcher />
        </div>
      </header>
      <nav aria-label={t("Change source")} className="mt-6 flex gap-2 text-sm">
        <Button
          render={<Link href="/" />}
          nativeButton={false}
          variant={!isPullRequest ? "default" : "secondary"}
          aria-current={!isPullRequest ? "page" : undefined}
          className="h-9 px-4"
        >
          {t("Upload file")}
        </Button>
        <Button
          render={<Link href="/pull-request" />}
          nativeButton={false}
          variant={isPullRequest ? "default" : "secondary"}
          aria-current={isPullRequest ? "page" : undefined}
          className="h-9 px-4"
        >
          {t("GitHub Pull Request")}
        </Button>
      </nav>
      <section className="py-9">
        <p className="mb-3 text-xs font-semibold tracking-widest text-muted-foreground">
          {t("MAKE EVERY COMMIT CLEAR")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("Understand changes. Write better commits.")}
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {isPullRequest
            ? t(
                "Enter a public GitHub PR URL, review the changes, and let AI draft your commit message.",
              )
            : t(
                "Upload a diff or patch, review the changes, and let AI draft your commit message.",
              )}
        </p>
      </section>
      {isPullRequest ? (
        <Card
          role="region"
          className="bg-muted/30 p-6"
          aria-label={t("Import a GitHub PR")}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void loadPullRequest();
            }}
          >
            <Label htmlFor="pr-url" className="text-sm font-medium">
              {t("GitHub pull request URL")}
            </Label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <Input
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
                className="h-10 flex-1 bg-background"
                aria-describedby="pr-help"
              />
              <Button
                type="submit"
                disabled={reading || !prUrl.trim()}
                size="lg"
                className="h-10 px-5"
              >
                {reading && <Spinner aria-label={t("Loading…")} />}
                {reading ? t("Loading…") : t("Load PR")}
              </Button>
            </div>
            <p id="pr-help" className="mt-3 text-xs text-muted-foreground">
              {t(
                "Public github.com repositories only. Private repositories are not supported yet. Maximum diff size: 100 KB. Changes are sent to AI only when you generate a message.",
              )}
            </p>
            <p role="status" className="sr-only">
              {reading
                ? t("Fetching changes from GitHub")
                : upload
                  ? t("PR changes loaded")
                  : ""}
            </p>
          </form>
          {upload?.pr && (
            <div>
              <Separator className="mb-4" />
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
                  { open: t("Open"), closed: t("Closed"), merged: t("Merged") }[
                    upload.pr.state
                  ]
                }
              </p>
            </div>
          )}
        </Card>
      ) : (
        <Card
          role="region"
          aria-label={t("Upload a diff or patch")}
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
          className={`relative gap-0 ring-0 border-2 border-dashed p-7 text-center transition-colors ${dragging ? "border-blue-500 bg-blue-50" : "border-border bg-muted/30"}`}
        >
          <Upload className="mx-auto mb-3 size-6 text-muted-foreground" />
          <Label
            className="justify-center cursor-pointer font-medium"
            htmlFor="diff-upload"
          >
            {reading
              ? t("Reading…")
              : upload
                ? upload.name
                : t("Drop a file here, or click to browse")}
          </Label>
          <Input
            id="diff-upload"
            type="file"
            accept=".diff,.patch"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 focus:opacity-100"
            aria-label={t("Select a diff or patch file")}
            onChange={(event) => {
              void load(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {t(
              ".diff / .patch · Up to 100 KB · Changes are sent to AI only when generating",
            )}
          </p>
        </Card>
      )}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{t(error)}</AlertDescription>
        </Alert>
      )}
      <div className="my-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0" aria-label={t("File diffs")}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-semibold">
              <FileDiff className="size-4" /> {t("Changed files")}{" "}
              <Badge variant="secondary">{files.length}</Badge>
            </h2>
            {upload && (
              <p className="font-mono text-xs">
                <span className="text-green-700">+{additions}</span>{" "}
                <span className="text-red-700">−{deletions}</span>
              </p>
            )}
          </div>
          {!upload ? (
            <Card className="gap-0 px-6 py-20 text-center text-sm text-muted-foreground">
              {isPullRequest ? (
                t("Load a public PR to review its changes line by line.")
              ) : (
                <>
                  {t("Upload a file to review its changes line by line.")}
                  <p className="mt-3 font-mono text-xs">
                    git diff &gt; changes.diff
                  </p>
                  <p className="mt-2 font-mono text-xs">
                    git format-patch -1 HEAD --stdout &gt; changes.patch
                  </p>
                </>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {files.map((file, index) => (
                <Collapsible
                  // biome-ignore lint/suspicious/noArrayIndexKey: Files are an immutable snapshot, including repeated paths in patch series.
                  key={`${upload.name}-${index}`}
                  defaultOpen
                  className="overflow-hidden rounded-lg border"
                >
                  <CollapsibleTrigger className="group flex w-full items-center cursor-pointer break-all bg-muted/60 px-4 py-3 text-left font-mono text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                    <ChevronDown
                      aria-hidden="true"
                      className="mr-2 size-4 shrink-0 transition-transform group-data-[panel-open]:rotate-180"
                    />
                    <span className="min-w-0 flex-1">{file.name}</span>
                    <span className="ml-3 whitespace-nowrap font-normal">
                      <span className="text-green-700">+{file.additions}</span>{" "}
                      <span className="text-red-700">−{file.deletions}</span>
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-x-auto">
                    <table
                      className="diff-table w-full border-collapse font-mono text-xs"
                      aria-label={t("Diff for {file}", { file: file.name })}
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
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </section>
        <aside className="space-y-5 lg:sticky lg:top-6">
          {upload &&
            (upload.parsed.messages.length > 0 ||
              /\.patch$/i.test(upload.name)) && (
              <Card className="gap-0 p-5">
                <CardHeader className="mb-4 px-0">
                  <h2 className="text-sm font-semibold">
                    {t("Original commit message")}
                  </h2>
                </CardHeader>
                <CardContent className="px-0">
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
                      {t("This patch does not include a commit message.")}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          <Card className="gap-0 p-5">
            <CardHeader className="px-0">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="size-4" />
                {t("AI commit message")}
              </h2>
              <CardDescription className="mb-5 mt-2 text-xs leading-6">
                {t(
                  "Generate an English commit message following the Angular commit guidelines.",
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <Button
                type="button"
                disabled={!upload || busy || reading}
                onClick={() => void generate()}
                size="lg"
                className="h-10 w-full"
              >
                {busy ? (
                  <Spinner aria-label={t("Loading…")} />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {busy
                  ? t("Analyzing changes…")
                  : message
                    ? t("Regenerate")
                    : t("Generate commit message")}
              </Button>
              <div aria-live="polite" aria-busy={busy}>
                {message ? (
                  <>
                    <pre className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-muted/60 p-4 font-mono text-xs leading-6">
                      {message}
                    </pre>
                    <Button
                      type="button"
                      onClick={() => void copy()}
                      variant="ghost"
                      size="sm"
                      className="mt-3"
                    >
                      {copied ? (
                        <Check className="size-3.5" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                      {copied ? t("Copied") : t("Copy message")}
                    </Button>
                  </>
                ) : (
                  <p className="mt-5 text-center text-xs text-muted-foreground">
                    {busy
                      ? t("Generating your commit message. Please wait.")
                      : t("Your generated commit message will appear here.")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
      <footer className="border-t py-5 text-xs text-muted-foreground">
        {t("Yushi · Clearer commits start here.")}
      </footer>
    </main>
  );
}
