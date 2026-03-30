import { RocketLaunchIcon } from "@phosphor-icons/react/dist/ssr";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left panel — branded info, hidden on mobile */}
      <div className="hidden lg:flex flex-col justify-between bg-muted p-10">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <RocketLaunchIcon size={16} weight="duotone" className="text-primary" />
          </div>
          <span className="text-lg font-semibold">fh-starter</span>
        </div>
        <div className="space-y-2">
          <p className="text-lg font-medium">
            Production-ready starter with auth, teams, and database — ready to customize.
          </p>
          <p className="text-sm text-muted-foreground">
            Sign in with a test account to explore what&apos;s included.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Built with Next.js, Better Auth, and Supabase
        </p>
      </div>

      {/* Right panel — form area */}
      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
