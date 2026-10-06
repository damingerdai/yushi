# @yushi/ui

Shared shadcn/ui components built on Base UI, using the `base-nova` style and
Lucide icons. This private workspace exports TypeScript source directly.

```tsx
import { Button } from "@yushi/ui/components/button";
import { Input } from "@yushi/ui/components/input";
import { Card, CardContent } from "@yushi/ui/components/card";

export function Example() {
  return (
    <Card>
      <CardContent>
        <Input aria-label="Name" />
        <Button>Continue</Button>
      </CardContent>
    </Card>
  );
}
```

## Components and styles

Components include Alert, Badge, Button, Card, Collapsible, DropdownMenu, Input,
Label, Separator, and Spinner. Stateful primitives use `@base-ui/react`, not Radix.

Add `"@yushi/ui": "workspace:*"` to a consumer's dependencies. React, React DOM,
and Tailwind CSS are peer dependencies. Import `@yushi/ui/globals.css` once in
the application's stylesheet to load the shared theme and utilities. Portal uses
the equivalent relative stylesheet path for Tailwind's PostCSS resolver.
The stylesheet explicitly scans this package's source with `@source "../"`.

Portal keeps diff-specific styles in its own stylesheet. Shared components have
no dependency on Next.js, locale providers, GitHub, or AI services. Compose
framework links using the Base UI `render` prop (and `nativeButton={false}` on
Button when rendering an anchor).

## Add components

From the repository root:

```bash
cd packages/ui
bunx --no-install shadcn add tooltip
```

Both this package and Portal have matching `base-nova` configurations. The app's
`ui` and `utils` aliases point here so future components stay shared. Generated
source is maintained in this repository; run `bun run check:fix` from the root
and review changes after adding components.

```bash
bun run --cwd packages/ui typecheck
```

See the [shadcn monorepo guide](https://ui.shadcn.com/docs/monorepo).
