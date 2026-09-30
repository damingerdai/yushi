import { ArrowUpRight, GitBranch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10 sm:px-10">
      <header className="flex items-center justify-between border-b pb-6">
        <a href="/" className="flex items-center gap-2 font-semibold">
          <GitBranch className="size-5" aria-hidden="true" />
          Yushi
        </a>
        <Badge variant="secondary">Portal</Badge>
      </header>
      <section className="flex flex-1 flex-col justify-center gap-8 py-16">
        <div className="max-w-2xl space-y-4">
          <Badge variant="outline">Yushi on the web</Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Make every commit clear.</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Yushi helps you write commit messages from your Git changes. The web portal is ready, and commit message generation is currently available through the CLI.
          </p>
          <a href="#getting-started" className={buttonVariants({ size: "lg" })}>Get started</a>
        </div>
        <div className="grid gap-4 md:grid-cols-2" id="getting-started">
          <Card>
            <CardHeader>
              <CardTitle>Start with the command line</CardTitle>
              <CardDescription>Run from the repository root to analyze staged Git changes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm"><code>bun run dev</code></pre>
              <p className="text-sm text-muted-foreground">Before getting started, follow the project README to configure the model provider.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Build your workspace</CardTitle>
              <CardDescription>Extend the web app with Next.js, Tailwind CSS, and shadcn/ui.</CardDescription>
            </CardHeader>
            <CardContent>
              <a className={buttonVariants({ variant: "outline" })} href="https://ui.shadcn.com/docs">
                Component documentation <ArrowUpRight aria-hidden="true" />
              </a>
            </CardContent>
          </Card>
        </div>
      </section>
      <footer className="border-t pt-6 text-sm text-muted-foreground">Yushi · Clearer commits start here.</footer>
    </main>
  );
}
