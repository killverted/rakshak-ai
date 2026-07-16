// @ts-nocheck
import { GoogleGenAI } from "npm:@google/genai@2.11.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type AnalysisResponse = {
  disaster_type: string;
  severity_label: "Low" | "Medium" | "High" | "Critical";
  severity_score: number;
  confidence: number;
  image_authenticity: number;
  hazards: string[];
  safety_actions: string[];
  summary: string;
  estimated_affected_area: string;
  priority_level: string;
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseJsonArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Robustly extract a JSON object from Gemini's response.
 * Handles: already-parsed objects, raw JSON strings, markdown-wrapped JSON,
 * JSON embedded in prose, double-escaped JSON strings, and invisible
 * control characters that break JSON.parse.
 */
function extractJson(raw: unknown): Record<string, unknown> {
  console.log(`[analyze-image] extractJson input typeof: ${typeof raw}`);

  // Case 1: already a parsed object — use directly, no JSON.parse needed
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }

  // Case 2: not a string — can't parse
  if (typeof raw !== "string") throw new Error(`Expected string or object, got ${typeof raw}`);

  let text = raw.trim();
  if (!text) throw new Error("Empty response string");

  // Strip BOM if present
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

  // Strip markdown code fences: ```json\n{...}\n``` or ```\n{...}\n```
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  // If the entire string is a JSON string (double-escaped), unwrap it once
  if (text.startsWith('"') && text.endsWith('"')) {
    try {
      const unwrapped = JSON.parse(text);
      if (typeof unwrapped === "string") text = unwrapped;
    } catch { /* not a JSON string, keep original */ }
  }

  // Clean invisible control characters that can break JSON.parse
  // (zero-width spaces, BOMs, non-breaking spaces, etc.) — but preserve
  // valid JSON whitespace (\n, \r, \t are valid inside JSON strings)
  text = text.replace(/[\u200B-\u200F\u2028-\u202F\u205F\u3000\uFEFF]/g, "");

  // Attempt 1: parse the entire string as-is
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === "string") return JSON.parse(parsed);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (e) {
    console.log(`[analyze-image] JSON.parse(full) failed: ${e instanceof Error ? e.message : e}`);
  }

  // Attempt 2: extract the first balanced {...} block
  const start = text.indexOf("{");
  if (start !== -1) {
    // Find the matching closing brace by counting depth
    let depth = 0;
    let inString = false;
    let escape = false;
    let end = -1;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") depth++;
      else if (ch === "}") { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end > start) {
      const slice = text.slice(start, end + 1);
      try {
        const parsed = JSON.parse(slice);
        if (typeof parsed === "string") return JSON.parse(parsed);
        if (parsed && typeof parsed === "object") return parsed;
      } catch (e) {
        console.log(`[analyze-image] JSON.parse(slice) failed: ${e instanceof Error ? e.message : e}`);
      }
    }
  }

  // Attempt 3: try fixing common JSON issues — trailing commas
  const startIdx = text.indexOf("{");
  if (startIdx !== -1) {
    let depth = 0; let inStr = false; let esc = false; let endIdx = -1;
    for (let i = startIdx; i < text.length; i++) {
      const ch = text[i];
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === "{") depth++;
      else if (ch === "}") { depth--; if (depth === 0) { endIdx = i; break; } }
    }
    if (endIdx > startIdx) {
      const fixed = text.slice(startIdx, endIdx + 1).replace(/,\s*([}\]])/g, "$1");
      try {
        const parsed = JSON.parse(fixed);
        if (parsed && typeof parsed === "object") return parsed;
      } catch (e) {
        console.log(`[analyze-image] JSON.parse(fixed) failed: ${e instanceof Error ? e.message : e}`);
      }
    }
  }

  throw new Error(`Could not parse JSON. First 200 chars: ${text.slice(0, 200)}`);
}

