"use client";

import { useEffect, useState } from "react";

import { Sidebar } from "@/components/shell/sidebar";
import { CopilotDrawer } from "@/features/copilot/components/copilot-drawer";
import type { ChatMessage, PreviewModel } from "@/lib/domain";

export function DeskFrame({
  name,
  email,
  avatarUrl,
  pendingChats,
  messages,
  previews,
  children,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
  pendingChats: number;
  messages: ChatMessage[];
  previews: PreviewModel[];
  children: React.ReactNode;
}) {
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    function show() {
      setChatOpen(true);
    }
    window.addEventListener("desk-open", show);
    return () => window.removeEventListener("desk-open", show);
  }, []);

  return (
    <div className="min-h-screen md:grid md:h-dvh md:grid-cols-[240px_minmax(0,1fr)] md:overflow-hidden">
      <Sidebar
        name={name}
        email={email}
        avatarUrl={avatarUrl}
        pendingChats={pendingChats}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((open) => !open)}
      />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col xl:flex-row">
        <main className="@container min-h-0 min-w-0 flex-1 overflow-y-auto px-6 py-8 md:px-10">
          <div className="w-full max-w-[1120px]">{children}</div>
        </main>
        {chatOpen ? <CopilotDrawer messages={messages} previews={previews} onClose={() => setChatOpen(false)} /> : null}
      </div>
    </div>
  );
}
