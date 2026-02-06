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
    model: "google/gemini-2.5-flash",
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
   MULTI-LEVEL HIERARCHICAL COMPRESSION PIPELINE
   Level 1: Executive TL;DR (5 bullet max)
   Level 2: Section Summaries (abstracted insights)
   Level 3: Evidence Layer (exact quotes + refs)
   + Cross-chunk reasoning & deduplication
   ────────────────────────────────────────────── */

async function handleCompress(text: string, fileName: string, apiKey: string) {
  const lines = text.split("\n");
  const rawChunks = createChunksWithReferences(text, lines);
  const sourceWordCount = text.split(/\s+/).length;

  const systemPrompt = `You are an expert document intelligence AI that produces MULTI-LEVEL HIERARCHICAL COMPRESSION with IMPORTANCE CLASSIFICATION.

CRITICAL RULES:
1. ONLY use text directly present in the source document. NEVER invent or infer.
2. Every claim MUST have exact source evidence quotes.
3. Preserve original wording, names, dates, numbers EXACTLY.
4. If information is missing, output "Not present in source document".

YOUR TASK — Generate THREE levels of compression WITH importance scoring:

LEVEL 1 — EXECUTIVE SUMMARY (id prefix: "exec-"):
- Create ONE document-level summary node with level="document"
- The "summary" field = 3-5 concise bullet points capturing the MOST important facts
- This is a TL;DR — high-level takeaways only, NOT raw sentences
- Cross-reference ALL chunks to find the big picture
- Deduplicate repeated information across chunks
- The "evidence" field = key supporting quotes concatenated

LEVEL 2 — SECTION SUMMARIES (id prefix: "sec-"):
- Create these as "children" of the executive summary node
- Each child has level="chapter"
- Group related chunks into logical THEMATIC sections
- Each section summary = ONE short paragraph (2-3 sentences) that ABSTRACTS and SYNTHESIZES multiple chunks
- Do NOT copy-paste raw text — restructure it into intelligent insights
- Remove redundancy — if the same fact appears in multiple chunks, mention it ONCE
- The "evidence" field = the exact source quotes supporting the section summary

LEVEL 3 — EVIDENCE DETAILS (id prefix: "ev-"):
- Create these as "children" of each section summary
- Each child has level="section"
- These are individual verified facts with exact original wording
- The "summary" field = the specific fact/claim
- The "evidence" field = the EXACT original sentence from source

IMPORTANCE CLASSIFICATION — For EVERY node (all levels), assign:
- "importance": one of "critical", "important", or "supporting"
- "importanceScore": integer 0-100 indicating semantic importance
- "importanceReason": short explanation of WHY this is important (1 sentence)

IMPORTANCE RULES BY DOCUMENT TYPE:
- Resume → ⭐ Critical: achievements with measurable impact, key skills, certifications. 🔵 Important: education, notable projects. ⚪ Supporting: activities, contact info.
- Policy/Legal → ⭐ Critical: rules, penalties, deadlines, obligations, legal constraints. 🔵 Important: procedures, compliance requirements. ⚪ Supporting: definitions, context.
- Report → ⭐ Critical: conclusions, key findings, financial figures, risks. 🔵 Important: methodology, recommendations. ⚪ Supporting: background, appendices.
- Contract → ⭐ Critical: obligations, termination clauses, payment terms, liability. 🔵 Important: scope, timelines. ⚪ Supporting: definitions, recitals.
- Technical/Logs → ⭐ Critical: errors, failures, security issues. 🔵 Important: warnings, performance metrics. ⚪ Supporting: info-level logs, trace data.
- General → ⭐ Critical: key decisions, deadlines, action items, financial figures, risks. 🔵 Important: responsibilities, performance metrics, conclusions. ⚪ Supporting: context, background.

DETECT AND HIGHLIGHT these content categories:
- Key decisions and conclusions
- Deadlines and time-sensitive items
- Financial figures and metrics
- Risks and warnings
- Legal constraints and obligations
- Exceptions and edge cases
- Action items and responsibilities

FOR RESUMES specifically, organize sections as:
- Profile Overview, Education, Achievements, Technical Skills, Projects, Certifications/Activities

ENTITIES: Extract numbers, dates, risks, constraints, exceptions from source text only.

QUALITY REQUIREMENTS:
- Executive summary must be SHORT and scannable (judge-friendly)
- Section summaries must show UNDERSTANDING, not just extraction
- Evidence layer preserves exact wording for verification
- Total summary word count should be 30-50% of source (real compression)
- At least 20% of items should be ⭐ Critical, 40% 🔵 Important, rest ⚪ Supporting`;

  const tools = [
    {
      type: "function",
      function: {
        name: "hierarchical_compression",
        description: "Return multi-level hierarchical document compression",
        parameters: {
          type: "object",
          properties: {
            summaries: {
              type: "array",
              description: "Should contain ONE document-level executive summary with section children, each with evidence children",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  level: { type: "string", enum: ["document", "chapter", "section"] },
                  summary: { type: "string" },
                  evidence: { type: "string", description: "Exact quote(s) from source text" },
                  sourceRef: { type: "string", description: "Line range reference e.g. 'Lines 1-50'" },
                  verified: { type: "boolean" },
                  verificationNote: { type: "string" },
                  importance: { type: "string", enum: ["critical", "important", "supporting"] },
                  importanceScore: { type: "number", description: "0-100 importance score" },
                  importanceReason: { type: "string", description: "Why this is important" },
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
                        importance: { type: "string", enum: ["critical", "important", "supporting"] },
                        importanceScore: { type: "number" },
                        importanceReason: { type: "string" },
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
                              level: { type: "string", enum: ["section"] },
                              summary: { type: "string" },
                              evidence: { type: "string" },
                              sourceRef: { type: "string" },
                              verified: { type: "boolean" },
                              verificationNote: { type: "string" },
                              importance: { type: "string", enum: ["critical", "important", "supporting"] },
                              importanceScore: { type: "number" },
                              importanceReason: { type: "string" },
                            },
                            required: ["id", "title", "level", "summary", "evidence", "verified", "importance", "importanceScore", "importanceReason"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["id", "title", "level", "summary", "evidence", "verified", "importance", "importanceScore", "importanceReason"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["id", "title", "level", "summary", "evidence", "verified", "importance", "importanceScore", "importanceReason"],
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
                confidenceScore: { type: "number", description: "0-100 extraction confidence" },
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

  const chunkedText = rawChunks
    .map((c) => `[${c.sourceRef}]\n${c.text}`)
    .join("\n\n---\n\n");

  console.log(`Processing document: ${fileName}, ${sourceWordCount} words, ${rawChunks.length} chunks`);

  const result = await callAI(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Analyze and compress this document titled "${fileName}". Produce a 3-level hierarchical summary. Cross-reference chunks, deduplicate, and abstract into intelligent insights.\n\nSOURCE DOCUMENT (${rawChunks.length} chunks):\n${chunkedText}`,
      },
    ],
    apiKey,
    tools,
    { type: "function", function: { name: "hierarchical_compression" } }
  );

  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("AI did not return structured output");

  const parsed = JSON.parse(toolCall.function.arguments);

  // Post-processing verification
  const verifiedSummaries = postVerify(parsed.summaries, text);
  const stats = computeVerificationStats(verifiedSummaries);

  // Compute compression quality metrics
  const summaryWordCount = countSummaryWords(verifiedSummaries);
  const compressionRatio = sourceWordCount > 0
    ? Math.round((1 - summaryWordCount / sourceWordCount) * 100)
    : 0;
  const redundancyScore = computeRedundancyScore(verifiedSummaries);
  const abstractionLevel = computeAbstractionLevel(verifiedSummaries, text);

  return new Response(
    JSON.stringify({
      chunks: rawChunks,
      summaries: verifiedSummaries,
      verificationStats: {
        ...stats,
        compressionRatio,
        redundancyScore,
        abstractionLevel,
        sourceWordCount,
        summaryWordCount,
      },
      rawTextPreview: text.slice(0, 2000),
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/** Create chunks from raw text with exact line references */
function createChunksWithReferences(text: string, lines: string[]): any[] {
  const chunks: any[] = [];
  const chunkSize = 15;
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
      pageNumber: Math.ceil((i + 1) / 50),
    });
  }

  return chunks;
}

/** Post-verify: check if evidence text actually exists in the source document */
function postVerify(summaries: any[], sourceText: string): any[] {
  const lowerSource = sourceText.toLowerCase();

  return summaries.map((s: any) => {
    const evidence = s.evidence || "";
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
      originalText: evidence,
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

/** Count total words across all summary texts */
function countSummaryWords(summaries: any[]): number {
  let count = 0;
  for (const s of summaries) {
    count += (s.summary || "").split(/\s+/).length;
    if (s.children) count += countSummaryWords(s.children);
  }
  return count;
}

/** Compute redundancy score — how many duplicate phrases exist across summaries */
function computeRedundancyScore(summaries: any[]): number {
  const phrases: string[] = [];

  function collect(items: any[]) {
    for (const item of items) {
      const words = (item.summary || "").toLowerCase().split(/\s+/).filter((w: string) => w.length > 4);
      // Create 3-grams
      for (let i = 0; i < words.length - 2; i++) {
        phrases.push(words.slice(i, i + 3).join(" "));
      }
      if (item.children) collect(item.children);
    }
  }

  collect(summaries);

  if (phrases.length === 0) return 100;

  const unique = new Set(phrases);
  const redundancyRatio = 1 - unique.size / phrases.length;
  // 0 = no redundancy (good), 100 = all duplicates (bad)
  // Invert: score 100 = no redundancy (best), 0 = all duplicates
  return Math.round((1 - redundancyRatio) * 100);
}

/** Compute abstraction level — how different summaries are from raw source text */
function computeAbstractionLevel(summaries: any[], sourceText: string): string {
  const sourceWords = new Set(sourceText.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4));
  const summaryWords: string[] = [];

  function collect(items: any[]) {
    for (const item of items) {
      if (item.level !== "section") { // Only check non-evidence levels
        summaryWords.push(...(item.summary || "").toLowerCase().split(/\s+/).filter((w: string) => w.length > 4));
      }
      if (item.children) collect(item.children);
    }
  }

  collect(summaries);

  if (summaryWords.length === 0) return "none";

  const overlapCount = summaryWords.filter(w => sourceWords.has(w)).length;
  const overlapRatio = overlapCount / summaryWords.length;

  // Lower overlap = higher abstraction
  if (overlapRatio < 0.5) return "high";
  if (overlapRatio < 0.7) return "medium";
  return "low";
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
