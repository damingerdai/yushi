import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { LocaleProvider } from "@/components/locale-provider";
import { LOCALE_COOKIE, normalizeLocale, translate } from "@/lib/i18n";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = normalizeLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return {
    title: "Yushi Portal",
    description: translate(
      locale,
      "Review diffs and patches, and generate clear commit messages with AI",
    ),
  };
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = normalizeLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full font-sans">
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "oklch(0.205 0 0)",
              colorPrimaryForeground: "oklch(0.985 0 0)",
              colorForeground: "oklch(0.145 0 0)",
              colorMutedForeground: "oklch(0.556 0 0)",
              colorBackground: "oklch(1 0 0)",
              colorInput: "oklch(1 0 0)",
              colorInputForeground: "oklch(0.145 0 0)",
              borderRadius: "0.625rem",
            },
          }}
        >
          <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
