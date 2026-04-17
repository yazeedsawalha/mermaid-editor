"use client";

import dynamic from "next/dynamic";
import React, { useState } from "react";
import { Toolbar } from "@/components/Toolbar";
import { Sidebar } from "@/components/Sidebar";
import { ResizableSplit } from "@/components/ResizableSplit";
import { MermaidPreview } from "@/components/MermaidPreview";
import { ChatPanel } from "@/components/ChatPanel";
import { Code2, Eye, LayoutPanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Monaco must be loaded dynamically (no SSR)
const MonacoEditor = dynamic(
  () => import("@/components/MonacoEditor").then((m) => m.MonacoEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#1e1e1e]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs text-muted-foreground">Loading editor…</span>
        </div>
      </div>
    ),
  }
);

type ViewMode = "split" | "editor" | "preview";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Toolbar chatOpen={chatOpen} onChatToggle={() => setChatOpen((v) => !v)} />

      {/* View mode bar */}
      <div className="flex h-9 items-center gap-1 border-b border-border bg-background/95 px-3 shrink-0">
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/50 p-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("split")}
            className={cn(
              "h-6 gap-1.5 px-2.5 text-xs rounded-md transition-all",
              viewMode === "split"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutPanelLeft className="h-3 w-3" />
            Split
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("editor")}
            className={cn(
              "h-6 gap-1.5 px-2.5 text-xs rounded-md transition-all",
              viewMode === "editor"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Code2 className="h-3 w-3" />
            Editor
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("preview")}
            className={cn(
              "h-6 gap-1.5 px-2.5 text-xs rounded-md transition-all",
              viewMode === "preview"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="h-3 w-3" />
            Preview
          </Button>
        </div>

        <div className="flex-1" />

        <span className="text-xs text-muted-foreground/60 hidden md:block">
          Drag the divider to resize · Scroll to zoom preview
        </span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />

        {/* Editor + Preview */}
        <div className="flex flex-1 min-w-0 overflow-hidden">
          <div className="flex-1 min-w-0 overflow-hidden">
            {viewMode === "split" && (
              <ResizableSplit
                left={
                  <div className="flex h-full flex-col">
                    <div className="flex h-8 items-center gap-2 border-b border-border bg-muted/30 px-3 shrink-0">
                      <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Mermaid
                      </span>
                    </div>
                    <div className="flex-1 min-h-0">
                      <MonacoEditor />
                    </div>
                  </div>
                }
                right={
                  <div className="flex h-full flex-col">
                    <div className="flex h-8 items-center gap-2 border-b border-border bg-muted/30 px-3 shrink-0">
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Preview
                      </span>
                    </div>
                    <div className="flex-1 min-h-0 mermaid-preview-content">
                      <MermaidPreview />
                    </div>
                  </div>
                }
              />
            )}

            {viewMode === "editor" && (
              <div className="flex h-full flex-col">
                <div className="flex h-8 items-center gap-2 border-b border-border bg-muted/30 px-3 shrink-0">
                  <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Mermaid</span>
                </div>
                <div className="flex-1 min-h-0">
                  <MonacoEditor />
                </div>
              </div>
            )}

            {viewMode === "preview" && (
              <div className="flex h-full flex-col">
                <div className="flex h-8 items-center gap-2 border-b border-border bg-muted/30 px-3 shrink-0">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Preview</span>
                </div>
                <div className="flex-1 min-h-0 mermaid-preview-content">
                  <MermaidPreview />
                </div>
              </div>
            )}
          </div>

          {/* AI Chat Panel */}
          {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
        </div>
      </div>
    </div>
  );
}
