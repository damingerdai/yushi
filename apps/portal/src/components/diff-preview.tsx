"use client";
import { Badge } from "@yushi/ui/components/badge";
import { Card } from "@yushi/ui/components/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@yushi/ui/components/collapsible";
import { ChevronDown, FileDiff } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { useCommitSession } from "./commit-session";
export function DiffPreview({ mode }: { mode: "upload" | "pull-request" }) {
  const { t } = useLocale();
  const { upload } = useCommitSession();
  const isPullRequest = mode === "pull-request";
  const files = upload?.parsed.files ?? [];
  const additions = files.reduce((sum, file) => sum + file.additions, 0);
  const deletions = files.reduce((sum, file) => sum + file.deletions, 0);
  return (
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
                        <td className="diff-number select-none">{line.old}</td>
                        <td className="diff-number select-none">{line.next}</td>
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
  );
}
