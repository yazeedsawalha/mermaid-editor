"use client";

import React, { useState } from "react";
import { Save, FilePlus, Pencil, Check, GitBranch, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ExportButton } from "@/components/ExportButton";
import { useDiagramStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  chatOpen: boolean;
  onChatToggle: () => void;
}

export function Toolbar({ chatOpen, onChatToggle }: ToolbarProps) {
  const { diagramName, currentId, setDiagramName, saveDiagram, newDiagram } =
    useDiagramStore(
      useShallow((s) => ({
        diagramName: s.diagramName,
        currentId: s.currentId,
        setDiagramName: s.setDiagramName,
        saveDiagram: s.saveDiagram,
        newDiagram: s.newDiagram,
      }))
    );

  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(diagramName);
  const [saved, setSaved] = useState(false);

  const startEditing = () => {
    setTempName(diagramName);
    setEditingName(true);
  };

  const commitName = () => {
    const trimmed = tempName.trim();
    if (trimmed) setDiagramName(trimmed);
    setEditingName(false);
  };

  const handleSave = () => {
    saveDiagram();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <header className="flex h-12 items-center gap-2 border-b border-border bg-background/95 backdrop-blur-sm px-4 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <GitBranch className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sm hidden sm:block">
          Mermaid Editor
        </span>
      </div>

      <div className="h-4 w-px bg-border hidden sm:block" />

      {/* Diagram name */}
      <div className="flex items-center gap-1 min-w-0">
        {editingName ? (
          <div className="flex items-center gap-1">
            <Input
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitName();
                if (e.key === "Escape") setEditingName(false);
              }}
              onBlur={commitName}
              autoFocus
              className="h-7 text-sm w-[180px]"
            />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={commitName}>
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <button
            className="flex items-center gap-1.5 group px-2 py-1 rounded-md hover:bg-accent transition-colors"
            onClick={startEditing}
            title="Rename diagram"
          >
            <span className="text-sm font-medium text-foreground truncate max-w-[160px]">
              {diagramName}
            </span>
            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </button>
        )}
      </div>

      {currentId && (
        <span className="hidden sm:inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground font-mono">
          saved
        </span>
      )}

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 hidden sm:flex"
          onClick={newDiagram}
          title="New diagram"
        >
          <FilePlus className="h-3.5 w-3.5" />
          New
        </Button>

        <Button
          variant={saved ? "secondary" : "outline"}
          size="sm"
          className={cn("gap-1.5 transition-all", saved && "text-green-600 dark:text-green-400")}
          onClick={handleSave}
        >
          {saved ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              Save
            </>
          )}
        </Button>

        <ExportButton />

        <div className="h-4 w-px bg-border" />

        <Button
          variant={chatOpen ? "default" : "ghost"}
          size="sm"
          className="gap-1.5"
          onClick={onChatToggle}
          title="AI Assistant"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">AI</span>
        </Button>

        <div className="h-4 w-px bg-border" />
        <ThemeToggle />
      </div>
    </header>
  );
}
