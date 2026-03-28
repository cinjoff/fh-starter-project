import { redirect } from "next/navigation";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== "development") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <div className="bg-amber-400 px-4 py-2 text-center text-sm font-medium text-amber-900">
        Development Dashboard — not visible in production
      </div>
      <main>{children}</main>
    </div>
  );
}
