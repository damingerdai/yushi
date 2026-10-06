# Yushi Portal

A web app built with the Next.js App Router, Tailwind CSS 4, and shadcn/ui.

Install dependencies and start the app from the repository root:

```bash
bun install
bun run dev:portal
```

Visit http://localhost:3000.

Use the header selector to switch between English and Simplified Chinese. English
is the default; a `yushi-locale` cookie preserves the selection for one year.
Server rendering reads that cookie to set the initial UI language and HTML `lang`.
Switching languages preserves loaded changes and generated messages. The UI and
error messages are localized; original content and English AI output are unchanged.

Translations live in `src/lib/i18n/zh.ts`, keyed by English source messages.
Use `useLocale().t()` for application copy and keep user-provided content outside
translation calls. Add translations when introducing or changing an error message.

## Common commands

Run these commands from this directory:

```bash
bun run build
bun run start
bun run typecheck
```

Pages are in `src/app`; feature components are in `src/components`. Reusable
shadcn/ui components and theme styles live in `../../packages/ui`, exposed as
`@yushi/ui`. `src/app/globals.css` imports the shared theme and adds diff styles.
The shared library uses Base UI (`base-nova`), including the language menu.

To add another component, run `bunx --no-install shadcn add tooltip` from
`packages/ui`. Portal's `components.json` routes shared UI imports to that package.
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
