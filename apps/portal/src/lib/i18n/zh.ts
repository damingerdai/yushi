// English source messages are the lookup keys; keep original user content untranslated.
export const zh: Record<string, string> = {
  "Enter a valid public GitHub PR URL, such as https://github.com/owner/repo/pull/123.":
    "请输入有效的公开 GitHub PR 链接，例如 https://github.com/owner/repo/pull/123。",
  "GitHub returned an empty response. Please try again later.":
    "GitHub 返回了空响应，请稍后重试。",
  "This PR could not be found or its repository is not public. Private repositories are not supported yet.":
    "找不到该 PR，或仓库不是公开仓库；暂不支持私有仓库。",
  "GitHub rate limit reached. Please try again later.":
    "GitHub 请求频率受限，请稍后重试。",
  "GitHub rate limit reached": "GitHub 请求频率受限",
  "GitHub denied access. Only publicly accessible repositories are supported. Please try again later.":
    "GitHub 拒绝访问；目前仅支持可公开访问的仓库，请稍后重试。",
  "Unable to retrieve the PR from GitHub. Please try again later.":
    "无法从 GitHub 获取 PR，请稍后重试。",
  "Private and non-public repositories are not supported yet.":
    "暂不支持私有或非公开仓库。",
  "GitHub returned incomplete PR information. Please try again later.":
    "GitHub 返回的 PR 信息不完整，请稍后重试。",
  "This PR has no code changes to generate a commit message from.":
    "该 PR 没有可用于生成提交说明的代码变更。",
  "The GitHub request timed out. Please try again later.":
    "GitHub 请求超时，请稍后重试。",
  "Unable to connect to GitHub or read its response. Please try again later.":
    "无法连接 GitHub 或响应异常，请稍后重试。",
  "GitHub returned an incomplete or unsupported diff. Please try again later.":
    "GitHub 返回的 diff 不完整或格式不受支持，请稍后重试。",
  "PR changes may be incomplete or updating. Reload the PR before generating a message.":
    "PR 变更可能不完整或正在更新，请重新加载后再生成。",
  "Unable to load the PR. Please try again.": "获取 PR 失败，请重试。",
  "Unable to load the PR. Please try again later.":
    "获取 PR 失败，请稍后重试。",
  "Please select a .diff or .patch file.": "请选择 .diff 或 .patch 文件。",
  "The file exceeds 100 KB. Please split it before uploading.":
    "文件超过 100 KB，请拆分后上传。",
  "Unable to read the file.": "文件读取失败。",
  "A network error occurred. Please try again.": "网络异常，请重试。",
  "Unable to copy. Please select and copy the commit message manually.":
    "复制失败，请手动选择并复制提交说明。",
  "Change source": "变更来源",
  "Upload file": "上传文件",
  "MAKE EVERY COMMIT CLEAR": "让每一次提交更清晰",
  "Understand changes. Write better commits.": "读懂变更，写好提交。",
  "Ancient Wisdom. Modern Code Review.":
    "古有御史明察秋毫，今有 AI 守护代码质量",
  "Enter a public GitHub PR URL, review the changes, and let AI draft your commit message.":
    "输入公开 GitHub PR 链接，查看代码差异，再让 AI 为你总结 commit message。",
  "Upload a diff or patch, review the changes, and let AI draft your commit message.":
    "上传 diff 或 patch，查看代码差异，再让 AI 为你总结 commit message。",
  "Import a GitHub PR": "导入 GitHub PR",
  "GitHub pull request URL": "GitHub Pull Request 链接",
  "Loading…": "正在加载…",
  "Load PR": "加载 PR",
  "Public github.com repositories only. Private repositories are not supported yet. Maximum diff size: 100 KB. Changes are sent to AI only when you generate a message.":
    "仅支持公开的 github.com 仓库，暂不支持私有仓库。Diff 最大 100 KB；点击生成时才会发送给 AI。",
  "Fetching changes from GitHub": "正在从 GitHub 获取变更",
  "PR changes loaded": "PR 变更已加载",
  Open: "进行中",
  Closed: "已关闭",
  Merged: "已合并",
  "Upload a diff or patch": "上传变更文件",
  "Reading…": "正在读取…",
  "Drop a file here, or click to browse": "拖放文件到这里，或点击选择文件",
  "Select a diff or patch file": "选择 diff 或 patch 文件",
  ".diff / .patch · Up to 100 KB · Changes are sent to AI only when generating":
    ".diff / .patch · 最大 100 KB · 生成时才会将变更发送给 AI",
  "File diffs": "文件差异",
  "Changed files": "文件变更",
  "Load a public PR to review its changes line by line.":
    "加载公开 PR 后，在这里逐行查看代码变更。",
  "Upload a file to review its changes line by line.":
    "上传文件后，在这里逐行查看代码变更。",
  "Original commit message": "原始 commit message",
  "This patch does not include a commit message.": "此 patch 未包含提交说明。",
  "Generate an English commit message following the Angular commit guidelines.":
    "根据代码变更，生成符合 Angular 提交规范的英文提交说明。",
  "Analyzing changes…": "正在分析变更…",
  Regenerate: "重新生成",
  "Generate commit message": "生成 commit message",
  Copied: "已复制",
  "Copy message": "复制提交说明",
  "Generating your commit message. Please wait.": "正在生成提交说明，请稍候。",
  "Your generated commit message will appear here.":
    "生成的提交说明将显示在这里。",
  "API endpoint not found (404). Please restart the Portal development server and try again.":
    "接口未找到（404），请重启 Portal 开发服务后重试。",
  "API endpoint not found (404)": "接口未找到（404）",
  "Unexpected server response": "服务返回异常响应",
  "Review diffs and patches, and generate clear commit messages with AI":
    "查看 diff 与 patch，并使用 AI 生成清晰的 commit message",
  "The file is empty. Please upload a diff or patch containing changes.":
    "文件为空，请上传包含变更的 diff 或 patch。",
  "Please select a plain-text diff or patch file.":
    "请选择文本格式的 diff 或 patch 文件。",
  "The diff contains an incomplete hunk. Please upload the complete file.":
    "Diff 区块不完整，请上传完整文件。",
  "The diff hunk is malformed or incomplete. Please check the file contents.":
    "Diff 区块格式不完整，请检查文件内容。",
  "No supported unified diff was found. Export your changes using git diff or git format-patch.":
    "未找到可识别的 unified diff，请使用 git diff 或 git format-patch 导出。",
  "The request body must not be empty.": "请求不能为空。",
  "Diff content is missing.": "缺少 diff 内容。",
  "Invalid diff content. Please upload a complete diff or patch (up to 100 KB).":
    "无效的 diff 内容，请上传完整的 diff 或 patch（最大 100 KB）。",
  "DEEPSEEK_API_KEY is not configured on the server.":
    "服务端尚未配置 DEEPSEEK_API_KEY。",
  "AI generation failed. Please try again later or check the server model configuration.":
    "AI 生成失败，请稍后重试或检查服务端模型配置。",
  incomplete: "不完整",
  Language: "语言",
  "Yushi home": "Yushi 首页",
  "GitHub Pull Request": "GitHub 拉取请求",
  "AI commit message": "AI 提交说明",
  "Yushi · Clearer commits start here.": "Yushi · 让每一次提交更清晰。",
  "Diff for {file}": "{file} 的代码差异",
  "Unexpected server response (HTTP {status}). Please try again later or check the server logs.":
    "服务返回异常响应（HTTP {status}），请稍后重试或检查服务端日志。",
  "The GitHub response exceeds the {limit}-byte limit. Please split the changes.":
    "GitHub 响应超过 {limit} 字节限制，请拆分变更。",
  "Failed to fetch": "网络请求失败，请重试。",
  "Load failed": "加载失败，请重试。",
  "NetworkError when attempting to fetch resource.": "网络请求失败，请重试。",
};
