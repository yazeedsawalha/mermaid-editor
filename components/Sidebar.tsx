"use client";

import React, { useState } from "react";
import { LayoutTemplate, FolderOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { TemplatesPanel } from "@/components/TemplatesPanel";
import { SavedDiagramsPanel } from "@/components/SavedDiagramsPanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tab = "templates" | "saved";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>("templates");

  return (
    // Outer wrapper: relative, NOT overflow-hidden, so the toggle button
    // is never clipped regardless of the sidebar open/closed state.
    <div className="relative flex shrink-0">
      {/* Inner panel — this one gets overflow-hidden when closed */}
      <div
        className={cn(
          "flex flex-col border-r border-border bg-background transition-all duration-200 overflow-hidden",
          isOpen ? "w-[220px]" : "w-0 border-r-0"
        )}
      >
        {/* Tab header */}
        <div className="flex items-center gap-0.5 border-b border-border px-2 py-1.5 shrink-0">
          <button
            onClick={() => setActiveTab("templates")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              activeTab === "templates"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            <LayoutTemplate className="h-3.5 w-3.5" />
            Templates
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              activeTab === "saved"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Saved
          </button>
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-hidden min-h-0">
          {activeTab === "templates" ? (
            <TemplatesPanel />
          ) : (
            <SavedDiagramsPanel />
          )}
        </div>
      </div>

      {/* Toggle button — lives in the outer wrapper (no overflow-hidden),
          so it is ALWAYS visible and clickable. */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute -right-3.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full border border-border bg-background shadow-sm z-20"
        title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isOpen ? (
          <ChevronLeft className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}
