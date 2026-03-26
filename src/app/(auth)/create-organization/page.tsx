"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(toSlug(name));
    }
  }, [name, slugTouched]);

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    setSlug(toSlug(value));
    setSlugError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSlugError(null);
    setLoading(true);

    try {
      const { data, error } = await authClient.organization.create({
        name,
        slug,
      });

      if (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.toLowerCase().includes("slug") || message.toLowerCase().includes("already")) {
          setSlugError("This slug is already taken");
          return;
        }
        toast.error("Something went wrong");
        return;
      }

      if (data) {
        await authClient.organization.setActive({
          organizationId: data.id,
        });
      }

      router.push("/dashboard");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Create your organization</h1>
          <p className="text-muted-foreground text-sm">Set up your organization to get started</p>
        </div>

        <form data-testid="create-organization-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization name</Label>
            <Input
              id="org-name"
              name="org-name"
              type="text"
              placeholder="My Organization"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="org-name-input"
              aria-label="Organization name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-slug">Slug</Label>
            <Input
              id="org-slug"
              name="org-slug"
              type="text"
              placeholder="my-organization"
              required
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              aria-invalid={slugError ? true : undefined}
              aria-describedby={slugError ? "slug-error" : undefined}
              data-testid="org-slug-input"
              aria-label="Organization slug"
            />
            {slugError ? (
              <p
                id="slug-error"
                className="text-destructive text-sm"
                data-testid="slug-error"
                role="alert"
              >
                {slugError}
              </p>
            ) : (
              <p className="text-muted-foreground text-xs">
                Used in URLs. Auto-generated from name.
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !name.trim() || !slug.trim()}
            data-testid="create-organization-submit"
          >
            {loading ? "Creating..." : "Create organization"}
          </Button>
        </form>
      </div>
    </div>
  );
}
