"use client";
import { commitOptionsSchema } from "@yushi/core/commit-options";
import type { PullRequestInfo } from "@yushi/github";
import {
  createContext,
  type ReactNode,
  startTransition,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  generateCommitMessageAction,
  loadPullRequestAction,
} from "@/app/actions";
import { MAX_DIFF_BYTES, type ParsedDiff, parseDiff } from "@/lib/diff";
import { useCommitPreferences } from "./commit-preferences";

type UploadState = {
  name: string;
  raw: string;
  parsed: ParsedDiff;
  pr?: PullRequestInfo;
};

function useSessionState() {
  const { type, scope, footer } = useCommitPreferences();
  const [prUrl, setPrUrl] = useState("");
  const [upload, setUpload] = useState<UploadState>();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  // Server Actions cannot be aborted; discard results from obsolete sessions.
  const version = useRef(0);
  useEffect(
    () => () => {
      version.current++;
    },
    [],
  );

  function reset() {
    version.current++;
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
    setReading(true);
    try {
      const result = await loadPullRequestAction(prUrl.trim());
      if (!result.ok) {
        if (current === version.current) setError(result.error);
        return;
      }
      const data = result.data;
      const parsed = parseDiff(data.raw);
      if (current === version.current)
        setUpload({
          name: `${data.pr.repository}#${data.pr.number}`,
          raw: data.raw,
          parsed,
          pr: data.pr,
        });
    } catch {
      if (current === version.current)
        setError("Unable to load the PR. Please try again.");
    } finally {
      if (current === version.current) setReading(false);
    }
  }

  async function load(file?: File) {
    if (!file) return;
    const current = ++version.current;
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
    const selected = commitOptionsSchema.safeParse({ type, scope, footer });
    if (!selected.success) {
      setError("Invalid commit options. Check type, scope, and footer.");
      return;
    }
    const current = ++version.current;
    setBusy(true);
    setError("");
    setCopied(false);
    try {
      const result = await generateCommitMessageAction(
        upload.raw,
        selected.data,
      );
      if (current === version.current) {
        if (result.ok) setMessage(result.data.message);
        else setError(result.error);
      }
    } catch {
      if (current === version.current)
        setError("A network error occurred. Please try again.");
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

  return {
    prUrl,
    setPrUrl,
    upload,
    error,
    message,
    busy,
    reading,
    dragging,
    setDragging,
    copied,
    reset,
    loadPullRequest: () => startTransition(loadPullRequest),
    load,
    generate: () => startTransition(generate),
    copy,
  };
}
const SessionContext = createContext<ReturnType<typeof useSessionState> | null>(
  null,
);
export function CommitSessionProvider({ children }: { children: ReactNode }) {
  const session = useSessionState();
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}
export function useCommitSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("CommitSessionProvider is missing");
  return context;
}
