"use client";
import { Alert, AlertDescription } from "@yushi/ui/components/alert";
import { useLocale } from "@/components/locale-provider";
import { CommitMessagePanel } from "./commit-message-panel";
import { useCommitSession } from "./commit-session";
import { DiffPreview } from "./diff-preview";
export function WorkspaceResults({
  mode,
}: {
  mode: "upload" | "pull-request";
}) {
  const { t } = useLocale();
  const { error } = useCommitSession();
  return (
    <>
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{t(error)}</AlertDescription>
        </Alert>
      )}
      <div className="my-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <DiffPreview mode={mode} />
        <CommitMessagePanel />
      </div>
    </>
  );
}
