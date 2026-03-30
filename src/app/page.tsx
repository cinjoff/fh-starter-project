import type { Icon } from "@phosphor-icons/react";
import {
  BugBeetleIcon,
  CheckCircleIcon,
  DatabaseIcon,
  EnvelopeIcon,
  LockKeyIcon,
  RocketLaunchIcon,
  TerminalIcon,
  TestTubeIcon,
  UsersThreeIcon,
  WrenchIcon,
  XCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";

type Feature = {
  icon: Icon;
  title: string;
  description: string;
  envKey?: string;
  enabled?: boolean;
  enableHint?: string;
};

function getFeatures(): Feature[] {
  const authEnabled = env.ENABLE_AUTH === "true";
  const dbEnabled = env.ENABLE_DB === "true";
  const orgsEnabled = env.ENABLE_ORGANIZATIONS === "true";
  const emailsEnabled = env.ENABLE_EMAILS === "true";

  return [
    {
      icon: LockKeyIcon,
      title: "Authentication",
      description: "Sign up, sign in, password reset. Ready to go.",
      envKey: "ENABLE_AUTH",
      enabled: authEnabled,
      enableHint: 'Add ENABLE_AUTH="true" to .env.local',
    },
    {
      icon: DatabaseIcon,
      title: "Database",
      description: "PostgreSQL via Supabase. Seeded with sample data.",
      envKey: "ENABLE_DB",
      enabled: dbEnabled,
      enableHint: 'Add ENABLE_DB="true" and DATABASE_URL to .env.local',
    },
    {
      icon: UsersThreeIcon,
      title: "Organizations",
      description: "Multi-tenant support. Invite members, assign roles.",
      envKey: "ENABLE_ORGANIZATIONS",
      enabled: orgsEnabled,
      enableHint: 'Add ENABLE_ORGANIZATIONS="true" to .env.local',
    },
    {
      icon: EnvelopeIcon,
      title: "Transactional Email",
      description: "Email verification, password resets, and invitations via Resend.",
      envKey: "ENABLE_EMAILS",
      enabled: emailsEnabled,
      enableHint: 'Add ENABLE_EMAILS="true" and RESEND_API_KEY to .env.local',
    },
    {
      icon: BugBeetleIcon,
      title: "Error Tracking",
      description: "Local error monitoring. See what broke and why.",
    },
    {
      icon: TestTubeIcon,
      title: "Testing",
      description: "Unit and end-to-end tests. Confidence from day one.",
    },
    {
      icon: WrenchIcon,
      title: "Code Quality",
      description: "Linting, formatting, and type checking. Consistent code.",
    },
  ];
}

function FeatureCard({ feature }: { feature: Feature }) {
  const hasToggle = feature.envKey !== undefined;
  const isEnabled = feature.enabled ?? true;

  return (
    <div
      className={`flex gap-3 rounded-lg border p-4 transition-colors ${
        isEnabled
          ? "bg-card hover:border-primary/30 hover:bg-primary/5"
          : "border-dashed bg-muted/30 opacity-75"
      }`}
    >
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-md ${
          isEnabled ? "bg-primary/10" : "bg-muted"
        }`}
      >
        <feature.icon
          size={18}
          weight="duotone"
          className={isEnabled ? "text-primary" : "text-muted-foreground"}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{feature.title}</p>
          {hasToggle &&
            (isEnabled ? (
              <CheckCircleIcon size={14} weight="fill" className="text-emerald-500" />
            ) : (
              <XCircleIcon size={14} weight="fill" className="text-muted-foreground" />
            ))}
        </div>
        <p className="text-xs text-muted-foreground">{feature.description}</p>
        {hasToggle && !isEnabled && feature.enableHint && (
          <p className="mt-1 font-mono text-[11px] text-muted-foreground/70">
            {feature.enableHint}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const features = getFeatures();
  const toggleableCount = features.filter((f) => f.envKey).length;
  const enabledToggleable = features.filter((f) => f.envKey && f.enabled).length;

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <div className="flex w-full max-w-2xl flex-col items-center gap-16">
        {/* Hero */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10">
            <RocketLaunchIcon size={28} weight="duotone" className="text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">fh-starter-project</h1>
          <p className="max-w-md text-lg text-muted-foreground">
            Production-ready starter template — build on a solid foundation.
          </p>
          <p className="text-sm text-muted-foreground">
            {enabledToggleable}/{toggleableCount} configurable features enabled
          </p>
        </div>

        {/* What's Inside */}
        <div className="w-full space-y-6">
          <h2 className="text-center text-xl font-semibold tracking-tight">What&apos;s Inside</h2>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </div>
        </div>

        {/* Getting Started */}
        <div className="w-full space-y-4">
          <h2 className="text-center text-xl font-semibold tracking-tight">Getting Started</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                1
              </span>
              <p>
                <Link
                  href="/login"
                  className="text-foreground underline underline-offset-4 hover:text-foreground/80"
                >
                  Sign in with a test account
                </Link>{" "}
                to explore the dashboard, members, and settings.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                2
              </span>
              <p>
                Plan your first feature with{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">/fh:plan-work</code> —
                describe what you want to build and get a step-by-step plan.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                3
              </span>
              <p>
                Build it with{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">/fh:build</code> — turns your
                plan into working code with tests and quality checks.
              </p>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-md border border-dashed bg-muted/30 p-3">
              <TerminalIcon size={16} weight="duotone" className="mt-0.5 shrink-0 text-primary" />
              <p className="text-xs">
                This project uses <span className="font-medium text-foreground">fhhs-skills</span> —
                an AI-powered workflow for planning, building, and reviewing code. Run{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">/fh:progress</code> to see
                project status, or{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">/fh:auto</code> for fully
                autonomous execution.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button size="lg" nativeButton={false} render={<Link href="/login" />}>
          Sign In
        </Button>
      </div>
    </div>
  );
}
