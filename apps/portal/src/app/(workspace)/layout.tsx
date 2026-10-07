import type { ReactNode } from "react";
import CommitWorkspace from "@/components/commit-workspace";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <CommitWorkspace>{children}</CommitWorkspace>;
}
