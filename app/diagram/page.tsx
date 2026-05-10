"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, AlertCircle, RotateCcw } from "lucide-react";

let mermaidInstance: typeof import("mermaid").default | null = null;
let renderCounter = 0;

async function getMermaid() {
  if (!mermaidInstance) {
    const m = await import("mermaid");
    mermaidInstance = m.default;
    mermaidInstance.registerIconPacks([
      {
        name: "logos",
        loader: () =>
          import("@iconify-json/logos").then((mod) => mod.icons),
      },
      {
        name: "mdi",
        loader: () => import("@iconify-json/mdi").then((mod) => mod.icons),
      },
      {
        name: "simple-icons",
        loader: () =>
          import("@iconify-json/simple-icons").then((mod) => mod.icons),
      },
    ]);
  }
  return mermaidInstance;
}

function MermaidRenderer({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);


  const render = useCallback(async () => {
    if (!containerRef.current || !code) return;
    const origConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      const msg = String(args[0] ?? "");
      if (
        msg.includes("mermaid") ||
        msg.includes("Syntax") ||
        msg.includes("Parse error")
      )
        return;
      origConsoleError(...args);
    };
    try {
      const mermaid = await getMermaid();
      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        securityLevel: "loose",
        logLevel: 5,
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        flowchart: { useMaxWidth: false, htmlLabels: true },
        sequence: { useMaxWidth: false },
      });
      await mermaid.parse(code);
      const id = `mermaid-diag-${++renderCounter}`;
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
        setError(null);
        setRendered(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.replace(/^Error:\s*/i, "").trim());
    } finally {
      console.error = origConsoleError;
    }
  }, [code]);

  useEffect(() => {
    if (code) render();
  }, [code, render]);

  return (
    <div className="relative w-full">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 mb-4">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
          <pre className="text-sm text-destructive font-mono whitespace-pre-wrap break-all">
            {error}
          </pre>
        </div>
      )}
      <div
        ref={containerRef}
        className={`flex justify-center p-4 ${!rendered && !error ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
      />
    </div>
  );
}

export default function DiagramPage() {
  const [text, setText] = useState("");
  const [mermaidCode, setMermaidCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    setMermaidCode("");

    try {
      const res = await fetch("/api/generate-diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to generate diagram.");
      }

      const data = await res.json();
      setMermaidCode(data.mermaidCode ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setText("");
    setMermaidCode("");
    setError(null);
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col gap-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Diagram Generator
          </h1>
          <p className="text-sm text-muted-foreground">
            Describe your diagram and AI will generate the Mermaid code for you.
          </p>
        </div>

        {/* Input area */}
        <div className="flex flex-col gap-3">
          <label
            htmlFor="diagram-text"
            className="text-sm font-medium text-foreground"
          >
            Description
          </label>
          <textarea
            id="diagram-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleGenerate();
              }
            }}
            placeholder="e.g. A user authentication flow where the user logs in, the server validates credentials, and returns a JWT token..."
            rows={6}
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Press{" "}
              <kbd className="rounded border border-border px-1 py-0.5 text-xs font-mono">
                ⌘ Enter
              </kbd>{" "}
              to generate
            </p>
            <div className="flex items-center gap-2">
              {(mermaidCode || error) && (
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Reset
                </Button>
              )}
              <Button
                onClick={handleGenerate}
                disabled={!text.trim() || loading}
                size="sm"
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {loading ? "Generating…" : "Generate"}
              </Button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Diagram preview */}
        {mermaidCode && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="border-b border-border px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Preview
                </span>
              </div>
              <div className="p-6 overflow-auto">
                <MermaidRenderer key={mermaidCode} code={mermaidCode} />
              </div>
            </div>

            {/* Code block */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="border-b border-border px-4 py-2.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Mermaid Code
                </span>
              </div>
              <pre className="p-4 text-xs font-mono text-foreground overflow-auto max-h-64 whitespace-pre-wrap break-all">
                {mermaidCode}
              </pre>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!mermaidCode && !loading && !error && (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="text-center space-y-2">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Your diagram will appear here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
