import { SettingsForm } from "@/features/profile/components/settings-form";
import { getQuote } from "@/features/currency/services/currency-actions";
import { requireUser } from "@/features/auth/services/require-user";

export default async function SettingsPage() {
  const user = await requireUser();
  const quote = await getQuote();
  return (
    <SettingsForm
      name={user.displayName}
      email={user.email}
      currency={quote.currency}
      avatarUrl={user.avatarUrl}
    />
  );
}
