"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Copy, Check, Sparkles, X, Undo2, ImagePlus, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDiagramStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string; // base64 data URL
}

interface ChatPanelProps {
  onClose: () => void;
}

function extractMermaidCode(text: string): string | null {
  const match = text.match(/```mermaid\n([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

function MessageBubble({
  message,
  onApply,
  autoApply,
}: {
  message: Message;
  onApply: (code: string) => void;
  autoApply: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [imgExpanded, setImgExpanded] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const renderContent = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith("```mermaid")) {
        const code = part.replace(/^```mermaid\n/, "").replace(/```$/, "");
        return (
          <div key={i} className="mt-2 rounded-lg overflow-hidden border border-border">
            <div className="flex items-center justify-between bg-muted/60 px-3 py-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">mermaid</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[11px] gap-1"
                  onClick={() => handleCopy(code)}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  Copy
                </Button>
                {!autoApply && (
                  <Button
                    variant="default"
                    size="sm"
                    className="h-6 px-2 text-[11px] gap-1"
                    onClick={() => onApply(code)}
                  >
                    <Sparkles className="h-3 w-3" />
                    Apply
                  </Button>
                )}
              </div>
            </div>
            <pre className="bg-muted/30 px-3 py-2 text-xs overflow-x-auto font-mono leading-relaxed">
              {code}
            </pre>
          </div>
        );
      } else if (part.startsWith("```")) {
        const lines = part.split("\n");
        const lang = lines[0].replace("```", "") || "code";
        const code = lines.slice(1, -1).join("\n");
        return (
          <div key={i} className="mt-2 rounded-lg overflow-hidden border border-border">
            <div className="bg-muted/60 px-3 py-1 text-[11px] text-muted-foreground">{lang}</div>
            <pre className="bg-muted/30 px-3 py-2 text-xs overflow-x-auto font-mono">{code}</pre>
          </div>
        );
      }
      return (
        <span key={i} className="whitespace-pre-wrap">
          {part}
        </span>
      );
    });
  };

  return (
    <div
      className={cn(
        "flex gap-2.5 px-4 py-3",
        message.role === "user" ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted border border-border"
        )}
      >
        {message.role === "user" ? (
          <User className="h-3.5 w-3.5" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>

      <div
        className={cn(
          "max-w-[85%] rounded-xl px-3 py-2 text-sm",
          message.role === "user"
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted/50 border border-border rounded-tl-sm"
        )}
      >
        {message.image && (
          <div className="mb-2">
            <img
              src={message.image}
              alt="uploaded diagram"
              onClick={() => setImgExpanded((v) => !v)}
              className={cn(
                "rounded-lg cursor-pointer border border-white/20 object-cover transition-all",
                imgExpanded ? "max-h-96 w-full" : "max-h-24 max-w-[180px]"
              )}
            />
          </div>
        )}
        {renderContent(message.content)}
      </div>
    </div>
  );
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const { code, setCode } = useDiagramStore(
    useShallow((s) => ({ code: s.code, setCode: s.setCode }))
  );

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I can help you create and edit Mermaid diagrams.\n\nYou can:\n- Describe a diagram and I'll generate it\n- Edit the current diagram with instructions\n- **Upload a diagram image** — I'll analyze it deeply, then convert it to any Mermaid type you ask for",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [autoApply, setAutoApply] = useState(true);
  const [codeHistory, setCodeHistory] = useState<string[]>([]);
  const [attachedImage, setAttachedImage] = useState<string | null>(null); // base64 data URL
  const [contextImage, setContextImage] = useState<string | null>(null); // image the AI has already analyzed
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleApply = (mermaidCode: string) => {
    setCodeHistory((prev) => [...prev, code]);
    setCode(mermaidCode);
  };

  const handleRevert = () => {
    if (codeHistory.length === 0) return;
    const prev = codeHistory[codeHistory.length - 1];
    setCodeHistory((h) => h.slice(0, -1));
    setCode(prev);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachedImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    // reset so same file can be re-selected
    e.target.value = "";
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if ((!trimmed && !attachedImage) || isLoading) return;

    const imageToSend = attachedImage;
    const userMessage: Message = {
      role: "user",
      content: trimmed || (imageToSend ? "Please analyze this diagram." : ""),
      ...(imageToSend ? { image: imageToSend } : {}),
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setAttachedImage(null);
    // Mark this image as "in context" so follow-up messages remember it
    if (imageToSend) setContextImage(imageToSend);
    setIsLoading(true);
    setStreamingContent("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Snapshot current code before the AI responds (for revert)
    const codeSnapshot = code;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) =>
            m.image
              ? {
                  role: m.role,
                  content: [
                    { type: "text", text: m.content },
                    { type: "image_url", image_url: { url: m.image } },
                  ],
                }
              : { role: m.role, content: m.content }
          ),
          currentCode: code,
        }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          setStreamingContent(fullContent);
        }
      }

      setMessages((prev) => [...prev, { role: "assistant", content: fullContent }]);
      setStreamingContent("");

      // Auto-apply if enabled and response contains Mermaid code
      if (autoApply) {
        const extracted = extractMermaidCode(fullContent);
        if (extracted) {
          setCodeHistory((prev) => [...prev, codeSnapshot]);
          setCode(extracted);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
      setStreamingContent("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  return (
    <div className="flex h-full w-[320px] shrink-0 flex-col border-l border-border bg-background">
      {/* Header */}
      <div className="flex h-10 items-center justify-between border-b border-border px-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold">AI Assistant</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Auto-apply toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none" title="Auto-apply generated code to editor">
            <span className="text-[11px] text-muted-foreground">Auto-apply</span>
            <div
              onClick={() => setAutoApply((v) => !v)}
              className={cn(
                "relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors",
                autoApply ? "bg-primary" : "bg-muted-foreground/30"
              )}
            >
              <span
                className={cn(
                  "inline-block h-3 w-3 rounded-full bg-white shadow transition-transform",
                  autoApply ? "translate-x-3.5" : "translate-x-0.5"
                )}
              />
            </div>
          </label>

          {/* Revert button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-[11px]"
            onClick={handleRevert}
            disabled={codeHistory.length === 0}
            title="Revert to previous code"
          >
            <Undo2 className="h-3 w-3" />
            Revert
          </Button>

          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Context image banner */}
      {contextImage && (
        <div className="flex items-center gap-2 border-b border-border bg-primary/5 px-3 py-1.5 shrink-0">
          <ScanSearch className="h-3.5 w-3.5 text-primary shrink-0" />
          <img
            src={contextImage}
            alt="context"
            className="h-6 w-8 rounded object-cover border border-border shrink-0"
          />
          <span className="flex-1 text-[11px] text-muted-foreground leading-tight">
            Image in context — ask me to convert it to any diagram
          </span>
          <button
            onClick={() => setContextImage(null)}
            className="text-muted-foreground hover:text-foreground"
            title="Clear image context"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 py-2">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} onApply={handleApply} autoApply={autoApply} />
        ))}

        {streamingContent && (
          <MessageBubble
            message={{ role: "assistant", content: streamingContent }}
            onApply={handleApply}
            autoApply={autoApply}
          />
        )}

        {isLoading && !streamingContent && (
          <div className="flex gap-2.5 px-4 py-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted border border-border">
              <Bot className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-muted/50 border border-border rounded-tl-sm px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 shrink-0">
        {/* Image preview */}
        {attachedImage && (
          <div className="mb-2 relative inline-block">
            <img
              src={attachedImage}
              alt="attached"
              className="h-16 rounded-lg border border-border object-cover"
            />
            <button
              onClick={() => setAttachedImage(null)}
              className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 focus-within:border-primary/50 transition-colors">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            title="Attach diagram image"
          >
            <ImagePlus className="h-3.5 w-3.5" />
          </Button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={attachedImage ? "Ask AI about this image…" : "Describe your diagram…"}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground min-h-[20px] max-h-[120px] leading-5"
            disabled={isLoading}
          />
          <Button
            size="icon"
            className="h-7 w-7 shrink-0 rounded-lg"
            onClick={handleSend}
            disabled={(!input.trim() && !attachedImage) || isLoading}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground/60 text-center">
          Enter to send · Shift+Enter for newline · 📎 attach image
        </p>
      </div>
    </div>
  );
}
