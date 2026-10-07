"use client";
import { useLocale } from "@/components/locale-provider";
export function WorkspaceIntro({ mode }: { mode: "upload" | "pull-request" }) {
  const { t } = useLocale();
  const isPullRequest = mode === "pull-request";
  return (
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
  );
}
