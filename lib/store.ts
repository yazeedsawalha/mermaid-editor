import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TEMPLATES } from "./templates";

export type MermaidTheme = "default" | "neutral" | "dark" | "forest" | "base";

export interface SavedDiagram {
  id: string;
  name: string;
  code: string;
  createdAt: number;
  updatedAt: number;
}

interface DiagramStore {
  // Current editor state
  code: string;
  diagramName: string;
  currentId: string | null;

  // Saved diagrams
  savedDiagrams: SavedDiagram[];

  // UI state
  activeTemplateId: string | null;
  isSidebarOpen: boolean;
  isTemplatesPanelOpen: boolean;
  editorTheme: "vs-dark" | "light";
  mermaidTheme: MermaidTheme;
  mermaidThemeVariables: Record<string, string>;

  // Actions
  setCode: (code: string) => void;
  setDiagramName: (name: string) => void;
  saveDiagram: () => void;
  loadDiagram: (id: string) => void;
  deleteDiagram: (id: string) => void;
  newDiagram: () => void;
  loadTemplate: (templateId: string) => void;
  setActiveTemplateId: (id: string | null) => void;
  toggleSidebar: () => void;
  toggleTemplatesPanel: () => void;
  setEditorTheme: (theme: "vs-dark" | "light") => void;
  setMermaidTheme: (theme: MermaidTheme) => void;
  setMermaidThemeVariable: (key: string, value: string) => void;
  clearMermaidThemeVariable: (key: string) => void;
  resetMermaidThemeVariables: () => void;
}

const DEFAULT_CODE = TEMPLATES[0].code;

export const useDiagramStore = create<DiagramStore>()(
  persist(
    (set, get) => ({
      code: DEFAULT_CODE,
      diagramName: "Untitled Diagram",
      currentId: null,
      savedDiagrams: [],
      activeTemplateId: "flowchart",
      isSidebarOpen: true,
      isTemplatesPanelOpen: true,
      editorTheme: "vs-dark",
      mermaidTheme: "default",
      mermaidThemeVariables: {},

      setCode: (code) => set({ code, activeTemplateId: null }),

      setDiagramName: (diagramName) => set({ diagramName }),

      saveDiagram: () => {
        const { code, diagramName, currentId, savedDiagrams } = get();
        const now = Date.now();

        if (currentId) {
          set({
            savedDiagrams: savedDiagrams.map((d) =>
              d.id === currentId
                ? { ...d, code, name: diagramName, updatedAt: now }
                : d
            ),
          });
        } else {
          const newId = `diagram-${now}`;
          set({
            currentId: newId,
            savedDiagrams: [
              ...savedDiagrams,
              {
                id: newId,
                name: diagramName,
                code,
                createdAt: now,
                updatedAt: now,
              },
            ],
          });
        }
      },

      loadDiagram: (id) => {
        const { savedDiagrams } = get();
        const diagram = savedDiagrams.find((d) => d.id === id);
        if (diagram) {
          set({
            code: diagram.code,
            diagramName: diagram.name,
            currentId: id,
            activeTemplateId: null,
          });
        }
      },

      deleteDiagram: (id) => {
        const { savedDiagrams, currentId } = get();
        set({
          savedDiagrams: savedDiagrams.filter((d) => d.id !== id),
          ...(currentId === id
            ? { currentId: null, diagramName: "Untitled Diagram" }
            : {}),
        });
      },

      newDiagram: () => {
        set({
          code: DEFAULT_CODE,
          diagramName: "Untitled Diagram",
          currentId: null,
          activeTemplateId: "flowchart",
        });
      },

      loadTemplate: (templateId) => {
        const template = TEMPLATES.find((t) => t.id === templateId);
        if (template) {
          set({
            code: template.code,
            diagramName: template.name,
            currentId: null,
            activeTemplateId: templateId,
          });
        }
      },

      setActiveTemplateId: (id) => set({ activeTemplateId: id }),

      toggleSidebar: () =>
        set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),

      toggleTemplatesPanel: () =>
        set((s) => ({ isTemplatesPanelOpen: !s.isTemplatesPanelOpen })),

      setEditorTheme: (editorTheme) => set({ editorTheme }),

      setMermaidTheme: (mermaidTheme) => set({ mermaidTheme }),

      setMermaidThemeVariable: (key, value) =>
        set((s) => ({ mermaidThemeVariables: { ...s.mermaidThemeVariables, [key]: value } })),

      clearMermaidThemeVariable: (key) =>
        set((s) => {
          const next = { ...s.mermaidThemeVariables };
          delete next[key];
          return { mermaidThemeVariables: next };
        }),

      resetMermaidThemeVariables: () => set({ mermaidThemeVariables: {} }),
    }),
    {
      name: "mermaid-editor-storage",
      partialize: (state) => ({
        savedDiagrams: state.savedDiagrams,
        code: state.code,
        diagramName: state.diagramName,
        currentId: state.currentId,
        activeTemplateId: state.activeTemplateId,
        editorTheme: state.editorTheme,
        mermaidTheme: state.mermaidTheme,
        mermaidThemeVariables: state.mermaidThemeVariables,
      }),
    }
  )
);
