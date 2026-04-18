"use client";

import React, { useEffect, useState } from "react";
import { X, RotateCcw, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDiagramStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";

interface ThemeVar {
  key: string;
  label: string;
  placeholder: string;
}

const THEME_GROUPS: { title: string; vars: ThemeVar[] }[] = [
  {
    title: "Core",
    vars: [
      { key: "primaryColor", label: "Primary", placeholder: "#eeeeee" },
      { key: "primaryTextColor", label: "Primary Text", placeholder: "#111111" },
      { key: "primaryBorderColor", label: "Primary Border", placeholder: "#999999" },
      { key: "secondaryColor", label: "Secondary", placeholder: "#c3c3c3" },
      { key: "secondaryTextColor", label: "Secondary Text", placeholder: "#333333" },
      { key: "secondaryBorderColor", label: "Secondary Border", placeholder: "#888888" },
      { key: "tertiaryColor", label: "Tertiary", placeholder: "#dddddd" },
      { key: "tertiaryTextColor", label: "Tertiary Text", placeholder: "#222222" },
      { key: "tertiaryBorderColor", label: "Tertiary Border", placeholder: "#777777" },
      { key: "background", label: "Background", placeholder: "#ffffff" },
      { key: "mainBkg", label: "Main Bkg", placeholder: "#eeeeee" },
      { key: "lineColor", label: "Line Color", placeholder: "#666666" },
      { key: "textColor", label: "Text Color", placeholder: "#333333" },
    ],
  },
  {
    title: "Flowchart",
    vars: [
      { key: "nodeBkg", label: "Node Background", placeholder: "#eeeeee" },
      { key: "nodeBorder", label: "Node Border", placeholder: "#999999" },
      { key: "clusterBkg", label: "Cluster Background", placeholder: "#c3c3c3" },
      { key: "clusterBorder", label: "Cluster Border", placeholder: "#707070" },
      { key: "edgeLabelBackground", label: "Edge Label Bkg", placeholder: "#ffffff" },
      { key: "titleColor", label: "Title Color", placeholder: "#333333" },
    ],
  },
  {
    title: "Sequence",
    vars: [
      { key: "actorBkg", label: "Actor Background", placeholder: "#eeeeee" },
      { key: "actorBorder", label: "Actor Border", placeholder: "#b5b5b5" },
      { key: "actorTextColor", label: "Actor Text", placeholder: "#333333" },
      { key: "actorLineColor", label: "Actor Line", placeholder: "#b5b5b5" },
      { key: "signalColor", label: "Signal Color", placeholder: "#333333" },
      { key: "signalTextColor", label: "Signal Text", placeholder: "#333333" },
      { key: "noteBkgColor", label: "Note Background", placeholder: "#666666" },
      { key: "noteBorderColor", label: "Note Border", placeholder: "#999999" },
      { key: "noteTextColor", label: "Note Text", placeholder: "#ffffff" },
      { key: "activationBkgColor", label: "Activation Bkg", placeholder: "#f4f4f4" },
      { key: "activationBorderColor", label: "Activation Border", placeholder: "#666666" },
    ],
  },
  {
    title: "Gantt",
    vars: [
      { key: "sectionBkgColor", label: "Section Bkg", placeholder: "#a3a3a3" },
      { key: "taskBkgColor", label: "Task Bkg", placeholder: "#707070" },
      { key: "taskBorderColor", label: "Task Border", placeholder: "#636363" },
      { key: "activeTaskBkgColor", label: "Active Task Bkg", placeholder: "#eeeeee" },
      { key: "doneTaskBkgColor", label: "Done Task Bkg", placeholder: "#bbbbbb" },
      { key: "critBkgColor", label: "Critical Bkg", placeholder: "#dd4422" },
      { key: "todayLineColor", label: "Today Line", placeholder: "#dd4422" },
    ],
  },
  {
    title: "C4 Context",
    vars: [
      { key: "personBkg", label: "Person Background", placeholder: "#eeeeee" },
      { key: "personBorder", label: "Person Border", placeholder: "#999999" },
    ],
  },
];

function ColorRow({
  varKey,
  label,
  placeholder,
  value,
  onChange,
  onClear,
}: {
  varKey: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
}) {
  const [textVal, setTextVal] = useState(value);

  useEffect(() => {
    setTextVal(value);
  }, [value]);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
      onChange(trimmed);
    } else {
      setTextVal(value);
    }
  };

  return (
    <div className="flex items-center gap-2 py-1">
      {/* Color swatch / picker */}
      <div className="relative h-6 w-6 shrink-0">
        <input
          type="color"
          value={value || placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer rounded border border-border opacity-0"
          title={`Pick color for ${label}`}
        />
        <div
          className="h-6 w-6 rounded border border-border"
          style={{
            backgroundColor: value || placeholder,
            opacity: value ? 1 : 0.35,
          }}
        />
      </div>

      {/* Label */}
      <span className={`flex-1 text-xs ${value ? "text-foreground" : "text-muted-foreground"}`}>
        {label}
      </span>

      {/* Hex text input */}
      <input
        type="text"
        value={textVal}
        placeholder={placeholder}
        onChange={(e) => setTextVal(e.target.value)}
        onBlur={() => commit(textVal)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(textVal);
          if (e.key === "Escape") setTextVal(value);
        }}
        className="h-6 w-[78px] rounded border border-border bg-background px-1.5 text-[11px] font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />

      {/* Clear button */}
      <button
        onClick={onClear}
        disabled={!value}
        className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        title="Clear override"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function ThemeCustomizer() {
  const { mermaidThemeVariables, setMermaidThemeVariable, clearMermaidThemeVariable, resetMermaidThemeVariables } =
    useDiagramStore(
      useShallow((s) => ({
        mermaidThemeVariables: s.mermaidThemeVariables,
        setMermaidThemeVariable: s.setMermaidThemeVariable,
        clearMermaidThemeVariable: s.clearMermaidThemeVariable,
        resetMermaidThemeVariables: s.resetMermaidThemeVariables,
      }))
    );

  const [activeSection, setActiveSection] = useState(0);
  const overrideCount = Object.keys(mermaidThemeVariables).length;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs">
          <Palette className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Colors</span>
          {overrideCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {overrideCount}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-base">Base Theme Colors</DialogTitle>
            {overrideCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={resetMermaidThemeVariables}
              >
                <RotateCcw className="h-3 w-3" />
                Reset all
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Section tabs */}
        <div className="flex gap-1 flex-wrap border-b border-border pb-2">
          {THEME_GROUPS.map((group, i) => {
            const groupOverrides = group.vars.filter((v) => mermaidThemeVariables[v.key]).length;
            return (
              <button
                key={group.title}
                onClick={() => setActiveSection(i)}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeSection === i
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {group.title}
                {groupOverrides > 0 && (
                  <span
                    className={`flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 text-[9px] font-bold ${
                      activeSection === i ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/15 text-primary"
                    }`}
                  >
                    {groupOverrides}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Color rows */}
        <div className="max-h-72 overflow-y-auto pr-1 space-y-0.5">
          {THEME_GROUPS[activeSection].vars.map((v) => (
            <ColorRow
              key={v.key}
              varKey={v.key}
              label={v.label}
              placeholder={v.placeholder}
              value={mermaidThemeVariables[v.key] || ""}
              onChange={(val) => setMermaidThemeVariable(v.key, val)}
              onClear={() => clearMermaidThemeVariable(v.key)}
            />
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground">
          Only overridden colors are applied. Dimmed swatches show the default value.
        </p>
      </DialogContent>
    </Dialog>
  );
}
