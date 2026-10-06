export class PullRequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function parsePullRequestUrl(input: string) {
  const invalid = () =>
    new PullRequestError(
      "Enter a valid public GitHub PR URL, such as https://github.com/owner/repo/pull/123.",
      400,
    );
  if (input.length > 2048) throw invalid();
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw invalid();
  }
  const match =
    /^\/([A-Za-z0-9-]+)\/([A-Za-z0-9_.-]+)\/pull\/([1-9]\d*)(?:\/(?:files|commits))?\/?$/.exec(
      url.pathname,
    );
  if (
    url.protocol !== "https:" ||
    url.hostname !== "github.com" ||
    url.port ||
    url.username ||
    url.password ||
    !match ||
    !Number.isSafeInteger(Number(match[3]))
  )
    throw invalid();
  const [, owner, repo, number] = match;
  return {
    owner: owner!,
    repo: repo!,
    number: Number(number),
    url: `https://github.com/${owner}/${repo}/pull/${number}`,
  };
}

export type PullRequestInfo = {
  url: string;
  title: string;
  number: number;
  repository: string;
  state: "open" | "closed" | "merged";
  changedFiles: number;
};

export type PublicPullRequest = { raw: string; pr: PullRequestInfo };
export type PullRequestOptions = {
  fetcher?: Fetcher;
  maxDiffBytes?: number;
  timeoutMs?: number;
};

async function readLimited(response: Response, limit: number) {
  const reader = response.body?.getReader();
  if (!reader)
    throw new PullRequestError(
      "GitHub returned an empty response. Please try again later.",
      502,
    );
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new PullRequestError(
        `The GitHub response exceeds the ${limit}-byte limit. Please split the changes.`,
        413,
      );
    }
    chunks.push(value);
  }
  return new Blob(chunks as BlobPart[]).text();
}

export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

export async function fetchPublicPullRequest(
  input: string,
  {
    fetcher = fetch,
    maxDiffBytes = 100_000,
    timeoutMs = 20_000,
  }: PullRequestOptions = {},
): Promise<PublicPullRequest> {
  if (
    !Number.isSafeInteger(maxDiffBytes) ||
    maxDiffBytes <= 0 ||
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs <= 0
  ) {
    throw new RangeError(
      "maxDiffBytes and timeoutMs must be positive safe integers",
    );
  }
  const pr = parsePullRequestUrl(input);
  // Never forward credentials or fetch a user-provided host / upstream diff_url.
  const endpoint = `https://api.github.com/repos/${pr.owner}/${pr.repo}/pulls/${pr.number}`;
  const diffEndpoint = `https://patch-diff.githubusercontent.com/raw/${pr.owner}/${pr.repo}/pull/${pr.number}.diff`;
  const signal = AbortSignal.timeout(timeoutMs);
  async function get(url: string, accept: string) {
    const response = await fetcher(url, {
      headers: {
        Accept: accept,
        "User-Agent": "Yushi",
        "X-GitHub-Api-Version": "2026-03-10",
      },
      redirect: "error",
      cache: "no-store",
      signal,
    });
    if (response.ok) return response;
    await response.body?.cancel();
    if (response.status === 404 || response.status === 401)
      throw new PullRequestError(
        "This PR could not be found or its repository is not public. Private repositories are not supported yet.",
        404,
      );
    if (
      response.status === 429 ||
      (response.status === 403 &&
        (response.headers.get("x-ratelimit-remaining") === "0" ||
          response.headers.has("retry-after")))
    )
      throw new PullRequestError(
        "GitHub rate limit reached. Please try again later.",
        429,
      );
    if (response.status === 403)
      throw new PullRequestError(
        "GitHub denied access. Only publicly accessible repositories are supported. Please try again later.",
        403,
      );
    throw new PullRequestError(
      "Unable to retrieve the PR from GitHub. Please try again later.",
      502,
    );
  }
  try {
    const data = JSON.parse(
      await readLimited(
        await get(endpoint, "application/vnd.github+json"),
        1_000_000,
      ),
    );
    if (data?.base?.repo?.private !== false)
      throw new PullRequestError(
        "Private and non-public repositories are not supported yet.",
        422,
      );
    if (
      typeof data.title !== "string" ||
      data.number !== pr.number ||
      !Number.isInteger(data.changed_files) ||
      data.changed_files < 0 ||
      !["open", "closed"].includes(data.state)
    )
      throw new PullRequestError(
        "GitHub returned incomplete PR information. Please try again later.",
        502,
      );
    const raw = await readLimited(
      await get(diffEndpoint, "text/plain"),
      maxDiffBytes,
    );
    if (!raw.trim())
      throw new PullRequestError(
        "This PR has no code changes to generate a commit message from.",
        422,
      );
    const info: PullRequestInfo = {
      url: pr.url,
      title: data.title,
      number: pr.number,
      repository: `${pr.owner}/${pr.repo}`,
      state: data.merged ? "merged" : data.state,
      changedFiles: data.changed_files,
    };
    return { raw, pr: info };
  } catch (error) {
    if (error instanceof PullRequestError) throw error;
    if (signal.aborted)
      throw new PullRequestError(
        "The GitHub request timed out. Please try again later.",
        504,
      );
    throw new PullRequestError(
      "Unable to connect to GitHub or read its response. Please try again later.",
      502,
    );
  }
}
