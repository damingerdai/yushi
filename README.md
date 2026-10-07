# yushi

_Ancient Wisdom. Modern Code Review._
_古有御史明察秋毫，今有 AI 守护代码质量_

A Git commit message assistant managed with Bun workspaces and Turborepo.

Portal supports English and Simplified Chinese through the header language selector,
with English as the default. The selection persists in a one-year `yushi-locale`
cookie and applies across both pages and reloads. Application errors are translated
when displayed; Server Actions and the shared GitHub library retain English diagnostics.
Generated commit messages continue to use English.
Uploaded diffs, original commit messages, PR titles, and filenames retain their
original content and language.

## Project structure

```text
apps/
  cli/           # @yushi/cli: command-line entry point
  portal/        # @yushi/portal: Next.js web app with Tailwind CSS and shadcn/ui
packages/
  core/          # @yushi/core: Mastra agent, DeepSeek configuration, and Git tools
  github/        # @yushi/github: reusable public GitHub PR client
  ui/            # @yushi/ui: shared shadcn/ui components based on Base UI
tsconfig.json    # Shared TypeScript configuration
turbo.json       # Task dependencies and cache configuration
```

The CLI depends on core through `workspace:*`. Core exports TypeScript source
that Bun runs directly, with no separate build step. Each workspace declares its own runtime dependencies.

## Installation and configuration

Using Bun 1.4.2, run these commands from the repository root:

```bash
bun install
cp .env.example .env
```

Set `DEEPSEEK_API_KEY` in the root `.env` file or as an environment variable.
Bun loads `.env` automatically; Turbo's dev task allows this variable to pass through.

