"use client";

import React from "react";
import { FileText, Trash2, FolderOpen } from "lucide-react";
import { useDiagramStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function SavedDiagramsPanel() {
  const { savedDiagrams, currentId, loadDiagram, deleteDiagram } = useDiagramStore(
    useShallow((s) => ({
      savedDiagrams: s.savedDiagrams,
      currentId: s.currentId,
      loadDiagram: s.loadDiagram,
      deleteDiagram: s.deleteDiagram,
    }))
  );

  if (savedDiagrams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
        <FolderOpen className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">No saved diagrams yet.</p>
        <p className="text-xs text-muted-foreground/60">
          Click Save to store your work.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Saved
        </p>
        {savedDiagrams.map((d) => (
          <div
            key={d.id}
            className={cn(
              "group flex items-center gap-2 rounded-md px-2.5 py-2 transition-colors cursor-pointer",
              currentId === d.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            )}
            onClick={() => loadDiagram(d.id)}
          >
            <FileText
              className={cn(
                "h-4 w-4 shrink-0",
                currentId === d.id ? "text-primary-foreground" : "text-muted-foreground"
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate leading-tight">
                {d.name}
              </div>
              <div
                className={cn(
                  "text-[11px] truncate mt-0.5",
                  currentId === d.id ? "text-primary-foreground/70" : "text-muted-foreground"
                )}
              >
                {new Date(d.updatedAt).toLocaleDateString()}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
                currentId === d.id
                  ? "hover:bg-primary-foreground/10 text-primary-foreground"
                  : "hover:bg-destructive/10 hover:text-destructive"
              )}
              onClick={(e) => {
                e.stopPropagation();
                deleteDiagram(d.id);
              }}
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
