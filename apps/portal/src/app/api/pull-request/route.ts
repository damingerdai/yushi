import { fetchPublicPullRequest, PullRequestError } from "@yushi/github";
import { MAX_DIFF_BYTES } from "@/lib/diff";
import { validatePullRequestDiff } from "@/lib/pull-request-diff";
import { rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const limited = await rateLimitResponse("pull-request", request);
  if (limited) return limited;
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