const PROMPT = `You are an expert disaster analysis AI for an emergency response platform called Rakshak AI.
Analyze the provided image and return a JSON object with EXACTLY these fields:

{
  "disaster_type": "string — the detected disaster category, one of: Flood, Fire, Earthquake, Cyclone, Landslide, Industrial Accident, Building Collapse, Chemical Spill, Water Crisis, Other",
  "severity_label": "Low | Medium | High | Critical — overall severity of the situation shown",
  "severity_score": "integer 0-100 — numeric severity (0=none, 100=catastrophic)",
  "confidence": "integer 0-100 — your confidence in this analysis",
  "image_authenticity": "integer 0-100 — likelihood the image is a genuine disaster photo (100=clearly real disaster, 0=stock/fake/unrelated)",
  "hazards": ["array of strings — specific hazards detected, e.g. 'structural collapse', 'fast-moving water', 'active fire', 'gas leak']",
  "safety_actions": ["array of strings — recommended immediate safety actions in priority order, e.g. 'Evacuate immediately', 'Do not re-enter structure']",
  "summary": "string — 2-3 sentence professional executive summary of findings",
  "estimated_affected_area": "string — estimated area affected, e.g. '500m radius', '2 sq km', 'Unknown'",
  "priority_level": "P1 | P2 | P3 | P4 — P1=critical/immediate, P2=high, P3=medium, P4=low"
}

Rules:
- If the image is not disaster-related, set severity_label to "Low", severity_score low, confidence high, priority_level "P4", and note it in the summary.
- Be concise and actionable. This output goes to emergency responders.
- Return ONLY valid JSON, no markdown.`;

function isRetryable(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("429") || m.includes("resource_exhausted") || m.includes("rate limit") || m.includes("overloaded") || m.includes("503");
}

function isNotFound(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("404") || m.includes("not found") || m.includes("not_found") || m.includes("is not found");
}

function isQuotaExhausted(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("limit: 0") || m.includes("quota exceeded") || m.includes("per_day_per_project") && m.includes("limit: 0");
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// Latest stable models in priority order — try newest first
const MODEL_PRIORITY = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash-lite"];
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function callGemini(ai, model, base64, mimeType, weatherContext): Promise<unknown> {
  const fullPrompt = weatherContext
    ? `${PROMPT}\n\nCurrent weather conditions at the report location: ${weatherContext}. Factor these conditions into your severity assessment and safety recommendations.`
    : PROMPT;
  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: fullPrompt }, { inlineData: { data: base64, mimeType } }] }],
    config: { responseMimeType: "application/json", temperature: 0.2 },
  });
  console.log(`[analyze-image] callGemini response typeof: ${typeof response}, keys: ${Object.keys(response || {}).join(",")}`);
  if (typeof response === "object" && response !== null) {
    if (typeof response.json === "function") {
      try {
        const parsed = response.json();
        console.log(`[analyze-image] response.json() typeof: ${typeof parsed}`);
        if (parsed && typeof parsed === "object") return parsed;
      } catch { /* fall through to .text */ }
    }
    if (response.disaster_type || response.severity_label) {
      console.log("[analyze-image] response is already the analysis object");
      return response;
    }
    const text = response.text;
    console.log(`[analyze-image] response.text typeof: ${typeof text}`);
    return text ?? "";
  }
  return response ?? "";
}

