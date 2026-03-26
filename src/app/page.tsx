import { RocketLaunchIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const techStack = [
  { name: "Next.js 16", description: "React framework" },
  { name: "Tailwind v4", description: "Utility-first CSS" },
  { name: "Shadcn/ui", description: "Component library" },
  { name: "Better Auth", description: "Authentication" },
  { name: "Sentry", description: "Error tracking" },
  { name: "TypeScript", description: "Type safety" },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="flex flex-col items-center gap-10 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10">
            <RocketLaunchIcon size={28} weight="duotone" className="text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">fh-starter-project</h1>
          <p className="max-w-md text-lg text-muted-foreground">
            Production-ready Next.js starter template
          </p>
        </div>

        <div className="grid w-full max-w-lg grid-cols-2 gap-3 sm:grid-cols-3">
          {techStack.map((item) => (
            <div
              key={item.name}
              className="rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>

        <Button size="lg" render={<Link href="/login" />}>
          Get Started
        </Button>
      </div>
    </div>
  );
}
