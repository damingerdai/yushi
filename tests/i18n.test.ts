import { expect, test } from "bun:test";
import { readApiResponse } from "../apps/portal/src/lib/api-response";
import { parseDiff } from "../apps/portal/src/lib/diff";
import { normalizeLocale, translate } from "../apps/portal/src/lib/i18n";

test("language preferences allow only supported locales and default to English", () => {
  expect(normalizeLocale("zh-CN")).toBe("zh-CN");
  for (const value of [undefined, "", "en", "fr", "<script>"])
    expect(normalizeLocale(value)).toBe("en");
});
test("a retained error can be rendered in either language", () => {
  let error = "";
  try {
    parseDiff("");
  } catch (cause) {
    error = (cause as Error).message;
  }
  expect(translate("en", error)).toBe(error);
  expect(translate("zh-CN", error)).toBe(
    "文件为空，请上传包含变更的 diff 或 patch。",
  );
});
test("API JSON and HTML error responses can be localized", async () => {
  for (const response of [
    Response.json(
      { error: "GitHub rate limit reached. Please try again later." },
      { status: 429 },
    ),
    new Response("<html>Bad gateway</html>", { status: 502 }),
  ]) {
    try {
      await readApiResponse(response);
      throw new Error("Expected request to fail");
    } catch (error) {
      const translated = translate("zh-CN", (error as Error).message);
      expect(translated).toMatch(
        /GitHub 请求频率受限|服务返回异常响应（HTTP 502）/,
      );
    }
  }
});
test("dynamic limits and filenames keep their values", () => {
  expect(
    translate(
      "zh-CN",
      "The GitHub response exceeds the 100000-byte limit. Please split the changes.",
    ),
  ).toContain("100000 字节");
  expect(translate("zh-CN", "Diff for {file}", { file: "src/中文.ts" })).toBe(
    "src/中文.ts 的代码差异",
  );
  expect(translate("en", "Diff for {file}", { file: "src/中文.ts" })).toBe(
    "Diff for src/中文.ts",
  );
});
test("unknown messages safely fall back to their original text", () => {
  for (const message of [
    "Unknown message",
    "__proto__",
    "constructor",
    "toString",
  ])
    expect(translate("zh-CN", message)).toBe(message);
});
