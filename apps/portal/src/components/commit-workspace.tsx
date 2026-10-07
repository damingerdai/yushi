"use client";
import { Badge } from "@yushi/ui/components/badge";
import { Button } from "@yushi/ui/components/button";
import Image from "next/image";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLocale } from "@/components/locale-provider";
import { CommitPreferencesProvider } from "./commit-preferences";

export default function CommitWorkspace({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  const isPullRequest = useSelectedLayoutSegment() === "pull-request";
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
          <span className="flex flex-col">
            <span className="flex items-baseline gap-1.5">
              <span className="font-[Georgia,'Times_New_Roman',serif] text-2xl tracking-tight">
                Yushi
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                / Portal
              </span>
            </span>
            <span className="text-xs text-muted-foreground">
              {t("Ancient Wisdom. Modern Code Review.")}
            </span>
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

      <CommitPreferencesProvider>{children}</CommitPreferencesProvider>
      <footer className="border-t py-5 text-xs text-muted-foreground">
        {t("Yushi · Clearer commits start here.")}
      </footer>
    </main>
  );
}
