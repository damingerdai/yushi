"use client";
import { Card } from "@yushi/ui/components/card";
import { Input } from "@yushi/ui/components/input";
import { Label } from "@yushi/ui/components/label";
import { Upload } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { useCommitSession } from "./commit-session";
export function DiffUpload() {
  const { t } = useLocale();
  const { upload, reading, dragging, setDragging, load } = useCommitSession();
  return (
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
      className={`relative gap-0 ring-0 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:border-ring border-2 border-dashed p-7 text-center transition-colors ${dragging ? "border-blue-500 bg-blue-50" : "border-border bg-muted/30"}`}
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
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
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
  );
}
