# yushi

A Git commit message assistant managed with Bun workspaces and Turborepo.

## Project structure

```text
apps/
  cli/           # @yushi/cli: command-line entry point
  portal/        # @yushi/portal: Next.js web app with Tailwind CSS and shadcn/ui
packages/
  core/          # @yushi/core: Mastra agent, DeepSeek configuration, and Git tools
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
cd apps/portal
bunx shadcn@latest add input
```

Portal uses the Next.js App Router, with pages in `apps/portal/src/app`
and UI components in `apps/portal/src/components/ui`. Upload or drop a `.diff` or
`.patch` file (up to 100 KB) to review GitHub-style unified changes, line numbers,
and original format-patch commit messages. Click the generation button to produce
and copy a new Angular-style commit message using the existing core commit agent.
Files are parsed in the browser; generation sends the changes to the server and DeepSeek.
The server requires `DEEPSEEK_API_KEY`; never expose it as a `NEXT_PUBLIC_` variable.
When starting Portal directly, export the key or configure `apps/portal/.env.local`.

Run parser and API checks with `bun test tests/portal.test.ts`.

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
