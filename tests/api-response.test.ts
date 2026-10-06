import { expect, test } from "bun:test";
import { readApiResponse } from "../apps/portal/src/lib/api-response";

test("HTML 404 produces actionable error instead of JSON syntax error", async () => {
  await expect(
    readApiResponse(
      new Response("<!DOCTYPE html><html>Not found</html>", {
        status: 404,
        headers: { "Content-Type": "text/html" },
      }),
    ),
  ).rejects.toThrow("API endpoint not found (404)");
});
test("HTML server errors and malformed JSON use safe fallback", async () => {
  for (const response of [
    new Response("<!DOCTYPE html>error", {
      status: 500,
      headers: { "Content-Type": "text/html" },
    }),
    new Response("<!DOCTYPE html>error", {
      headers: { "Content-Type": "application/json" },
    }),
    Response.json(null),
  ])
    await expect(readApiResponse(response)).rejects.toThrow(
      "Unexpected server response",
    );
});
test("preserves API errors and successful responses", async () => {
  await expect(
    readApiResponse(
      Response.json({ error: "GitHub rate limit reached" }, { status: 429 }),
    ),
  ).rejects.toThrow("GitHub rate limit reached");
  expect(
    await readApiResponse(
      Response.json({ message: "fix: update dependencies" }),
    ),
  ).toEqual({ message: "fix: update dependencies" });
});
