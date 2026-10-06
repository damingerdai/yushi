import { type PublicPullRequest, PullRequestError } from "@yushi/github";
import { parseDiff } from "./diff";

export function validatePullRequestDiff(result: PublicPullRequest) {
  let parsed: ReturnType<typeof parseDiff>;
  try {
    parsed = parseDiff(result.raw);
  } catch {
    throw new PullRequestError(
      "GitHub returned an incomplete or unsupported diff. Please try again later.",
      422,
    );
  }
  if (parsed.files.length !== result.pr.changedFiles) {
    throw new PullRequestError(
      "PR changes may be incomplete or updating. Reload the PR before generating a message.",
      422,
    );
  }
  return parsed;
}
