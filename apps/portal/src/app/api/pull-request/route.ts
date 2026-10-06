import { fetchPublicPullRequest, PullRequestError } from "@yushi/github";
import { MAX_DIFF_BYTES } from "@/lib/diff";
import { validatePullRequestDiff } from "@/lib/pull-request-diff";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url).searchParams.get("url") ?? "";
    const result = await fetchPublicPullRequest(url, {
      maxDiffBytes: MAX_DIFF_BYTES,
    });
    validatePullRequestDiff(result);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof PullRequestError
            ? error.message
            : "Unable to load the PR. Please try again later.",
      },
      {
        status: error instanceof PullRequestError ? error.status : 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
