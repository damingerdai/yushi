"use client";
import { Button } from "@yushi/ui/components/button";
import { Card } from "@yushi/ui/components/card";
import { Input } from "@yushi/ui/components/input";
import { Label } from "@yushi/ui/components/label";
import { Separator } from "@yushi/ui/components/separator";
import { Spinner } from "@yushi/ui/components/spinner";
import { useLocale } from "@/components/locale-provider";
import { useCommitSession } from "./commit-session";
export function PullRequestImport() {
  const { t } = useLocale();
  const { prUrl, setPrUrl, upload, reading, reset, loadPullRequest } =
    useCommitSession();
  return (
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
  );
}
