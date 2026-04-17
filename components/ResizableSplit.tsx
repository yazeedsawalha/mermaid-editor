"use client";

import React, { useRef, useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface ResizableSplitProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultLeftPercent?: number;
  minLeftPercent?: number;
  maxLeftPercent?: number;
  className?: string;
}

export function ResizableSplit({
  left,
  right,
  defaultLeftPercent = 50,
  minLeftPercent = 20,
  maxLeftPercent = 80,
  className,
}: ResizableSplitProps) {
  const [leftPercent, setLeftPercent] = useState(defaultLeftPercent);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = (x / rect.width) * 100;
      setLeftPercent(
        Math.min(maxLeftPercent, Math.max(minLeftPercent, percent))
      );
    },
    [maxLeftPercent, minLeftPercent]
  );

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  React.useEffect(() => {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  return (
    <div ref={containerRef} className={cn("flex h-full overflow-hidden", className)}>
      {/* Left panel */}
      <div className="h-full min-w-0 overflow-hidden" style={{ width: `${leftPercent}%` }}>
        {left}
      </div>

      {/* Drag handle */}
      <div
        className="relative z-10 flex w-1 cursor-col-resize items-center justify-center bg-border hover:bg-primary/60 transition-colors group shrink-0"
        onMouseDown={onMouseDown}
      >
        <div className="absolute h-10 w-3 rounded-full bg-border group-hover:bg-primary/40 transition-colors flex items-center justify-center">
          <div className="flex flex-col gap-0.5">
            <div className="h-0.5 w-0.5 rounded-full bg-muted-foreground" />
            <div className="h-0.5 w-0.5 rounded-full bg-muted-foreground" />
            <div className="h-0.5 w-0.5 rounded-full bg-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="h-full min-w-0 overflow-hidden flex-1">
        {right}
      </div>
    </div>
  );
}
