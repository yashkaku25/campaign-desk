import { requireUser } from "@/features/auth/services/require-user";
import { getQuote } from "@/features/currency/services/currency-actions";
import { SettingsForm } from "@/features/profile/components/settings-form";

export default async function SettingsPage() {
  const user = await requireUser();
  const quote = await getQuote();
  return (
    <div className="max-w-xl space-y-6">
      <SettingsForm
        name={user.displayName}
        email={user.email}
        currency={quote.currency}
        avatarUrl={user.avatarUrl}
      />
    </div>
  );
}
