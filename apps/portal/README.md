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
Use `@/*` to import modules from `src`. The current home page is a basic entry point and is not yet connected to backend services.
