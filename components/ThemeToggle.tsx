"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDiagramStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { editorTheme, setEditorTheme } = useDiagramStore(
    useShallow((s) => ({
      editorTheme: s.editorTheme,
      setEditorTheme: s.setEditorTheme,
    }))
  );

  // On first mount, sync Monaco editor theme with the resolved system/saved theme.
  // This handles the case where the user's system prefers light but the store
  // defaulted to "vs-dark" (or vice versa after a page reload).
  useEffect(() => {
    if (!resolvedTheme) return;
    const correct = resolvedTheme === "dark" ? "vs-dark" : "light";
    if (editorTheme !== correct) {
      setEditorTheme(correct);
    }
    // Only run when resolvedTheme becomes available for the first time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTheme]);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setEditorTheme(next === "dark" ? "vs-dark" : "light");
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle} title="Toggle theme">
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
