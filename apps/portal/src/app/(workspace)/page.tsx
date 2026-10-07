import { CommitSessionProvider } from "@/components/commit-session";
import { DiffUpload } from "@/components/diff-upload";
import { WorkspaceIntro } from "@/components/workspace-intro";
import { WorkspaceResults } from "@/components/workspace-results";

export default function Home() {
  return (
    <CommitSessionProvider>
      <WorkspaceIntro mode="upload" />
      <DiffUpload />
      <WorkspaceResults mode="upload" />
    </CommitSessionProvider>
  );
}
