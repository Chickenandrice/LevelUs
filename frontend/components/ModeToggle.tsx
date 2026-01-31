"use client";
import React from "react";
import { Button } from "./ui/button";
import { UserPlus, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ModeToggle({ mode, setMode }: { mode: "intro" | "discussion"; setMode: (m: "intro" | "discussion") => void; }) {
  return (
    <div className="inline-flex items-center rounded-md bg-muted p-1 gap-1">
      <button
        onClick={() => setMode("intro")}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 rounded-md transition-all",
          mode === "intro" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
        )}
        aria-pressed={mode === "intro"}
      >
        <UserPlus className="size-4" />
        <span className="text-sm">Intro</span>
      </button>

      <button
        onClick={() => setMode("discussion")}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 rounded-md transition-all",
          mode === "discussion" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
        )}
        aria-pressed={mode === "discussion"}
      >
        <MessageSquare className="size-4" />
        <span className="text-sm">Discussion</span>
      </button>
    </div>
  );
}
