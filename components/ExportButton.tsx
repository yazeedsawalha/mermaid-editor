"use client";

import React, { useState } from "react";
import { Download, ImageIcon, FileCode, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDiagramStore } from "@/lib/store";

type ExportFormat = "svg" | "png";
type PaddingPreset = 0 | 16 | 32 | 64;
type BgColor = "white" | "transparent";

const PADDING_OPTIONS: { label: string; value: PaddingPreset; sub: string }[] = [
  { label: "None", value: 0, sub: "tight" },
  { label: "S", value: 16, sub: "16 px" },
  { label: "M", value: 32, sub: "32 px" },
  { label: "L", value: 64, sub: "64 px" },
];

const SCALE_OPTIONS = [
  { label: "1×", value: 1 },
  { label: "2×", value: 2 },
  { label: "4×", value: 4, badge: "HD" },
];

export function ExportButton() {
  const [open, setOpen] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [scale, setScale] = useState(2);
  const [padding, setPadding] = useState<PaddingPreset>(32);
  const [bg, setBg] = useState<BgColor>("white");

  const diagramName = useDiagramStore((s) => s.diagramName);
  const safeName = diagramName.replace(/\s+/g, "-").toLowerCase();

  const getSvgElement = (): SVGSVGElement | null =>
    document.querySelector(".mermaid-output svg") as SVGSVGElement | null;

  const showError = (msg: string) => {
    setExportError(msg);
    setTimeout(() => setExportError(null), 3000);
  };

  /** Build a padded SVG clone ready for serialization */
  const buildClone = (
    svg: SVGSVGElement,
    naturalW: number,
    naturalH: number,
    pad: number,
    outputW: number,
    outputH: number,
    includeBgRect: boolean,
  ): SVGSVGElement => {
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(outputW));
    clone.setAttribute("height", String(outputH));
    // Expand the viewBox by `pad` on every side so the diagram sits centred with whitespace
    clone.setAttribute("viewBox", `${-pad} ${-pad} ${naturalW + pad * 2} ${naturalH + pad * 2}`);

    if (includeBgRect) {
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", String(-pad));
      rect.setAttribute("y", String(-pad));
      rect.setAttribute("width", String(naturalW + pad * 2));
      rect.setAttribute("height", String(naturalH + pad * 2));
      rect.setAttribute("fill", "white");
      clone.insertBefore(rect, clone.firstChild);
    }

    return clone;
  };

  const doExport = () => {
    const svg = getSvgElement();
    if (!svg) {
      showError("Switch to Preview or Split view first.");
      return;
    }

    const vb = svg.viewBox?.baseVal;
    const naturalW = vb && vb.width > 0 ? vb.width : svg.getBBox().width || svg.clientWidth;
    const naturalH = vb && vb.height > 0 ? vb.height : svg.getBBox().height || svg.clientHeight;

    if (!naturalW || !naturalH) {
      showError("Diagram has no visible area to export.");
      return;
    }

    const serializer = new XMLSerializer();

    if (format === "svg") {
      const totalW = naturalW + padding * 2;
      const totalH = naturalH + padding * 2;
      const clone = buildClone(svg, naturalW, naturalH, padding, totalW, totalH, bg === "white");
      const svgStr = serializer.serializeToString(clone);
      const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setOpen(false);
      return;
    }

    // PNG path
    const totalW = naturalW + padding * 2;
    const totalH = naturalH + padding * 2;
    const w = Math.ceil(totalW * scale);
    const h = Math.ceil(totalH * scale);

    const clone = buildClone(svg, naturalW, naturalH, padding, w, h, false);
    const svgStr = serializer.serializeToString(clone);
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;

    const img = new Image();
    img.onerror = () => showError("Failed to render diagram as image.");
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      if (bg === "white") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) {
          showError("Failed to create PNG.");
          return;
        }
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `${safeName}@${scale}x.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(pngUrl);
      }, "image/png");
    };
    img.src = url;
    setOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen((o) => !o)}
      >
        <Download className="h-3.5 w-3.5" />
        Export
      </Button>

      {/* Error toast */}
      {exportError && (
        <div className="absolute right-0 top-full mt-1 z-50 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive whitespace-nowrap shadow-md">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {exportError}
        </div>
      )}

      {open && !exportError && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Options panel */}
          <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-border bg-popover shadow-xl p-4 flex flex-col gap-4">

            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Export</span>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Format */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Format
              </span>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                {(["svg", "png"] as ExportFormat[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-colors ${
                      format === f
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f === "svg" ? (
                      <FileCode className="h-3.5 w-3.5" />
                    ) : (
                      <ImageIcon className="h-3.5 w-3.5" />
                    )}
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution — PNG only */}
            {format === "png" && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Resolution
                </span>
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
                  {SCALE_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setScale(s.value)}
                      className={`flex items-center justify-center gap-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                        scale === s.value
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s.label}
                      {s.badge && (
                        <span className="text-[9px] font-bold text-primary">{s.badge}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Padding */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Padding
              </span>
              <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1">
                {PADDING_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPadding(p.value)}
                    className={`flex flex-col items-center rounded-md py-1.5 text-xs font-medium transition-colors ${
                      padding === p.value
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{p.label}</span>
                    <span className="text-[9px] opacity-60 leading-tight">{p.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Background */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Background
              </span>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                {(
                  [
                    { label: "White", value: "white" as BgColor },
                    { label: "Transparent", value: "transparent" as BgColor },
                  ] as const
                ).map((b) => (
                  <button
                    key={b.value}
                    onClick={() => setBg(b.value)}
                    className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
                      bg === b.value
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {b.value === "white" ? (
                      <span className="h-3 w-3 rounded-sm border border-border bg-white inline-block" />
                    ) : (
                      <span className="h-3 w-3 rounded-sm border border-border bg-[repeating-conic-gradient(#aaa_0%_25%,transparent_0%_50%)] bg-[length:6px_6px] inline-block" />
                    )}
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Export action */}
            <Button onClick={doExport} className="w-full gap-2" size="sm">
              <Download className="h-3.5 w-3.5" />
              Export {format.toUpperCase()}
              {format === "png" && ` · ${scale}×`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
