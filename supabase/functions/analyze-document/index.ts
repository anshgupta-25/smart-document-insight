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

async function handleCompress(text: string, fileName: string, apiKey: string) {
  const systemPrompt = `You are a document analysis AI. Given text from a document, produce structured output using the provided tool.

Rules:
- Create hierarchical summaries at document, chapter, and section levels
- Split the text into logical chunks (200-500 words each)
- For each summary, extract key entities: numbers, dates, risks, constraints, exceptions
- Include source references (approximate paragraph/line ranges)
- Keep summaries concise but preserve critical information
- Identify and highlight risks, exceptions, and constraints`;

  const tools = [
    {
      type: "function",
      function: {
        name: "structured_compression",
        description: "Return hierarchical document compression with chunks and summaries",
        parameters: {
          type: "object",
          properties: {
            chunks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  text: { type: "string" },
                  pageNumber: { type: "number" },
                  sourceRef: { type: "string" },
                },
                required: ["id", "text"],
                additionalProperties: false,
              },
            },
            summaries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  level: { type: "string", enum: ["document", "chapter", "section"] },
                  summary: { type: "string" },
                  sourceRef: { type: "string" },
                  originalText: { type: "string" },
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
                        sourceRef: { type: "string" },
                        originalText: { type: "string" },
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
                      required: ["id", "title", "level", "summary"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["id", "title", "level", "summary"],
                additionalProperties: false,
              },
            },
          },
          required: ["chunks", "summaries"],
          additionalProperties: false,
        },
      },
    },
  ];

  const result = await callAI(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Analyze and compress this document titled "${fileName}":\n\n${text}` },
    ],
    apiKey,
    tools,
    { type: "function", function: { name: "structured_compression" } }
  );

  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("AI did not return structured output");

  const parsed = JSON.parse(toolCall.function.arguments);

  return new Response(JSON.stringify(parsed), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleAudit(query: string, text: string, chunks: any[], apiKey: string) {
  const systemPrompt = `You are a retrieval integrity auditor. Given a user query and document chunks, analyze retrieval quality using the provided tool.

Rules:
- Evaluate each chunk's relevance to the query (assign similarity 0.0-1.0)
- Mark chunks as relevant (isRelevant: true) or noise (isNoise: true) 
- Compute an integrity score 0-100 based on coverage, relevance, and completeness
- Identify missing evidence that should have been retrieved
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
