"use client";
import React, { useState } from "react";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "./ui/alert-dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

export default function MeetingCreateDialog() {
  const [name, setName] = useState("");
  const DISABLE_API = process.env.NEXT_PUBLIC_DISABLE_API === "1";
  const [live, setLive] = useState(!DISABLE_API);
  const router = useRouter();

  function create() {
    const id = String(Date.now());
    const target = live ? `/meeting/${id}?live=1` : `/meeting/${id}`;
    router.push(target);
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button size="lg" variant="outline">Start Real Meeting</Button>}>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create Meeting</AlertDialogTitle>
          <AlertDialogDescription>Give your meeting a name and choose live mode.</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="mt-4">
          <label className="text-sm">Meeting name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-2" />
          <div className="mt-3 flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} disabled={DISABLE_API} />
              <span className="ml-1">Enable backend integration (live)</span>
            </label>
            {DISABLE_API && (
              <div className="text-xs text-muted-foreground">Backend calls are disabled (NEXT_PUBLIC_DISABLE_API=1). Live mode will not send requests.</div>
            )}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={create} disabled={!name.trim()}>Create</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
