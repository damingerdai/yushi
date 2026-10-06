export const MAX_DIFF_BYTES = 100_000;
export type DiffLine = {
  text: string;
  kind: "context" | "add" | "delete" | "meta";
  old?: number;
  next?: number;
};
export type DiffFile = {
  name: string;
  lines: DiffLine[];
  additions: number;
  deletions: number;
};
export type ParsedDiff = {
  files: DiffFile[];
  messages: string[];
  diff: string;
};

function path(value: string) {
  const raw = value.split("\t")[0] ?? value;
  let decoded = raw;
  if (raw.startsWith('"')) {
    try {
      // Git quotes non-ASCII UTF-8 bytes with octal escapes.
      const bytes: number[] = [];
      const inner = raw.slice(1, -1);
      for (let i = 0; i < inner.length; ) {
        const octal = /^\\([0-7]{3})/.exec(inner.slice(i));
        if (octal) {
          bytes.push(parseInt(octal[1]!, 8));
          i += 4;
        } else if (inner[i] === "\\" && i + 1 < inner.length) {
          const char = inner[i + 1]!;
          bytes.push(
            ...new TextEncoder().encode(
              ({ t: "\t", n: "\n", r: "\r" } as Record<string, string>)[char] ??
                char,
            ),
          );
          i += 2;
        } else {
          const char = String.fromCodePoint(inner.codePointAt(i)!);
          bytes.push(...new TextEncoder().encode(char));
          i += char.length;
        }
      }
      decoded = new TextDecoder().decode(new Uint8Array(bytes));
    } catch {
      decoded = raw;
    }
  }
  return decoded.replace(/^[ab]\//, "");
}

export function parseDiff(input: string): ParsedDiff {
  if (!input.trim())
    throw new Error(
      "The file is empty. Please upload a diff or patch containing changes.",
    );
  if (new TextEncoder().encode(input).length > MAX_DIFF_BYTES)
    throw new Error(
      "The file exceeds 100 KB. Please split it before uploading.",
    );
  if (input.includes("\0"))
    throw new Error("Please select a plain-text diff or patch file.");
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const files: DiffFile[] = [];
  const messages: string[] = [];
  const diff: string[] = [];
  let file: DiffFile | undefined;
  let old = 0,
    next = 0,
    oldLeft = 0,
    nextLeft = 0;
  const create = (name: string) => {
    if (oldLeft || nextLeft)
      throw new Error(
        "The diff contains an incomplete hunk. Please upload the complete file.",
      );
    file = { name, lines: [], additions: 0, deletions: 0 };
    files.push(file);
    oldLeft = nextLeft = 0;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (/^From [0-9a-f]{40,64} /i.test(line)) {
      if (oldLeft || nextLeft)
        throw new Error(
          "The diff contains an incomplete hunk. Please upload the complete file.",
        );
      file = undefined;
      continue;
    }
    if (!file && line.startsWith("Subject: ")) {
      let subject = line.slice(9);
      while (/^[ \t]/.test(lines[i + 1] ?? ""))
        subject += ` ${lines[++i]!.trim()}`;
      while (lines[i + 1] && lines[i + 1] !== "") i++;
      if (lines[i + 1] === "") i++;
      const body: string[] = [];
      while (
        i + 1 < lines.length &&
        lines[i + 1] !== "---" &&
        !lines[i + 1]!.startsWith("diff --git ")
      )
        body.push(lines[++i]!);
      messages.push(
        [subject.replace(/^\[PATCH[^\]]*\]\s*/i, ""), body.join("\n").trim()]
          .filter(Boolean)
          .join("\n\n"),
      );
      continue;
    }
    if (line.startsWith("diff --git ")) {
      const names = line.slice(11).match(/"(?:\\.|[^"\\])*"|\S+/g);
      create(path(names?.[1] ?? line.slice(11)));
    } else if (
      line.startsWith("--- ") &&
      lines[i + 1]?.startsWith("+++ ") &&
      oldLeft === 0 &&
      nextLeft === 0
    ) {
      if (!file || file.lines.some((l) => l.kind !== "meta"))
        create(path(line.slice(4)));
      const target = lines[i + 1]!.slice(4);
      file!.name = path(target === "/dev/null" ? line.slice(4) : target);
      file!.lines.push(
        { text: line, kind: "meta" },
        { text: lines[i + 1]!, kind: "meta" },
      );
      diff.push(line, lines[++i]!);
      continue;
    }
    if (!file) continue;
    if (line === "-- " && oldLeft === 0 && nextLeft === 0) {
      file = undefined;
      continue;
    }
    const hunk = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (hunk) {
      if (oldLeft || nextLeft)
        throw new Error(
          "The diff contains an incomplete hunk. Please upload the complete file.",
        );
      old = Number(hunk[1]);
      next = Number(hunk[3]);
      oldLeft = Number(hunk[2] ?? 1);
      nextLeft = Number(hunk[4] ?? 1);
      file.lines.push({ text: line, kind: "meta" });
    } else if (oldLeft > 0 || nextLeft > 0) {
      if (line.startsWith("+") && nextLeft > 0) {
        file.lines.push({ text: line, kind: "add", next: next++ });
        nextLeft--;
        file.additions++;
      } else if (line.startsWith("-") && oldLeft > 0) {
        file.lines.push({ text: line, kind: "delete", old: old++ });
        oldLeft--;
        file.deletions++;
      } else if (line.startsWith(" ") && oldLeft > 0 && nextLeft > 0) {
        file.lines.push({
          text: line,
          kind: "context",
          old: old++,
          next: next++,
        });
        oldLeft--;
        nextLeft--;
      } else if (line.startsWith("\\"))
        file.lines.push({ text: line, kind: "meta" });
      else
        throw new Error(
          "The diff hunk is malformed or incomplete. Please check the file contents.",
        );
    } else if (line) file.lines.push({ text: line, kind: "meta" });
    diff.push(line);
  }
  if (oldLeft || nextLeft)
    throw new Error(
      "The diff contains an incomplete hunk. Please upload the complete file.",
    );
  if (!files.length)
    throw new Error(
      "No supported unified diff was found. Export your changes using git diff or git format-patch.",
    );
  return { files, messages, diff: diff.join("\n") };
}
