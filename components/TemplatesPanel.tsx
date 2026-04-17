"use client";

import React from "react";
import {
  GitBranch, ArrowLeftRight, Box, Database, BarChart2,
  Workflow, PieChart, Network, GitMerge, Layers,
} from "lucide-react";
import { TEMPLATES } from "@/lib/templates";
import { useDiagramStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const ICON_MAP: Record<string, React.ElementType> = {
  GitBranch,
  ArrowLeftRight,
  Box,
  Database,
  BarChart2,
  Workflow,
  PieChart,
  Network,
  GitMerge,
  Layers,
};

export function TemplatesPanel() {
  const { activeTemplateId, loadTemplate } = useDiagramStore(
    useShallow((s) => ({
      activeTemplateId: s.activeTemplateId,
      loadTemplate: s.loadTemplate,
    }))
  );

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Templates
        </p>
        {TEMPLATES.map((tpl) => {
          const Icon = ICON_MAP[tpl.icon] || GitBranch;
          const isActive = activeTemplateId === tpl.id;

          return (
            <button
              key={tpl.id}
              onClick={() => loadTemplate(tpl.id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors group",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-accent-foreground"
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate leading-tight">{tpl.name}</div>
                <div
                  className={cn(
                    "text-[11px] truncate leading-tight mt-0.5",
                    isActive
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  )}
                >
                  {tpl.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
