import { CommitSessionProvider } from "@/components/commit-session";
import { PullRequestImport } from "@/components/pull-request-import";
import { WorkspaceIntro } from "@/components/workspace-intro";
import { WorkspaceResults } from "@/components/workspace-results";

export default function PullRequestPage() {
  return (
    <CommitSessionProvider>
      <WorkspaceIntro mode="pull-request" />
      <PullRequestImport />
      <WorkspaceResults mode="pull-request" />
    </CommitSessionProvider>
  );
}
