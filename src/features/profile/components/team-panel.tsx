"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BusyLabel } from "@/components/ui/spinner";
import { StatusNote } from "@/components/ui/status-note";
import {
  cancelInvite,
  invitePerson,
  removePerson,
  savePersonLimits,
  type TeamPerson,
} from "@/features/profile/services/team-actions";
import { formatDollars } from "@/lib/money";

export function TeamPanel({
  people,
  invites,
  warning,
}: {
  people: TeamPerson[];
  invites: string[];
  warning: string | null;
}) {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(warning);
  const [ok, setOk] = useState(warning ? false : true);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; message: string }>) {
    setNotice(null);
    startTransition(async () => {
      const result = await action();
      setOk(result.ok);
      setNotice(result.message);
    });
  }

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-card p-5">
      <h2 className="font-sans font-semibold tracking-tight text-2xl">People</h2>
      <p className="text-sm text-muted">Invite a Gmail address. Dots and a plus tag count as the same person.</p>
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          run(async () => invitePerson(email));
        }}
      >
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-label="Gmail address to invite"
          placeholder="name@gmail.com"
          className="min-w-[16rem] flex-1"
        />
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? <BusyLabel>Sending the invite.</BusyLabel> : "Invite"}
        </Button>
      </form>
      {invites.length > 0 ? (
        <ul className="space-y-2">
          {invites.map((invite) => (
            <li key={invite} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>{invite} is waiting</span>
              <Button type="button" variant="ghost" disabled={pending} onClick={() => run(async () => cancelInvite(invite))}>
                Cancel invite
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <ul className="space-y-4">
        {people.map((person) => (
          <PersonRow key={person.id} person={person} pending={pending} onRun={run} />
        ))}
      </ul>
      {notice ? <StatusNote tone={ok ? "ok" : "bad"}>{notice}</StatusNote> : null}
    </section>
  );
}

function PersonRow({
  person,
  pending,
  onRun,
}: {
  person: TeamPerson;
  pending: boolean;
  onRun: (action: () => Promise<{ ok: boolean; message: string }>) => void;
}) {
  const [role, setRole] = useState(person.role);
  const [canAsk, setCanAsk] = useState(person.canAsk);
  const [canPropose, setCanPropose] = useState(person.canPropose);
  const [canApprove, setCanApprove] = useState(person.canApprove);
  const [canSync, setCanSync] = useState(person.canSync);
  const [cap, setCap] = useState((person.approveCapCents / 100).toFixed(2));

  return (
    <li className="space-y-3 rounded-xl border border-line p-3">
      <div>
        <p className="font-semibold">{person.name}</p>
        <p className="text-sm text-muted">{person.email}</p>
        {person.duplicate ? <p className="text-sm text-muted">This email is already used by another person.</p> : null}
      </div>
      <label className="block text-sm">
        Role
        <select
          className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2"
          value={role}
          onChange={(event) => setRole(event.target.value === "admin" ? "admin" : "team")}
        >
          <option value="admin">Admin</option>
          <option value="team">Team</option>
        </select>
      </label>
      {role === "team" ? (
        <div className="space-y-2 text-sm">
          <Check label="Can ask" checked={canAsk} onChange={setCanAsk} />
          <Check label="Can suggest changes" checked={canPropose} onChange={setCanPropose} />
          <Check label="Can approve" checked={canApprove} onChange={setCanApprove} />
          <Check label="Can change the sheet" checked={canSync} onChange={setCanSync} />
          <label className="block">
            Budget cap, mark after the number
            <Input
              className="mt-1"
              inputMode="decimal"
              value={cap}
              aria-label={`Budget cap for ${person.name}`}
              onChange={(event) => setCap(event.target.value)}
            />
            <span className="mt-1 block text-muted">Now {formatDollars(person.approveCapCents)}</span>
          </label>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() =>
            onRun(async () =>
              savePersonLimits({
                personId: person.id,
                role,
                canAsk,
                canPropose,
                canApprove,
                canSync,
                approveCapCents: Math.round(Number(cap) * 100),
              }),
            )
          }
        >
          Save limits
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={() => onRun(async () => removePerson(person.id))}>
          Remove
        </Button>
      </div>
    </li>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
