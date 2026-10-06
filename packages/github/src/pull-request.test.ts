import { describe, expect, test } from "bun:test";
import {
  type Fetcher,
  fetchPublicPullRequest as fetchPr,
  PullRequestError,
  parsePullRequestUrl,
} from "./index";

const fetchPublicPullRequest = (input: string, fetcher?: Fetcher) =>
  fetchPr(input, { fetcher });

const url = "https://github.com/example/project/pull/12";
const raw =
  "diff --git a/a.ts b/a.ts\n--- a/a.ts\n+++ b/a.ts\n@@ -1 +1 @@\n-before\n+after\n";
const metadata = {
  title: "Update example",
  number: 12,
  changed_files: 1,
  state: "open",
  merged: false,
  base: { repo: { private: false } },
};
function github(data: unknown = metadata, diff = raw) {
  const calls: { url: string; init: RequestInit }[] = [];
  return {
    calls,
    fetcher: async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return calls.length === 1 ? Response.json(data) : new Response(diff);
    },
  };
}
async function status(promise: Promise<unknown>, expected: number) {
  try {
    await promise;
    throw new Error("Expected request to fail");
  } catch (error) {
    expect(error).toBeInstanceOf(PullRequestError);
    expect((error as PullRequestError).status).toBe(expected);
  }
}

describe("GitHub PR links", () => {
  test("accepts canonical, files and commits links, normalizing query and fragment", () => {
    for (const value of [
      url,
      `${url}/`,
      `${url}/files?diff=split#file`,
      `${url}/commits`,
      ` ${url} `,
    ])
      expect(parsePullRequestUrl(value)).toEqual({
        owner: "example",
        repo: "project",
        number: 12,
        url,
      });
  });
  test("rejects foreign hosts, credentials, insecure URLs and non-PR paths", () => {
    for (const value of [
      "",
      "garbage",
      "http://github.com/a/b/pull/1",
      "https://github.com.evil.test/a/b/pull/1",
      "https://localhost/a/b/pull/1",
      "https://github.com:444/a/b/pull/1",
      "https://user:pass@github.com/a/b/pull/1",
      "https://github.com/a/b/issues/1",
      "https://github.com/a/b/pull/0",
      "https://github.com/a/b/pull/9007199254740992",
      "https://github.com/a%2fb/c/pull/1",
      "x".repeat(2049),
    ])
      expect(() => parsePullRequestUrl(value)).toThrow(PullRequestError);
  });
});

describe("public PR fetching", () => {
  test("fetches metadata and diff anonymously from fixed API host", async () => {
    const { calls, fetcher } = github({
      ...metadata,
      diff_url: "http://localhost/secret",
    });
    expect(await fetchPublicPullRequest(url, fetcher)).toEqual({
      raw,
      pr: {
        url,
        title: metadata.title,
        number: 12,
        repository: "example/project",
        state: "open",
        changedFiles: 1,
      },
    });
    expect(calls).toHaveLength(2);
    for (const call of calls) {
      expect(call.init.redirect).toBe("error");
      expect(call.init.cache).toBe("no-store");
      expect(new Headers(call.init.headers).has("authorization")).toBe(false);
    }
    expect(calls[0]!.url).toBe(
      "https://api.github.com/repos/example/project/pulls/12",
    );
    expect(calls[1]!.url).toBe(
      "https://patch-diff.githubusercontent.com/raw/example/project/pull/12.diff",
    );
    expect(new Headers(calls[1]!.init.headers).get("accept")).toBe(
      "text/plain",
    );
  });
  test("supports closed and merged PRs", async () => {
    for (const merged of [true, false]) {
      const { fetcher } = github({ ...metadata, state: "closed", merged });
      expect((await fetchPublicPullRequest(url, fetcher)).pr.state).toBe(
        merged ? "merged" : "closed",
      );
    }
  });
  test("rejects private or unknown visibility without downloading a diff", async () => {
    for (const data of [
      { ...metadata, base: { repo: { private: true } } },
      { ...metadata, base: null },
    ]) {
      const { calls, fetcher } = github(data);
      await status(fetchPublicPullRequest(url, fetcher), 422);
      expect(calls).toHaveLength(1);
    }
  });
  test("maps unavailable, rate-limited and upstream failures", async () => {
    for (const [upstream, expected] of [
      [404, 404],
      [401, 404],
      [403, 403],
      [429, 429],
      [500, 502],
    ] as const)
      await status(
        fetchPublicPullRequest(
          url,
          async () => new Response(null, { status: upstream }),
        ),
        expected,
      );
    await status(
      fetchPublicPullRequest(
        url,
        async () =>
          new Response(null, {
            status: 403,
            headers: { "x-ratelimit-remaining": "0" },
          }),
      ),
      429,
    );
    await status(
      fetchPublicPullRequest(url, async () => {
        throw new TypeError("network failure");
      }),
      502,
    );
  });
  test("rejects empty and oversized diffs", async () => {
    for (const [diff, expected] of [
      ["", 422],
      ["x".repeat(100001), 413],
    ] as const)
      await status(
        fetchPublicPullRequest(url, github(metadata, diff).fetcher),
        expected,
      );
  });
  test("rejects malformed metadata", async () => {
    await status(
      fetchPublicPullRequest(url, github({ ...metadata, number: 13 }).fetcher),
      502,
    );
    await status(
      fetchPublicPullRequest(url, github({ ...metadata, title: null }).fetcher),
      502,
    );
  });
  test("never fetches invalid input", async () => {
    const { calls, fetcher } = github();
    await status(fetchPublicPullRequest("http://localhost", fetcher), 400);
    expect(calls).toHaveLength(0);
  });
  test("allows callers to configure download limits", async () => {
    await status(
      fetchPr(url, { fetcher: github().fetcher, maxDiffBytes: 10 }),
      413,
    );
    expect(
      (await fetchPr(url, { fetcher: github().fetcher, maxDiffBytes: 200_000 }))
        .raw,
    ).toBe(raw);
  });
  test("validates options before fetching", async () => {
    const { fetcher, calls } = github();
    await expect(fetchPr(url, { fetcher, maxDiffBytes: -1 })).rejects.toThrow(
      RangeError,
    );
    await expect(fetchPr(url, { fetcher, timeoutMs: 0 })).rejects.toThrow(
      RangeError,
    );
    expect(calls).toHaveLength(0);
  });
});
