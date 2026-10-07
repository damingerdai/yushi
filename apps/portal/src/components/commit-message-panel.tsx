"use client";
import { COMMIT_TYPES } from "@yushi/core/commit-options";
import { Autocomplete } from "@yushi/ui/components/autocomplete";
import { Button } from "@yushi/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@yushi/ui/components/card";
import { Input } from "@yushi/ui/components/input";
import { Label } from "@yushi/ui/components/label";
import { Spinner } from "@yushi/ui/components/spinner";
import { Check, Copy, Sparkles } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { useCommitPreferences } from "./commit-preferences";
import { useCommitSession } from "./commit-session";
export function CommitMessagePanel() {
  const { t } = useLocale();
  const { type, scope, footer, setType, setScope, setFooter } =
    useCommitPreferences();
  const { upload, busy, reading, message, copied, generate, copy } =
    useCommitSession();
  return (
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
          <fieldset disabled={busy} className="mb-5 space-y-3">
            <legend className="mb-3 text-sm font-medium">
              {t("Commit options")}
            </legend>
            <Label htmlFor="commit-type">{t("Type")}</Label>
            <Autocomplete
              id="commit-type"
              items={COMMIT_TYPES}
              value={type}
              maxLength={24}
              placeholder={t("Auto or custom type")}
              onValueChange={setType}
              disabled={busy}
            />
            <Label htmlFor="commit-scope">{t("Scope")}</Label>
            <Input
              id="commit-scope"
              value={scope}
              maxLength={40}
              placeholder={t("Auto (e.g. core, router)")}
              onChange={(event) => setScope(event.target.value)}
            />
            <Label htmlFor="commit-footer">{t("Footer")}</Label>
            <textarea
              id="commit-footer"
              value={footer}
              maxLength={4000}
              rows={4}
              placeholder={"Fixes #123\nBREAKING CHANGE: ..."}
              onChange={(event) => setFooter(event.target.value)}
              className="w-full rounded-lg border bg-background p-3 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {t(
                "Leave fields blank for automatic generation. Custom types extend the Angular standard. Footer text is preserved.",
              )}
            </p>
          </fieldset>
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
  );
}
