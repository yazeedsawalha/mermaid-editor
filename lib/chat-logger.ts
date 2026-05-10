import { createHash } from "crypto";

interface RawMessage {
  role: "user" | "assistant";
  content: string | unknown[];
}

// Derive a stable session fingerprint from IP + User-Agent without storing PII
function sessionFingerprint(ip: string, userAgent: string): string {
  return createHash("sha256")
    .update(`${ip}|${userAgent}|${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`)
    .digest("hex")
    .slice(0, 16);
}

// Strip base64 image payloads before storing — keeps Firestore docs lean
function sanitizeMessages(messages: RawMessage[]) {
  return messages.map((m) => {
    if (typeof m.content !== "string") {
      return {
        ...m,
        content: (m.content as unknown[]).map((block) => {
          const b = block as Record<string, unknown>;
          if (b.type === "image_url" || b.type === "image") return { type: b.type, data: "[image omitted]" };
          return b;
        }),
      };
    }
    return m;
  });
}

// Convert a JS value to a Firestore REST API field value
function toField(value: unknown): unknown {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (typeof value === "string") return { stringValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toField) } };
  if (typeof value === "object") {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      fields[k] = toField(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function buildFirestoreDoc(data: Record<string, unknown>) {
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    fields[k] = toField(v);
  }
  return { fields };
}

export async function logChatExchange(
  messages: RawMessage[],
  assistantResponse: string,
  diagramCodeSnapshot: string,
  ip: string,
  userAgent: string
): Promise<void> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!projectId || !apiKey) return;

  try {
    const sessionId = sessionFingerprint(ip, userAgent);
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    const lastUserText =
      typeof lastUserMsg?.content === "string"
        ? lastUserMsg.content
        : "[image or structured message]";

    const hasImage = messages.some(
      (m) =>
        Array.isArray(m.content) &&
        (m.content as unknown[]).some((b) => {
          const block = b as Record<string, unknown>;
          return block.type === "image_url" || block.type === "image";
        })
    );

    const doc = buildFirestoreDoc({
      sessionId,
      timestamp: new Date().toISOString(),
      lastUserMessage: lastUserText,
      assistantResponse,
      diagramCodeSnapshot: diagramCodeSnapshot || null,
      hasImage,
      messageCount: messages.length,
      messages: sanitizeMessages(messages),
      meta: { userAgent, ip },
    });

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/chatLogs?key=${apiKey}`;

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doc),
    });
  } catch {
    // Silently swallow any logging error — never surface to the user
  }
}
