"use client";
import { Participant } from "../../lib/types";
import { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemActions, ItemGroup } from "@/components/ui/item";

export default function ParticipantList({
  participants,
}: {
  participants: Participant[];
}) {
  return (
    <div className="space-y-2">
      {participants.length === 0 && (
        <div className="text-sm text-muted-foreground">No participants yet</div>
      )}

      <ItemGroup>
        {participants.map((p) => {
          return (
            <Item
              key={p.id}
              data-size="default"
              data-active="0"
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
