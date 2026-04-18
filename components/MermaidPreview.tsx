"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDiagramStore } from "@/lib/store";
import { AlertCircle, ZoomIn, ZoomOut, Maximize2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

let mermaidInstance: typeof import("mermaid").default | null = null;

async function getMermaid() {
  if (!mermaidInstance) {
    const m = await import("mermaid");
    mermaidInstance = m.default;

    // Register icon packs (lazy-loaded so they don't block initial render)
    mermaidInstance.registerIconPacks([
      {
        name: "logos",
        loader: () => import("@iconify-json/logos").then((mod) => mod.icons),
      },
      {
        name: "mdi",
        loader: () => import("@iconify-json/mdi").then((mod) => mod.icons),
      },
      {
        name: "simple-icons",
        loader: () => import("@iconify-json/simple-icons").then((mod) => mod.icons),
      },
    ]);
  }
  return mermaidInstance;
}

let renderCounter = 0;

export function MermaidPreview() {
  const code = useDiagramStore((s) => s.code);
  const mermaidTheme = useDiagramStore((s) => s.mermaidTheme);
  const mermaidThemeVariables = useDiagramStore((s) => s.mermaidThemeVariables);

  // containerRef div is ALWAYS in the DOM — never conditionally mounted.
  // This is critical: if it unmounts on error, future renders silently fail
  // because containerRef.current becomes null.
  const containerRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const render = useCallback(async () => {
    if (!containerRef.current) return;

    setIsRendering(true);

    // Suppress Mermaid's own console.error output so it doesn't trigger
    // the Next.js dev error overlay.
    const origConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      const msg = String(args[0] ?? "");
      if (msg.includes("mermaid") || msg.includes("Syntax") || msg.includes("Parse error")) return;
      origConsoleError(...args);
    };

    try {
      const mermaid = await getMermaid();

      mermaid.initialize({
        startOnLoad: false,
        theme: mermaidTheme,
        ...(mermaidTheme === "base" && Object.keys(mermaidThemeVariables).length > 0
          ? { themeVariables: mermaidThemeVariables }
          : {}),
        securityLevel: "loose",
        logLevel: 5, // suppress mermaid internal logs
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        flowchart: { useMaxWidth: false, htmlLabels: true },
        sequence: { useMaxWidth: false },
        gantt: { useMaxWidth: false },
      });

      // Validate syntax first — parse throws on invalid code
      await mermaid.parse(code);

      const id = `mermaid-${++renderCounter}`;
      const { svg } = await mermaid.render(id, code);

      if (containerRef.current) {
        containerRef.current.innerHTML = svg;

        const svgEl = containerRef.current.querySelector("svg");
        if (svgEl) {
          svgEl.style.maxWidth = "100%";
          svgEl.style.height = "auto";
          svgEl.removeAttribute("height");
          svgEl.style.borderRadius = "8px";
        }
        // Only clear error AFTER successful render
        setError(null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.replace(/^Error:\s*/i, "").trim());
    } finally {
      console.error = origConsoleError;
      setIsRendering(false);
    }
  }, [code, mermaidTheme, mermaidThemeVariables]);

  useEffect(() => {
    const timer = setTimeout(render, 300);
    return () => clearTimeout(timer);
  }, [render]);

  // Mouse wheel zoom
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.min(3, Math.max(0.2, +(z + delta).toFixed(2))));
  }, []);

  // Pan handlers
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = { ...pan };
    },
    [pan]
  );

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setPan({
      x: panStart.current.x + (e.clientX - dragStart.current.x),
      y: panStart.current.y + (e.clientY - dragStart.current.y),
    });
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const zoomIn = () =>
    setZoom((z) => Math.min(3, +(z + 0.15).toFixed(2)));
  const zoomOut = () =>
    setZoom((z) => Math.max(0.2, +(z - 0.15).toFixed(2)));

  return (
    // Use hsl() wrapper so the CSS variable (which is raw HSL numbers) is valid
    <div className="relative flex flex-col h-full overflow-hidden bg-[hsl(var(--preview-bg))]">
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-lg border border-border bg-background/80 backdrop-blur-sm px-1 py-1 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={zoomOut}
          title="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs font-mono text-muted-foreground min-w-[3rem] text-center select-none">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={zoomIn}
          title="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-4 bg-border mx-0.5" />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={resetView}
          title="Reset view"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="Fit to screen"
          onClick={() => {
            setZoom(0.85);
            setPan({ x: 0, y: 0 });
          }}
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Rendering indicator */}
      {isRendering && (
        <div className="absolute top-3 left-3 z-10">
          <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
        </div>
      )}

      {/* Error banner — compact strip at the bottom, doesn't hide the diagram */}
      {error && (
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-start gap-2 border-t border-destructive/30 bg-destructive/8 px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive mt-0.5" />
          <pre className="flex-1 text-[11px] text-destructive font-mono whitespace-pre-wrap break-all leading-relaxed max-h-20 overflow-y-auto">
            {error}
          </pre>
        </div>
      )}

      {/* Diagram area — ALWAYS rendered so containerRef stays mounted */}
      <div
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ userSelect: "none" }}
        >
          <div
            ref={containerRef}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
              transition: "transform 0.08s ease",
            }}
            className="p-8 mermaid-output"
          />
        </div>
      </div>
    </div>
  );
}