async function analyzeWithRetry(ai, base64, mimeType, weatherContext): Promise<{ result: unknown; model: string }> {
  const errors: string[] = [];
  for (const model of MODEL_PRIORITY) {
    console.log(`[analyze-image] Attempting model: ${model}`);
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await callGemini(ai, model, base64, mimeType, weatherContext);
        console.log(`[analyze-image] Success with model ${model} on attempt ${attempt + 1}`);
        return { result, model };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${model}: ${msg}`);
        console.log(`[analyze-image] Model ${model} attempt ${attempt + 1} failed: ${msg}`);

        // If model not found, skip to next model immediately
        if (isNotFound(msg)) {
          console.log(`[analyze-image] Model ${model} not found, trying next model`);
          break;
        }

        // If daily quota is exhausted (limit: 0), skip to next model
        if (isQuotaExhausted(msg)) {
          console.log(`[analyze-image] Model ${model} daily quota exhausted (limit: 0), trying next model`);
          break;
        }

        // If retryable (rate limit / overloaded), retry with backoff
        if (isRetryable(msg) && attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt);
          console.log(`[analyze-image] Retrying ${model} in ${delay}ms`);
          await sleep(delay);
          continue;
        }

        // Non-retryable error, try next model
        break;
      }
    }
  }
  throw new Error(`All models exhausted. Errors:\n${errors.join("\n")}`);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("[analyze-image] GEMINI_API_KEY secret is not set");
      return jsonResponse({ error: "AI service is not configured. GEMINI_API_KEY secret is missing. Add it in Supabase Edge Function secrets." }, 503);
    }
    console.log("[analyze-image] GEMINI_API_KEY loaded, length:", apiKey.length, "prefix:", apiKey.slice(0, 4) + "...");

    const body = await req.json();
    const { image, mimeType, weather } = body as { image?: string; mimeType?: string; weather?: { temp?: number; humidity?: number; windSpeed?: number; rainfall?: number; visibility?: number; alert?: string } };
    if (!image || typeof image !== "string") return jsonResponse({ error: "An image (base64 string) is required." }, 400);

    let weatherContext = "";
    if (weather && (weather.temp !== undefined || weather.humidity !== undefined || weather.windSpeed !== undefined)) {
      weatherContext = [
        weather.temp !== undefined ? `Temperature: ${weather.temp}°C` : null,
        weather.humidity !== undefined ? `Humidity: ${weather.humidity}%` : null,
        weather.windSpeed !== undefined ? `Wind Speed: ${weather.windSpeed} m/s` : null,
        weather.rainfall !== undefined ? `Rainfall: ${weather.rainfall} mm` : null,
        weather.visibility !== undefined ? `Visibility: ${weather.visibility} m` : null,
        weather.alert ? `Weather Alert: ${weather.alert}` : null,
      ].filter(Boolean).join(", ");
      console.log(`[analyze-image] Weather context: ${weatherContext}`);
    }

    const ai = new GoogleGenAI({ apiKey });
    const mime = mimeType || "image/jpeg";
    const { result, model } = await analyzeWithRetry(ai, image, mime, weatherContext);
    console.log(`[analyze-image] Analysis complete using model: ${model}, result typeof: ${typeof result}`);

    let parsed: Record<string, unknown>;
    try { parsed = extractJson(result); }
    catch (e) {
      const raw = typeof result === "string" ? result.slice(0, 500) : JSON.stringify(result)?.slice(0, 500) ?? "non-string";
      return jsonResponse({ error: "AI returned an unparseable response. Raw output: " + raw }, 502);
    }

    const validLabels = ["Low", "Medium", "High", "Critical"] as const;
    const severityLabel = validLabels.includes(parsed.severity_label as never)
      ? (parsed.severity_label as AnalysisResponse["severity_label"]) : "Medium";
    const validPriorities = ["P1", "P2", "P3", "P4"] as const;
    const priorityLevel = validPriorities.includes(parsed.priority_level as never)
      ? (parsed.priority_level as string) : "P3";

    const analysis: AnalysisResponse = {
      disaster_type: String(parsed.disaster_type ?? "Other"),
      severity_label: severityLabel,
      severity_score: clamp(Number(parsed.severity_score ?? 50) || 50, 0, 100),
      confidence: clamp(Number(parsed.confidence ?? 0) || 0, 0, 100),
      image_authenticity: clamp(Number(parsed.image_authenticity ?? 50) || 50, 0, 100),
      hazards: parseJsonArray(parsed.hazards),
      safety_actions: parseJsonArray(parsed.safety_actions),
      summary: String(parsed.summary ?? "No summary available."),
      estimated_affected_area: String(parsed.estimated_affected_area ?? "Unknown"),
      priority_level: priorityLevel,
    };

    return jsonResponse({ analysis, model });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[analyze-image] Fatal error: ${message}`);

    // Return the full per-model error breakdown so the caller can diagnose
    if (message.includes("All models exhausted")) {
      return jsonResponse({ error: message, httpStatus: 502 }, 502);
    }
    if (message.includes("API_KEY") || message.includes("permission") || message.includes("403"))
      return jsonResponse({ error: "AI service authentication failed: " + message }, 502);
    if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED"))
      return jsonResponse({ error: "AI service rate limit reached after all retries: " + message }, 429);
    if (message.includes("404") || message.includes("not found"))
      return jsonResponse({ error: "AI model unavailable (404): " + message }, 502);
    return jsonResponse({ error: "AI analysis failed: " + message }, 502);
  }
});
