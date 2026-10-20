"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ClipboardList, FlaskConical, LayoutDashboard, Megaphone, MessageCircle } from "lucide-react";

import { BrandMark } from "@/components/brand/mark";
import { signOut } from "@/features/auth/services/auth-actions";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/simulation", label: "Simulation", icon: FlaskConical },
  { href: "/audit", label: "Audit", icon: ClipboardList },
];

export function Sidebar({
  name,
  email,
  roleLabel,
  avatarUrl,
  pendingChats = 0,
  chatOpen,
  onToggleChat,
}: {
  name: string;
  email: string;
  roleLabel: string;
  avatarUrl: string | null;
  pendingChats?: number;
  chatOpen: boolean;
  onToggleChat: () => void;
}) {
  const pathname = usePathname();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!accountOpen) return;
    function onPointer(event: MouseEvent) {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    }
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [accountOpen]);

  return (
    <aside className="flex flex-col bg-ink text-paper md:sticky md:top-0 md:h-dvh md:min-h-0">
      <div className="px-5 py-4 md:py-6">
        <BrandMark tone="paper" />
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-4 md:flex-col md:overflow-visible">
        {links.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap md:w-full",
                active ? "bg-paper text-ink" : "text-paper/80 hover:bg-white/10",
              )}
            >
              <Icon size={16} aria-hidden="true" />
              {link.label}
            </Link>
          );
        })}
        <button
          type="button"
          aria-pressed={chatOpen}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap md:w-full",
            chatOpen ? "bg-paper text-ink" : "text-paper/80 hover:bg-white/10",
          )}
          onClick={onToggleChat}
        >
          <MessageCircle size={16} aria-hidden="true" />
          Marketer
          {pendingChats > 0 ? (
            <span
              className={cn(
                "ml-auto rounded-full px-2 py-0.5 text-xs",
                chatOpen ? "bg-ink text-paper" : "bg-paper text-ink",
              )}
            >
              {pendingChats}
            </span>
          ) : null}
        </button>
      </nav>
      <div ref={accountRef} className="relative mt-auto border-t border-white/10 px-3 py-3">
        {accountOpen ? (
          <div role="menu" className="absolute right-3 bottom-full left-3 z-20 mb-2 rounded-2xl bg-paper p-2 text-ink shadow-lg">
            <Link href="/settings" role="menuitem" className="block rounded-xl px-3 py-2 text-sm font-semibold hover:bg-line">
              Settings
            </Link>
            <form action={signOut}>
              <button role="menuitem" className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-line" type="submit">
                Sign out
              </button>
            </form>
          </div>
        ) : null}
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-white/10"
          aria-expanded={accountOpen}
          aria-haspopup="menu"
          aria-label={`${name}, ${email}`}
          onClick={() => setAccountOpen((open) => !open)}
        >
          <UserIcon name={name} avatarUrl={avatarUrl} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold leading-tight">{name}</span>
            <span className="block truncate text-xs leading-tight text-paper/80">{email}</span>
            <span className="block truncate text-xs leading-tight text-paper/60">{roleLabel}</span>
          </span>
        </button>
      </div>
    </aside>
  );
}

function UserIcon({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper text-sm font-semibold text-ink">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
