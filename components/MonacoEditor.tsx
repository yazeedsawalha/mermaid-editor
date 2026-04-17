"use client";

import React, { useCallback, useRef } from "react";
import Editor, { OnMount, OnChange } from "@monaco-editor/react";
import type * as MonacoType from "monaco-editor";
import { useDiagramStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";

const MERMAID_KEYWORDS = [
  "graph", "flowchart", "sequenceDiagram", "classDiagram", "stateDiagram-v2",
  "erDiagram", "gantt", "pie", "mindmap", "gitGraph", "C4Context",
  "TD", "LR", "TB", "RL", "BT",
  "participant", "actor", "Note", "loop", "alt", "else", "opt", "par",
  "activate", "deactivate", "autonumber",
  "subgraph", "end", "direction",
  "title", "dateFormat", "excludes", "section",
  "class", "interface", "enum", "abstract",
  "state", "choice",
  "commit", "branch", "checkout", "merge",
  "style", "classDef", "linkStyle",
  "click",
];

const MERMAID_COMPLETIONS = MERMAID_KEYWORDS.map((kw) => ({
  label: kw,
  kind: 14 as MonacoType.languages.CompletionItemKind, // Keyword
  insertText: kw,
  documentation: `Mermaid keyword: ${kw}`,
}));

export function MonacoEditor() {
  const { code, editorTheme, setCode } = useDiagramStore(
    useShallow((s) => ({
      code: s.code,
      editorTheme: s.editorTheme,
      setCode: s.setCode,
    }))
  );

  const editorRef = useRef<MonacoType.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof MonacoType | null>(null);
  // Track if language has been registered to avoid duplicate registration
  const langRegistered = useRef(false);

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Only register once (Monaco is a singleton — registering twice causes warnings)
    if (!langRegistered.current) {
      langRegistered.current = true;

      // Register Mermaid language
      monaco.languages.register({ id: "mermaid" });

      // Syntax highlighting tokens
      monaco.languages.setMonarchTokensProvider("mermaid", {
        keywords: MERMAID_KEYWORDS,
        tokenizer: {
          root: [
            [/%%.*$/, "comment"],
            [/---/, "keyword"],
            [/"[^"]*"/, "string"],
            [/'[^']*'/, "string"],
            [
              /\b(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram-v2|erDiagram|gantt|pie|mindmap|gitGraph|C4Context)\b/,
              "keyword.control",
            ],
            [/\b(TD|LR|TB|RL|BT)\b/, "keyword"],
            [
              /\b(subgraph|end|direction|title|participant|actor|Note|loop|alt|else|opt|par|activate|deactivate|autonumber)\b/,
              "keyword",
            ],
            [/\b(class|interface|enum|abstract|state|choice)\b/, "keyword"],
            [/\b(commit|branch|checkout|merge)\b/, "keyword"],
            [/\b(style|classDef|linkStyle|click)\b/, "keyword"],
            [/--?>|===>|-.->|--\|>|===|---|-->|==>/, "operator"],
            [/\[.*?\]/, "string"],
            [/\(.*?\)/, "string"],
            [/\{.*?\}/, "string"],
            [/[A-Z][a-zA-Z0-9_]*/, "type.identifier"],
            [/[a-zA-Z_]\w*/, "identifier"],
            [/[0-9]+/, "number"],
            [/[+\-*<>=#:|,]/, "delimiter"],
          ],
        },
      });

      // Completion provider
      monaco.languages.registerCompletionItemProvider("mermaid", {
        provideCompletionItems: (
          model: MonacoType.editor.ITextModel,
          position: MonacoType.Position
        ) => {
          const word = model.getWordUntilPosition(position);
          const range: MonacoType.IRange = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          return {
            suggestions: MERMAID_COMPLETIONS.map((c) => ({ ...c, range })),
          };
        },
      });
    }

    // Re-apply the language on the current model so the tokenizer activates
    // immediately — the editor was created before the language was registered,
    // so Monaco would have fallen back to plaintext without this step.
    const model = editor.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, "mermaid");
    }

    // Editor UX options
    editor.updateOptions({
      fontFamily: '"Fira Code", "Cascadia Code", Menlo, monospace',
      fontLigatures: true,
      fontSize: 14,
      lineHeight: 22,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: "on",
      padding: { top: 16, bottom: 16 },
      renderLineHighlight: "gutter",
      smoothScrolling: true,
      cursorBlinking: "phase",
      cursorSmoothCaretAnimation: "on",
      bracketPairColorization: { enabled: true },
      tabSize: 2,
    });
  }, []);

  const handleChange: OnChange = useCallback(
    (value) => {
      if (value !== undefined) setCode(value);
    },
    [setCode]
  );

  return (
    <Editor
      height="100%"
      language="mermaid"
      value={code}
      theme={editorTheme}
      onMount={handleEditorDidMount}
      onChange={handleChange}
      loading={
        <div className="flex h-full items-center justify-center bg-[#1e1e1e]">
          <div className="flex flex-col items-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
            <span className="text-xs text-neutral-400">Loading editor…</span>
          </div>
        </div>
      }
      options={{
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        padding: { top: 16 },
      }}
    />
  );
}
