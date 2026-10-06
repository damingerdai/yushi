# Yushi Portal

A web app built with the Next.js App Router, Tailwind CSS 4, and shadcn/ui.

Install dependencies and start the app from the repository root:

```bash
bun install
bun run dev:portal
```

Visit http://localhost:3000.

## Common commands

Run these commands from this directory:

```bash
bun run build
bun run start
bun run typecheck
bunx shadcn@latest add input
```

Pages are in `src/app`, components are in `src/components/ui`, and the theme is in `src/app/globals.css`.
Use `@/*` to import modules from `src`.

- `/`: Upload a `.diff` or `.patch`, review changes and original patch messages,
  then generate a new commit message.
- `/pull-request`: Load a public `https://github.com/owner/repo/pull/123` link,
  review its changes, then generate a commit message. Private repositories are
  not supported; no GitHub credentials are used.

Both routes share `src/components/commit-workspace.tsx` and the existing core
commit agent through `/api/commit-message`. Configure `DEEPSEEK_API_KEY` on the
server. Diffs are limited to 100 KB and are sent to AI only when generating.

GitHub requests use the `@yushi/github` workspace library in `packages/github`.
The API route keeps Portal's diff validation and converts library errors to HTTP
responses; the library can also be consumed independently by other workspaces.
