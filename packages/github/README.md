# @yushi/github

Private workspace library for reading public GitHub pull requests. Uses standard
Fetch APIs with no runtime dependencies, Next.js imports, or model credentials.

Add `"@yushi/github": "workspace:*"` to the consuming workspace's dependencies.

```ts
import { fetchPublicPullRequest, PullRequestError } from "@yushi/github";

try {
  const { pr, raw } = await fetchPublicPullRequest(
    "https://github.com/damingerdai/health-master/pull/325",
    { maxDiffBytes: 100_000, timeoutMs: 20_000 },
  );
  console.log(pr.title, pr.changedFiles, raw);
} catch (error) {
  if (error instanceof PullRequestError) console.error(error.status, error.message);
  else throw error;
}
```

Exports `parsePullRequestUrl`, `fetchPublicPullRequest`, `PullRequestError`, and
public request/result types. The optional `fetcher` option allows HTTP injection
for testing. Defaults are 100,000 bytes for the diff and a 20-second timeout for
the whole request. Metadata is bounded at 1 MB. Invalid limits throw `RangeError`.

Metadata and public visibility come from the GitHub REST API; the raw diff comes
from `patch-diff.githubusercontent.com`. Requests are anonymous and reject
redirects. Private repositories and GitHub Enterprise are not supported.

The library returns the raw diff and the upstream changed-file count. Consumers
are responsible for parsing and validating the diff for their use case; Portal
performs those checks before rendering or sending changes to AI.

```bash
bun run --cwd packages/github test
bun run --cwd packages/github typecheck
```
