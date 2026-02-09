/**
 * POST /api/voice-chat
 *
 * Browser-based voice agent backend. Replaces the LiveKit Python agent
 * with a direct Gemini API call that supports function calling for
 * filing grievances, checking status, and looking up legal rights.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  SchemaType,
  type Content,
  type FunctionDeclaration,
} from "@google/generative-ai";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// ---------------------------------------------------------------------------
// Gemini tool declarations (mirrors the Python agent's tools)
// ---------------------------------------------------------------------------

const functionDeclarations: FunctionDeclaration[] = [
  {
    name: "file_grievance",
    description:
      "File a new civic grievance complaint. Use when you have the citizen's description, location, and phone number.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        phone: {
          type: SchemaType.STRING,
          description: "10-digit Indian mobile number",
        },
        description: {
          type: SchemaType.STRING,
          description: "Description of the civic problem",
        },
        location_text: {
          type: SchemaType.STRING,
          description: "Location: area, colony, landmark, or ward",
        },
        name: {
          type: SchemaType.STRING,
          description: "Citizen name (optional)",
        },
        language: {
          type: SchemaType.STRING,
          description: 'Language: "hi" or "en". Defaults to "hi".',
        },
      },
      required: ["phone", "description", "location_text"],
    },
  },
  {
    name: "check_status",
    description:
      "Check grievance status by phone number or complaint number.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        phone: {
          type: SchemaType.STRING,
          description: "10-digit phone number",
        },
        complaint_number: {
          type: SchemaType.STRING,
          description: "Complaint number like JSA-2026-DEL-00042",
        },
      },
    },
  },
  {
    name: "get_legal_rights",
    description: "Look up legal rights for a grievance category.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        category: {
          type: SchemaType.STRING,
          description:
            "Category slug: water_supply, electricity, roads_potholes, sanitation_garbage, drainage_sewage, street_lighting, public_transport, ration_card_pds, pension_welfare, corruption_misconduct, building_construction, parks_public_spaces",
        },
      },
      required: ["category"],
    },
  },
];

// ---------------------------------------------------------------------------
// System prompt (same as the Python agent)
// ---------------------------------------------------------------------------

function buildSystemPrompt(): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `You are a JanSunwai AI grievance assistant. You help Indian citizens file civic complaints about infrastructure and service issues in their city. You are a trained public service representative -- empathetic, patient, and efficient.

## CURRENT DATE: ${dateStr}

## CORE IDENTITY
- Role: JanSunwai AI Voice Assistant — civic grievance intake officer
- Goal: Help citizens file complaints, check status, and know their legal rights
- Style: Warm, patient, empathetic, concise
- Languages: Hindi (default) and English. Mirror the caller's language.

## FILING A GRIEVANCE (follow this sequence)
1. Ask: "Aapki kya samasya hai?" — understand the problem
2. Ask: "Yeh samasya kahan hai?" — get the location (area, landmark, ward)
3. Ask: "Aapka mobile number kya hai?" — get 10-digit phone number, repeat back to confirm
4. Ask: "Aapka shubh naam?" — name is optional
5. Call file_grievance tool (do NOT ask for category or severity — backend auto-classifies)
6. Confirm: complaint number, assigned department, severity, legal rights

## CHECKING STATUS
1. Ask for complaint number or phone number
2. Call check_status tool
3. Report: current status, department, escalation level, days open

## LEGAL RIGHTS
- Call get_legal_rights after filing or when asked
- Explain in simple Hindi/English with mandated timeline
- If SLA exceeded, mention RTI option

## RULES
- Maximum 3 sentences per response (this is voice, be concise)
- Never repeat the same question more than twice
- Never ask for category or severity (backend handles it)
- Never mention tool names — say "Main aapki complaint darj kar raha hoon"
- Default to Hindi, switch if caller uses English
- If a tool call fails, say: "Ek technical samasya aa rahi hai. Kripya thodi der baad try karein."`;
}

// ---------------------------------------------------------------------------
// Backend API helpers
// ---------------------------------------------------------------------------

async function callFileGrievance(args: Record<string, string>) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/grievance/file`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: args.description,
        address: args.location_text,
        phone: args.phone,
        name: args.name || "",
        language: args.language || "hi",
      }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Filing failed" };
    return data.data || data;
  } catch {
    return { error: "Backend unreachable" };
  }
}

async function callCheckStatus(args: Record<string, string>) {
  try {
    const query = args.complaint_number
      ? `complaint_number=${encodeURIComponent(args.complaint_number)}`
      : `phone=${encodeURIComponent(args.phone)}`;
    const res = await fetch(`${API_BASE}/api/v1/grievance/search?${query}`);
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Search failed" };
    return data.data || data;
  } catch {
    return { error: "Backend unreachable" };
  }
}

async function callGetLegalRights(args: Record<string, string>) {
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/citizen/rights/${encodeURIComponent(args.category)}`
    );
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Rights lookup failed" };
    return data.data || data;
  } catch {
    return { error: "Backend unreachable" };
  }
}

async function executeFunctionCall(
  name: string,
  args: Record<string, string>
): Promise<object> {
  switch (name) {
    case "file_grievance":
      return await callFileGrievance(args);
    case "check_status":
      return await callCheckStatus(args);
    case "get_legal_rights":
      return await callGetLegalRights(args);
    default:
      return { error: `Unknown function: ${name}` };
  }
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: "Google API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { messages } = body as {
      messages: Array<{ role: "user" | "model"; text: string }>;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array required" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: buildSystemPrompt(),
      tools: [{ functionDeclarations }],
    });

    // Build Gemini conversation history.
    // Gemini requires history to start with role "user", so skip any leading
    // "model" messages (like the greeting we show on the frontend).
    const allButLast = messages.slice(0, -1);
    const firstUserIdx = allButLast.findIndex((m) => m.role === "user");
    const validHistory = firstUserIdx >= 0 ? allButLast.slice(firstUserIdx) : [];
    const history: Content[] = validHistory.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1].text;

    // Send message and handle potential function calls
    let result = await chat.sendMessage(lastMessage);
    let response = result.response;

    // Process function calls (may need multiple rounds)
    let rounds = 0;
    while (rounds < 3) {
      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      const fnCall = parts.find((p) => p.functionCall);

      if (!fnCall?.functionCall) break;

      const { name, args } = fnCall.functionCall;
      console.log(`[VoiceChat] Tool call: ${name}`, args);

      const fnResult = await executeFunctionCall(
        name,
        (args as Record<string, string>) || {}
      );
      console.log(`[VoiceChat] Tool result:`, JSON.stringify(fnResult).slice(0, 200));

      // Feed the function result back to Gemini
      result = await chat.sendMessage([
        {
          functionResponse: {
            name,
            response: fnResult,
          },
        },
      ]);
      response = result.response;
      rounds++;
    }

    const text = response.text();

    return NextResponse.json({ text });
  } catch (error) {
    console.error("[VoiceChat] Error:", error);
    return NextResponse.json(
      { error: "Voice chat processing failed" },
      { status: 500 }
    );
  }
}
