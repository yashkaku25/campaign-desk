"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { BusyLabel } from "@/components/ui/spinner";
import { importScreenshot } from "@/features/ingestion/services/sync-sheet";

export function PhotoButton({
  onResult,
}: {
  onResult: (result: { ok: boolean; message: string; openChat?: boolean }) => void;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        disabled={reading}
        aria-busy={reading}
        aria-label="Upload a picture of campaign numbers"
        onClick={() => fileRef.current?.click()}
      >
        {reading ? <BusyLabel>Reading the picture.</BusyLabel> : "Photo"}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file || reading) return;
          setReading(true);
          const reader = new FileReader();
          const fail = () => {
            setReading(false);
            onResult({ ok: false, message: "That picture could not be read. Try another one." });
          };
          reader.onerror = fail;
          reader.onload = () => {
            const data = typeof reader.result === "string" ? reader.result : "";
            const base64 = data.split(",")[1] ?? "";
            if (!base64) {
              fail();
              return;
            }
            startTransition(async () => {
              const result = await importScreenshot(base64, file.type);
              setReading(false);
              onResult(result);
              if (result.openChat) window.dispatchEvent(new Event("desk-open"));
              if (result.ok) router.refresh();
            });
          };
          reader.readAsDataURL(file);
        }}
      />
    </>
  );
}
