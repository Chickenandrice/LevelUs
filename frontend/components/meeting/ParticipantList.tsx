"use client";
import React from "react";
import { Participant } from "../../lib/types";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemActions, ItemGroup } from "@/components/ui/item";

export default function ParticipantList({
  participants,
  onSelect,
  selectedId,
  onRemove,
}: {
  participants: Participant[];
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  onRemove?: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {participants.length === 0 && (
        <div className="text-sm text-muted-foreground">No participants yet</div>
      )}

      <ItemGroup>
        {participants.map((p) => {
          const active = selectedId === p.id;
          return (
            <Item
              key={p.id}
              data-size="default"
              data-active={active ? "1" : "0"}
              onClick={() => onSelect?.(p.id)}
            >
              <ItemMedia variant="icon">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm">{(p.name || "?")[0] ?? "?"}</div>
              </ItemMedia>

              <ItemContent>
                <ItemTitle>
                  {p.name ?? "(unnamed)"}
                </ItemTitle>
                <ItemDescription>
                  Spoke: {(p.totalSpeakingTime / 1000).toFixed(1)}s
                </ItemDescription>
              </ItemContent>
            </Item>
          );
        })}
      </ItemGroup>
    </div>
  );
}
