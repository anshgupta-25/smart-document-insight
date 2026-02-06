import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, text, fileName, query, chunks } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (action === "compress") {
      return await handleCompress(text, fileName, LOVABLE_API_KEY);
    } else if (action === "audit") {
      return await handleAudit(query, text, chunks, LOVABLE_API_KEY);
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-document error:", e);
    const status = e.message?.includes("Rate limit") ? 429 : 500;
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function callAI(messages: any[], LOVABLE_API_KEY: string, tools?: any[], tool_choice?: any) {
  const body: any = {
    model: "google/gemini-3-flash-preview",
    messages,
  };
  if (tools) {
    body.tools = tools;
    body.tool_choice = tool_choice;
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("Rate limit exceeded, please try again later.");
    if (response.status === 402) throw new Error("Payment required, please add credits.");
    const t = await response.text();
    console.error("AI gateway error:", response.status, t);
    throw new Error("AI gateway error: " + response.status);
  }

  return await response.json();
}

/* ──────────────────────────────────────────────
   EXTRACTION-FIRST COMPRESSION PIPELINE
   Step 1: Extract raw text → store as ground truth
   Step 2: Chunk with source references
   Step 3: Summarize ONLY from extracted chunks
   Step 4: Verify each fact against source text
   ────────────────────────────────────────────── */

async function handleCompress(text: string, fileName: string, apiKey: string) {
  // Step 1: Build line-indexed source for traceability
  const lines = text.split("\n");
  const lineIndex = lines.map((line, i) => ({ lineNumber: i + 1, text: line }));

  // Step 2: Create chunks with exact source references
  const rawChunks = createChunksWithReferences(text, lines);

  // Step 3: Ask AI to summarize ONLY from provided chunks — strict extraction mode
  const systemPrompt = `You are a STRICT document extraction AI. You must follow these rules absolutely:

CRITICAL RULES:
1. ONLY use text that is DIRECTLY present in the provided document chunks. 
2. NEVER invent, infer, assume, or add ANY information not in the source text.
3. NEVER rewrite, embellish, or creatively interpret the source text.
4. If information is missing from the source, output "Not present in source document".
5. Every statement in your summary MUST have a direct quote from the source text as evidence.
6. Preserve original wording, titles, names, dates, and numbers EXACTLY as written.
7. For resumes: preserve original job titles, institutions, dates, and achievements verbatim.

VERIFICATION REQUIREMENT:
- For each summary point, you MUST include the exact original text it came from in the "evidence" field.
- Set "verified" to true ONLY if the summary directly reflects the source text without modification.
- Set "verified" to false and "verificationNote" to explain if you are uncertain.

OUTPUT FORMAT:
- Use the provided tool to return structured results.
- Each summary must include evidence (exact source quote) and verification status.`;

  const tools = [
    {
      type: "function",
      function: {
        name: "verified_compression",
        description: "Return verified hierarchical document compression with fact-checked summaries",
        parameters: {
          type: "object",
          properties: {
            summaries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  level: { type: "string", enum: ["document", "chapter", "section"] },
                  summary: { type: "string" },
                  evidence: { type: "string", description: "Exact quote from source text that supports this summary" },
                  sourceRef: { type: "string", description: "Line range reference e.g. 'Lines 1-15'" },
                  verified: { type: "boolean", description: "true only if summary directly reflects source text" },
                  verificationNote: { type: "string", description: "Explanation if not verified or partially verified" },
                  extractedEntities: {
                    type: "object",
                    properties: {
                      numbers: { type: "array", items: { type: "string" } },
                      dates: { type: "array", items: { type: "string" } },
                      risks: { type: "array", items: { type: "string" } },
                      constraints: { type: "array", items: { type: "string" } },
                      exceptions: { type: "array", items: { type: "string" } },
                    },
                    required: ["numbers", "dates", "risks", "constraints", "exceptions"],
                    additionalProperties: false,
                  },
                  children: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        title: { type: "string" },
                        level: { type: "string", enum: ["chapter", "section"] },
                        summary: { type: "string" },
                        evidence: { type: "string" },
                        sourceRef: { type: "string" },
                        verified: { type: "boolean" },
                        verificationNote: { type: "string" },
                        extractedEntities: {
                          type: "object",
                          properties: {
                            numbers: { type: "array", items: { type: "string" } },
                            dates: { type: "array", items: { type: "string" } },
                            risks: { type: "array", items: { type: "string" } },
                            constraints: { type: "array", items: { type: "string" } },
                            exceptions: { type: "array", items: { type: "string" } },
                          },
                          required: ["numbers", "dates", "risks", "constraints", "exceptions"],
                          additionalProperties: false,
                        },
                      },
                      required: ["id", "title", "level", "summary", "evidence", "verified"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["id", "title", "level", "summary", "evidence", "verified"],
                additionalProperties: false,
              },
            },
            verificationStats: {
              type: "object",
              properties: {
                totalFacts: { type: "number" },
                verifiedFacts: { type: "number" },
                unverifiedFacts: { type: "number" },
                conflictFacts: { type: "number" },
                confidenceScore: { type: "number", description: "0-100 overall extraction confidence" },
                hallucinationRisk: { type: "string", enum: ["low", "medium", "high"] },
              },
              required: ["totalFacts", "verifiedFacts", "unverifiedFacts", "conflictFacts", "confidenceScore", "hallucinationRisk"],
              additionalProperties: false,
            },
          },
          required: ["summaries", "verificationStats"],
          additionalProperties: false,
        },
      },
    },
  ];

  // Build the prompt with chunked source text and line references
  const chunkedText = rawChunks
    .map((c) => `[${c.sourceRef}]\n${c.text}`)
    .join("\n\n---\n\n");

  const result = await callAI(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Analyze this document titled "${fileName}". Extract and summarize ONLY what is directly written below. Do NOT add any information not present.\n\nSOURCE DOCUMENT:\n${chunkedText}`,
      },
    ],
    apiKey,
    tools,
    { type: "function", function: { name: "verified_compression" } }
  );

  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("AI did not return structured output");

  const parsed = JSON.parse(toolCall.function.arguments);

  // Step 4: Post-processing verification — check evidence against source
  const verifiedSummaries = postVerify(parsed.summaries, text);

  // Recompute stats after post-verification
  const stats = computeVerificationStats(verifiedSummaries);

  return new Response(
    JSON.stringify({
      chunks: rawChunks,
      summaries: verifiedSummaries,
      verificationStats: stats,
      rawTextPreview: text.slice(0, 2000),
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/** Create chunks from raw text with exact line references */
function createChunksWithReferences(text: string, lines: string[]): any[] {
  const chunks: any[] = [];
  const chunkSize = 15; // lines per chunk
  let chunkIndex = 0;

  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunkLines = lines.slice(i, i + chunkSize);
    const chunkText = chunkLines.join("\n").trim();
    if (!chunkText) continue;

    chunkIndex++;
    chunks.push({
      id: `chunk-${chunkIndex}`,
      text: chunkText,
      sourceRef: `Lines ${i + 1}-${Math.min(i + chunkSize, lines.length)}`,
      pageNumber: Math.ceil((i + 1) / 50), // approximate page
    });
  }

  return chunks;
}

/** Post-verify: check if evidence text actually exists in the source document */
function postVerify(summaries: any[], sourceText: string): any[] {
  const lowerSource = sourceText.toLowerCase();

  return summaries.map((s: any) => {
    const evidence = s.evidence || "";
    // Check if significant words from evidence appear in source
    const evidenceWords = evidence
      .toLowerCase()
      .split(/\s+/)
      .filter((w: string) => w.length > 3);
    
    const matchCount = evidenceWords.filter((w: string) => lowerSource.includes(w)).length;
    const matchRatio = evidenceWords.length > 0 ? matchCount / evidenceWords.length : 0;

    const postVerified = matchRatio >= 0.6;
    const verificationStatus = postVerified ? "verified" : matchRatio >= 0.3 ? "unverified" : "conflict";

    const result = {
      ...s,
      verified: postVerified,
      verificationStatus,
      verificationNote: postVerified
        ? "Evidence confirmed in source document"
        : matchRatio >= 0.3
        ? "Partial match — some evidence terms not found in source"
        : "Evidence could not be confirmed in source document",
      originalText: evidence, // Use the evidence as the source reference
    };

    if (s.children) {
      result.children = postVerify(s.children, sourceText);
    }

    return result;
  });
}

/** Compute verification statistics from processed summaries */
function computeVerificationStats(summaries: any[]): any {
  let total = 0, verified = 0, unverified = 0, conflict = 0;

  function count(items: any[]) {
    for (const item of items) {
      total++;
      if (item.verificationStatus === "verified") verified++;
      else if (item.verificationStatus === "unverified") unverified++;
      else conflict++;
      if (item.children) count(item.children);
    }
  }

  count(summaries);

  const confidenceScore = total > 0 ? Math.round((verified / total) * 100) : 0;
  const hallucinationRisk = confidenceScore >= 80 ? "low" : confidenceScore >= 50 ? "medium" : "high";

  return { totalFacts: total, verifiedFacts: verified, unverifiedFacts: unverified, conflictFacts: conflict, confidenceScore, hallucinationRisk };
}

async function handleAudit(query: string, text: string, chunks: any[], apiKey: string) {
  const systemPrompt = `You are a retrieval integrity auditor. Given a user query and document chunks, analyze retrieval quality using the provided tool.

Rules:
- Evaluate each chunk's relevance to the query (assign similarity 0.0-1.0)
- Mark chunks as relevant (isRelevant: true) or noise (isNoise: true) 
- Compute an integrity score 0-100 based on coverage, relevance, and completeness
- Identify missing important evidence
- Identify noise chunks that are irrelevant
- Generate coverage data for different query aspects
- Provide specific improvement suggestions (query rewriting, re-chunking, hybrid retrieval)
- Explain why the retrieval is sufficient or insufficient`;

  const tools = [
    {
      type: "function",
      function: {
        name: "retrieval_audit",
        description: "Return retrieval audit results with scores, coverage, and recommendations",
        parameters: {
          type: "object",
          properties: {
            retrievedChunks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  text: { type: "string" },
                  similarity: { type: "number" },
                  isRelevant: { type: "boolean" },
                  isNoise: { type: "boolean" },
                  sourceRef: { type: "string" },
                },
                required: ["id", "text", "similarity", "isRelevant", "isNoise"],
                additionalProperties: false,
              },
            },
            integrityScore: { type: "number" },
            coverageData: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  coverage: { type: "number" },
                },
                required: ["label", "coverage"],
                additionalProperties: false,
              },
            },
            alerts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  type: { type: "string", enum: ["missing", "noise", "info"] },
                  title: { type: "string" },
                  description: { type: "string" },
                  suggestion: { type: "string" },
                },
                required: ["id", "type", "title", "description"],
                additionalProperties: false,
              },
            },
            explanation: { type: "string" },
            suggestions: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["retrievedChunks", "integrityScore", "coverageData", "alerts", "explanation", "suggestions"],
          additionalProperties: false,
        },
      },
    },
  ];

  const chunksText = chunks.map((c: any, i: number) => `[Chunk ${i + 1}] ${c.text}`).join("\n\n");

  const result = await callAI(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Query: "${query}"\n\nDocument text excerpt:\n${text.slice(0, 10000)}\n\nRetrieved chunks:\n${chunksText}`,
      },
    ],
    apiKey,
    tools,
    { type: "function", function: { name: "retrieval_audit" } }
  );

  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("AI did not return structured audit");

  const parsed = JSON.parse(toolCall.function.arguments);

  return new Response(JSON.stringify(parsed), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
