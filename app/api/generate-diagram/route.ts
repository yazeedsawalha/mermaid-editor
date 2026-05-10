import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert Mermaid diagram generator. 
Given a text description, generate a single, clean, valid Mermaid diagram that best represents the content.

Rules:
- Respond with ONLY the mermaid code block — no explanation, no commentary, no extra text.
- Format: \`\`\`mermaid\\n...code...\\n\`\`\`
- Pick the most appropriate diagram type (flowchart, sequence, class, ER, etc.) for the description.
- Keep the diagram readable and well-structured.
- Use proper Mermaid v11 syntax.`;

// Convert a JS value to a Firestore REST API field value
function toField(value: unknown): unknown {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number")
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  if (typeof value === "string") return { stringValue: value };
  if (Array.isArray(value))
    return { arrayValue: { values: value.map(toField) } };
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

async function saveTextToFirebase(text: string): Promise<void> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const apiKey = process.env.FIREBASE_API_KEY;

  if (!projectId || !apiKey) return;

  try {
    const doc = buildFirestoreDoc({
      text,
      createdAt: new Date().toISOString(),
    });

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/text?key=${apiKey}`;

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doc),
    });
  } catch {
    // Silently swallow — never block the user
  }
}

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }

  // Save to Firebase (fire-and-forget, don't block the response)
  saveTextToFirebase(text.trim());

  const message = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: text.trim() }],
  });

  const raw =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Extract mermaid code from the code block
  const match = raw.match(/```mermaid\n([\s\S]*?)```/);
  const mermaidCode = match ? match[1].trim() : raw.trim();

  return NextResponse.json({ mermaidCode });
}
