import { RocketLaunchIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

const techStack = [
  { name: "Next.js 16", description: "React framework" },
  { name: "Tailwind v4", description: "Utility-first CSS" },
  { name: "Shadcn/ui", description: "Component library" },
  { name: "Supabase", description: "Auth & database" },
  { name: "Sentry", description: "Error tracking" },
  { name: "TypeScript", description: "Type safety" },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="flex flex-col items-center gap-8 text-center">
        <div className="flex items-center gap-3">
          <RocketLaunchIcon size={32} className="text-primary" />
          <h1 className="text-3xl font-semibold tracking-tight">fh-starter-project</h1>
        </div>

        <p className="max-w-md text-muted-foreground">Production-ready Next.js starter template</p>

        <div className="grid w-full max-w-lg grid-cols-2 gap-3 sm:grid-cols-3">
          {techStack.map((item) => (
            <div key={item.name} className="rounded-lg border bg-card p-3 text-left">
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>

        <Button>Get Started</Button>
      </div>
    </div>
  );
}