Portal deployments on Vercel should also add the Upstash Redis integration,
which injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to enable
per-IP rate limits on Server Actions. See
[apps/portal/README.md](apps/portal/README.md#rate-limiting).

## Usage

```bash
# Analyze staged changes in the current repository
bun run dev

# Analyze unstaged changes in a specific repository
bun run dev -- --repo /absolute/path/to/repo --unstaged
```

The dev command runs once per invocation and does not cache model responses.
The workspace dev script starts Bun from the repository root so that the root
`.env`, default repository, and relative `--repo` paths resolve consistently.

## Portal

```bash
# Start the web development server at http://localhost:3000
bun run dev:portal

# Build and start Portal separately
bun run --cwd apps/portal build
bun run --cwd apps/portal start

# Add a shadcn/ui component
cd packages/ui
bunx --no-install shadcn add tooltip
```

Portal uses the Next.js App Router, with pages in `apps/portal/src/app`
and shared UI components in `packages/ui/src/components`. Portal consumes the
`@yushi/ui` workspace for buttons, inputs, cards, menus, alerts, and collapsible
diff sections. Theme tokens and Tailwind utilities live in `packages/ui/src/styles/globals.css`;
the app keeps only its diff-specific styles. See [the UI package guide](packages/ui/README.md).
Upload or drop a `.diff` or
`.patch` file (up to 100 KB) to review GitHub-style unified changes, line numbers,
and original format-patch commit messages. Click the generation button to produce
and copy a new Angular-style commit message using the existing core commit agent.
Files are parsed in the browser; generation sends the changes to the server and DeepSeek.
The server requires `DEEPSEEK_API_KEY`; never expose it as a `NEXT_PUBLIC_` variable.
When starting Portal directly, export the key or configure `apps/portal/.env.local`.

The `/pull-request` page accepts public GitHub pull request URLs, including links
to the Files changed and Commits tabs. Load a PR to preview its title, status, and
diff, then generate a commit message using the same core agent. The upload page
and PR page share the diff viewer and generation UI. Both routes live under the
`(workspace)` route group, whose layout keeps the workspace shell and commit
preferences mounted during navigation. Switching sources resets the source-specific
diff and result and ignores stale action results; type, scope, and footer are retained.
Each page composes its own import component, diff preview, and commit message panel.
A page-scoped session provider owns requests and results; the layout owns shared
commit preferences and the header/navigation/footer.
The public URLs remain `/` and `/pull-request`.

PR metadata and public visibility are fetched anonymously through the
[GitHub REST API](https://docs.github.com/en/rest/pulls/pulls#get-a-pull-request).
Diffs are downloaded from `https://patch-diff.githubusercontent.com/raw/{owner}/{repo}/pull/{number}.diff`.
No GitHub token is needed or forwarded. Private repositories and GitHub Enterprise
hosts are not supported. GitHub may return the same not-found response for private
and nonexistent repositories. Rate limits, timeouts, empty changes, and diffs over
100 KB are reported in the page; oversized diffs are rejected rather than truncated.

GitHub access lives in the framework-independent `@yushi/github` workspace.
Portal imports it through `workspace:*` and handles diff parsing and HTTP responses.
See [packages/github/README.md](packages/github/README.md) for its API and options.

Run parser, Server Action, and GitHub library checks with `bun test tests packages/github`.

## Checks and builds

Biome provides shared formatting, linting, and import organization for all workspaces
and root-level tests. Run these commands from the repository root:

```bash
bun run format        # Format supported files in place
bun run format:check  # Check formatting without writing
bun run lint          # Run lint rules
bun run lint:fix      # Apply safe lint fixes
bun run check         # Check formatting, lint, and imports (for CI)
bun run check:fix     # Apply formatting, safe lint fixes, and import organization
```

The root `biome.json` uses two-space indentation, double quotes, recommended lint
rules, and Tailwind CSS directive support. Non-null assertions remain allowed for
the existing bounds-checked parser and TypeScript's `noUncheckedIndexedAccess`.
Git-ignored files, build output, generated Next.js declarations, and `bun.lock`
are excluded. Unsupported file types such as Markdown are left unchanged.
Biome is pinned in the root development dependencies; a global install is not required.
Editor integrations should use this workspace version and the root configuration.
See the [Biome documentation](https://biomejs.dev/installation/quick-start/).

```bash
bun run typecheck
bun run build

# Run the build output from the repository root
bun apps/cli/dist/index.js --repo /absolute/path/to/repo
```

Turbo runs type checks in dependency order and caches their results, the CLI's `dist/**` output,
and Portal's `.next/**` output. The CLI builds with Bun and keeps dependencies as external imports.
The output requires the current workspace and installed dependencies; it is not a standalone binary.

## Adding a workspace

Create a directory and `package.json` under `apps/*` or `packages/*`, use
`workspace:*` for internal dependencies, and run `bun install`. Extend the root
`tsconfig.json` for TypeScript configuration. Define `build` or `typecheck` scripts
in the package to include it in Turbo tasks.

## Commit message options

Angular messages use `<type>(<scope>): <summary>`, followed by a blank line,
a body, and an optional footer. Standard types are `build`, `ci`, `docs`, `feat`,
`fix`, `perf`, `refactor`, and `test`. Scope is optional. Use an imperative,
lowercase summary without a final period. Except for `docs`, the body must explain
the motivation and impact in at least 20 characters. Footers can contain
`BREAKING CHANGE:` with migration instructions, `DEPRECATED:` with alternatives,
and issue references such as `Fixes #123`.

Both Portal pages provide type suggestions, a custom type input, scope, and a
multiline footer before generation. Blank fields retain automatic behavior.
Custom types extend the Angular standard. The agent is instructed to preserve
supplied footer text, including its language.

```bash
bun apps/cli/src/index.ts --type feat --scope core --footer 'Fixes #123'
bun apps/cli/src/index.ts --type release --scope cli
```

Types allow up to 24 lowercase letters, digits, or hyphens, starting with a letter.
Scopes allow up to 40 letters, digits, spaces, `.`, `_`, `/`, or `-`, starting
with a letter or digit. Footers allow up to 4,000 characters. Surrounding whitespace
is trimmed. `generateCommitMessageAction(diff, options)` accepts these fields and returns a
serializable success or error result. Both Portal operations use Server Actions in
`apps/portal/src/app/actions.ts`; there are no custom API route handlers.
Next.js applies its default 1 MB action request limit; diff content is independently
limited to 100 KB. Actions cannot be aborted from the browser; obsolete results
are ignored after changing the input or leaving a page.

## License

Licensed under the [MIT License](LICENSE).

Copyright (c) 2026 damingerdai.
