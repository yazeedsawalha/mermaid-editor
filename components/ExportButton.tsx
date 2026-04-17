"use client";

import React, { useState } from "react";
import { Download, ImageIcon, FileCode, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDiagramStore } from "@/lib/store";

export function ExportButton() {
  const [open, setOpen] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const diagramName = useDiagramStore((s) => s.diagramName);

  const safeName = diagramName.replace(/\s+/g, "-").toLowerCase();

  /** Find the rendered SVG anywhere in .mermaid-preview-content */
  const getSvgElement = (): SVGSVGElement | null =>
    document.querySelector(".mermaid-preview-content svg") as SVGSVGElement | null;

  const showError = (msg: string) => {
    setExportError(msg);
    setTimeout(() => setExportError(null), 3000);
  };

  const exportSVG = () => {
    const svg = getSvgElement();
    if (!svg) {
      showError("Switch to Preview or Split view first.");
      return;
    }

    // Inline all computed styles so the SVG is self-contained
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
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
  };

  const exportPNG = () => {
    const svg = getSvgElement();
    if (!svg) {
      showError("Switch to Preview or Split view first.");
      return;
    }

    const svgClone = svg.cloneNode(true) as SVGSVGElement;
    const bbox = svg.getBoundingClientRect();

    if (bbox.width === 0 || bbox.height === 0) {
      showError("Diagram has no visible area to export.");
      return;
    }

    const scale = 2; // 2× retina quality
    const w = Math.ceil(bbox.width * scale);
    const h = Math.ceil(bbox.height * scale);

    svgClone.setAttribute("width", String(w));
    svgClone.setAttribute("height", String(h));

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgClone);
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const img = new Image();

    img.onerror = () => {
      URL.revokeObjectURL(url);
      showError("Failed to render diagram as image.");
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      // Transparent background — SVG carries its own background color
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) {
          showError("Failed to create PNG blob.");
          return;
        }
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `${safeName}.png`;
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

      {/* Error feedback */}
      {exportError && (
        <div className="absolute right-0 top-full mt-1 z-50 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive whitespace-nowrap shadow-md">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {exportError}
        </div>
      )}

      {open && !exportError && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[148px] rounded-lg border border-border bg-popover shadow-md p-1">
            <button
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={exportSVG}
            >
              <FileCode className="h-4 w-4 text-muted-foreground" />
              Export SVG
            </button>
            <button
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={exportPNG}
            >
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              Export PNG
            </button>
          </div>
        </>
      )}
    </div>
  );
}
