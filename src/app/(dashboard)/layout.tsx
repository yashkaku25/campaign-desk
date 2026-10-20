import { DeskFrame } from "@/components/shell/desk-frame";
import { accessOf } from "@/features/auth/services/access";
import { requireUser } from "@/features/auth/services/require-user";
import { listCopilotThread } from "@/features/copilot/services/list-thread";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const thread = await listCopilotThread();

  return (
    <DeskFrame
      name={user.displayName}
      email={user.email}
      roleLabel={accessOf(user).role === "admin" ? "Admin" : "Team"}
      avatarUrl={user.avatarUrl}
      pendingChats={thread.previews.filter((preview) => preview.canApprove).length}
      messages={thread.messages}
      previews={thread.previews}
    >
      {children}
    </DeskFrame>
  );
}
