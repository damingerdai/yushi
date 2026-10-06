import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yushi Portal",
  description: "查看 diff 与 patch，并使用 AI 生成清晰的 commit message",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
