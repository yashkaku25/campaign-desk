import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/components/login-form";
import { getCurrentUser } from "@/features/auth/services/require-user";
import { env } from "@/lib/env";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main className="grid min-h-screen place-items-center px-6 py-16">
      <section className="grid w-full max-w-3xl overflow-hidden rounded-3xl border border-line bg-card md:grid-cols-[240px_1fr]">
        <div className="hidden bg-ink px-7 py-10 text-paper md:block">
          <p className="flex gap-2" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-pine" />
            <span className="h-3 w-3 rounded-full bg-indigo" />
            <span className="h-3 w-3 rounded-full bg-amber" />
            <span className="h-3 w-3 rounded-full bg-rose" />
          </p>
          <p className="mt-5 font-serif text-2xl leading-none tracking-tight">Campaign desk</p>
        </div>
        <div className="px-8 py-10">
        <LoginForm
          demoEmail={env.demoEmail}
          demoPassword={env.dataBackend === "local" ? env.demoPassword : ""}
          showDemo={env.dataBackend === "local"}
        />
        </div>
      </section>
    </main>
  );
}
