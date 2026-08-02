import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL = "gemma-4-26b-a4b-it";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are a product listing copywriter for a B2B sourcing marketplace. Given a product's name, category, price, and current description, rewrite the description to be polished, concise, and to the point - suitable for a buyer scanning a product catalog.

Rules:
- Keep it factual. Do not invent specifications, materials, certifications, or claims that aren't implied by the input.
- 2-4 short sentences or a few crisp bullet points, whichever suits the product better.
- No marketing fluff, no emojis, no exclamation marks.
- Do not mention the price in the description.

Output JSON only: { "description": "the rewritten description" }`;

function extractGeminiText(data: any): string | undefined {
  return data?.candidates?.[0]?.content?.parts
    ?.filter((p: any) => !p.thought)
    .map((p: any) => p.text || "")
    .join("")
    .trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, category, price, description } = await req.json();

    if (!name || typeof name !== "string") {
      return new Response(
        JSON.stringify({ error: "Product name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const userPrompt = `Product name: ${name}
Category: ${category || "Not specified"}
Price: ${price || "Not specified"}
Current description (may be empty or rough draft): ${description || "(none provided)"}`;

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate description" }),
        { status: response.status === 429 ? 429 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = extractGeminiText(data);

    if (!content) {
      throw new Error("No content in AI response");
    }

    let parsed: { description?: string };
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[1] : content);
    } catch {
      parsed = { description: content };
    }

    if (!parsed.description) {
      throw new Error("AI response did not include a description");
    }

    return new Response(JSON.stringify({ description: parsed.description }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in beautify-product:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
