import { accessOf } from "@/features/auth/services/access";
import { requireUser } from "@/features/auth/services/require-user";
import { getQuote } from "@/features/currency/services/currency-actions";
import { SettingsForm } from "@/features/profile/components/settings-form";
import { TeamPanel } from "@/features/profile/components/team-panel";
import { loadTeam } from "@/features/profile/services/team-actions";

export default async function SettingsPage() {
  const user = await requireUser();
  const quote = await getQuote();
  const access = accessOf(user);
  const team = access.role === "admin" ? await loadTeam() : null;
  return (
    <div className="max-w-xl space-y-6">
      <SettingsForm
        name={user.displayName}
        email={user.email}
        currency={quote.currency}
        avatarUrl={user.avatarUrl}
      />
      {team ? <TeamPanel people={team.people} invites={team.invites} warning={team.warning} /> : (
        <p className="text-sm text-muted">An admin decides what you can change.</p>
      )}
    </div>
  );
}
