import { expect, test } from "bun:test";
import { clientIp, rateLimitResponse } from "../apps/portal/src/lib/rate-limit";

test("client IP prefers Vercel's proxy-secured headers", () => {
  expect(
    clientIp(
      new Request("https://portal.test", {
        headers: {
          "x-real-ip": "1.2.3.4",
          "x-forwarded-for": "9.9.9.9",
        },
      }),
    ),
  ).toBe("1.2.3.4");
  expect(
    clientIp(
      new Request("https://portal.test", {
        headers: { "x-forwarded-for": "5.6.7.8, 10.0.0.1" },
      }),
    ),
  ).toBe("5.6.7.8");
  expect(clientIp(new Request("https://portal.test"))).toBe("unknown");
});

test("rate limiting fails open without Upstash configuration", async () => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  for (const route of ["commit-message", "pull-request"] as const)
    expect(
      await rateLimitResponse(route, new Request("https://portal.test")),
    ).toBeUndefined();
});
