"use client";
import React, { useState } from "react";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "./ui/alert-dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

export default function MeetingCreateDialog() {
  const [name, setName] = useState("");
  const router = useRouter();
  const [minSec, setMinSec] = useState<number | "">("");
  const [maxSec, setMaxSec] = useState<number | "">("");

  function create() {
    router.push("/meetings/demo");
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
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm">Min speaker time (s) — optional</label>
              <Input value={minSec} onChange={(e) => setMinSec(e.target.value === "" ? "" : Number(e.target.value))} type="number" className="mt-2" />
            </div>
            <div>
              <label className="text-sm">Max speaker time (s) — optional</label>
              <Input value={maxSec} onChange={(e) => setMaxSec(e.target.value === "" ? "" : Number(e.target.value))} type="number" className="mt-2" />
            </div>
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
