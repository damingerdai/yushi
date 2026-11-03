"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@yushi/ui/components/button";
import { Suspense } from "react";
import { useLocale } from "@/components/locale-provider";

export function AuthButtons() {
  const { t } = useLocale();
  return (
    <Suspense>
      <Show when="signed-out">
        <span className="flex items-center gap-1.5">
          <SignInButton>
            <Button
              variant="ghost"
              className="h-9 cursor-pointer px-3 text-muted-foreground hover:text-foreground"
            >
              {t("Sign in")}
            </Button>
          </SignInButton>
          <SignUpButton>
            <Button className="h-9 cursor-pointer px-4">{t("Sign up")}</Button>
          </SignUpButton>
        </span>
      </Show>
      <Show when="signed-in">
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "size-8",
            },
          }}
        />
      </Show>
    </Suspense>
  );
}
