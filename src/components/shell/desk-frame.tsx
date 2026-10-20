"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { Sidebar } from "@/components/shell/sidebar";
import { CopilotDrawer } from "@/features/copilot/components/copilot-drawer";
import type { ChatMessage, PreviewModel } from "@/lib/domain";
import { cn } from "@/lib/utils";

export function DeskFrame({
  name,
  email,
  roleLabel,
  avatarUrl,
  pendingChats,
  messages,
  previews,
  children,
}: {
  name: string;
  email: string;
  roleLabel: string;
  avatarUrl: string | null;
  pendingChats: number;
  messages: ChatMessage[];
  previews: PreviewModel[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const metaSim = pathname.startsWith("/simulation");
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    function show() {
      setChatOpen(true);
    }
    window.addEventListener("desk-open", show);
    return () => window.removeEventListener("desk-open", show);
  }, []);

  return (
    <div
      className={cn(
        "min-h-screen md:grid md:h-dvh md:grid-cols-[240px_minmax(0,1fr)] md:overflow-hidden",
        metaSim && "meta-sim-bleed",
      )}
    >
      <Sidebar
        name={name}
        email={email}
        roleLabel={roleLabel}
        avatarUrl={avatarUrl}
        pendingChats={pendingChats}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((open) => !open)}
      />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col xl:flex-row">
        <main
          className={cn(
            "@container min-h-0 min-w-0 flex-1 overflow-y-auto",
            metaSim ? "bg-[var(--meta-bg,#f0f2f5)] p-0" : "desk-canvas px-6 py-8 md:px-10",
          )}
        >
          <div className={cn("w-full", metaSim ? "max-w-none" : "max-w-[1120px]")}>{children}</div>
        </main>
        {chatOpen ? <CopilotDrawer messages={messages} previews={previews} onClose={() => setChatOpen(false)} /> : null}
      </div>
    </div>
  );
}
