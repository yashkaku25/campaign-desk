import { redirect } from "next/navigation";

import { BrandMark } from "@/components/brand/mark";
import { LoginForm } from "@/features/auth/components/login-form";
import { getCurrentUser } from "@/features/auth/services/require-user";
import { env } from "@/lib/env";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main className="desk-canvas grid min-h-screen place-items-center px-6 py-16">
      <section className="grid w-full max-w-3xl overflow-hidden rounded-3xl border border-line bg-card md:grid-cols-[240px_1fr]">
        <div className="hidden bg-ink px-7 py-10 text-paper md:block">
          <BrandMark tone="paper" />
        </div>
        <div className="px-8 py-10">
          <LoginForm
            demoEmail={env.demoEmail}
            demoPassword={env.dataBackend === "local" ? env.demoPassword : ""}
            showDemo={env.dataBackend === "local"}
            startMode={params.mode === "sign-up" ? "sign-up" : "sign-in"}
          />
        </div>
      </section>
    </main>
  );
}
