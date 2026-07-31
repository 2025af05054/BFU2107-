import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are an expert industrial sourcing assistant. Your job is to convert a user's sourcing request (free text + attachments) into a set of structured candidate products ready for RFQ form integration.

CRITICAL REQUIREMENTS FOR PRODUCT CANDIDATES:
- Each product candidate MUST be formatted for direct RFQ form integration
- Extract and structure data according to the exact field mapping rules below
- For price ranges: use the LOWER value (min) for targetPrice
- For lead time ranges: use the HIGHER value (max) for targetLeadTime
- Default quantity to 1 if not specified
- Combine all descriptive text (specs, notes, basis explanations) into the description field

FIELD MAPPING RULES:
- productName: Extract the main product title/name
- quantity: Default to 1 if not specified
- manufacturer: Extract from "Likely Manufacturers" or "Possible Manufacturer" - use the primary/first manufacturer name with location
- description: Consolidate ALL descriptive text including specifications, notes, price basis, lead time basis, and any assumptions
- targetPrice: From price range, use the MINIMUM (lower) value as an integer
- targetLeadTime: From lead time range, use the MAXIMUM (higher) value as an integer in days

ALWAYS output valid JSON that exactly follows the provided schema. When you are uncertain, state your assumptions and a confidence score (0.0-1.0).

Output JSON schema:
{
  "summary": "short human-readable summary",
  "product_candidates": [
    {
      "productName": "string - main product title",
      "quantity": number - default to 1,
      "manufacturer": "string - primary manufacturer name with location",
      "description": "string - comprehensive description including all specs, notes, price basis, lead time basis",
      "targetPrice": number - integer, use MIN from price range,
      "targetLeadTime": number - integer in days, use MAX from lead time range,
      "currency": "string - e.g. INR, USD",
      "confidence_score": number,
      "raw_data": {
        "matched_specs": { "key": "value" },
        "estimated_price_range": { "min": number, "max": number },
        "estimated_lead_time_days": { "min": number, "max": number },
        "all_manufacturers": [ { "name":"string", "location":"string", "confidence": number } ]
      }
    }
  ],
  "clarifying_questions": [
    { "id": "q1", "text": "question text", "required": true, "reason":"explanation" }
  ],
  "assumptions": ["list of assumptions made"],
  "overall_confidence": number
}`;

function extractGeminiText(data: any): string | undefined {
  return data?.candidates?.[0]?.content?.parts
    ?.map((p: any) => p.text || "")
    .join("")
    .trim();
}

async function callGemini(apiKey: string, parts: any[], systemInstruction?: string) {
  const body: any = {
    contents: [{ role: "user", parts }],
  };
  if (systemInstruction) {
    body.system_instruction = { parts: [{ text: systemInstruction }] };
  }

  return fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function geminiErrorResponse(status: number, errorText: string) {
  console.error("Gemini API error:", status, errorText);
  if (status === 429) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  if (status === 403 || status === 401) {
    return new Response(
      JSON.stringify({ error: "Gemini API key is invalid or unauthorized." }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  return new Response(
    JSON.stringify({ error: "Gemini API error: " + errorText }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, description, quantity, priority, currency, fileUrls, fileNames, refine, queryId, answers } = await req.json();
    console.log('Sourcing assistant called with:', { mode, hasDescription: !!description, fileCount: fileUrls?.length || 0, refine });

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Handle document extraction mode
    if (mode === 'extract') {
      console.log('Document extraction mode activated');

      if (!fileUrls || fileUrls.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No files provided for extraction' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const extractionPrompt = `You are a technical specification extraction expert. Analyze the provided documents (images, PDFs, datasheets, technical drawings) and extract ALL technical specifications and details that would be needed to estimate the cost of manufacturing or procuring this component or material.

Extract information including but not limited to:
- Material grades and types
- Dimensions (length, width, height, diameter, thickness, etc.)
- Standards (ANSI, ISO, DIN, etc.)
- Flange ratings and classes
- Manufacturing processes required
- Tolerances and surface finishes
- Quantities or batch sizes mentioned
- Part numbers or model numbers
- Any other engineering or technical details

First, create a bulleted list of all extracted specifications.

Then, combine this information into a single, comprehensive paragraph that captures all the technical details in a natural flowing format suitable for a sourcing request. This paragraph should be detailed and include all relevant specifications that would help in cost estimation.

Format your response as JSON:
{
  "bulleted_specs": ["spec1", "spec2", ...],
  "comprehensive_paragraph": "detailed paragraph here"
}`;

      const parts: any[] = [{ text: extractionPrompt }];

      for (const url of fileUrls) {
        const fileName = fileNames?.[fileUrls.indexOf(url)] || '';
        const fileExt = fileName.split('.').pop()?.toLowerCase();

        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt || '')) {
          const imgResponse = await fetch(url);
          const arrayBuffer = await imgResponse.arrayBuffer();
          parts.push({
            inlineData: {
              mimeType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
              data: btoa(String.fromCharCode(...new Uint8Array(arrayBuffer))),
            },
          });
        } else if (fileExt === 'pdf') {
          parts.push({ text: `PDF document attached: ${fileName} (URL: ${url})` });
        }
      }

      const extractResponse = await callGemini(GEMINI_API_KEY, parts);

      if (!extractResponse.ok) {
        const errorText = await extractResponse.text();
        return geminiErrorResponse(extractResponse.status, errorText);
      }

      const extractData = await extractResponse.json();
      const extractContent = extractGeminiText(extractData);

      if (!extractContent) {
        console.error("No content in extraction response:", JSON.stringify(extractData));
        throw new Error("No content extracted from documents");
      }

      let parsedExtraction;
      try {
        const jsonMatch = extractContent.match(/```json\n([\s\S]*?)\n```/) || extractContent.match(/```\n([\s\S]*?)\n```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : extractContent;
        parsedExtraction = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("Failed to parse extraction response:", extractContent);
        parsedExtraction = {
          bulleted_specs: [],
          comprehensive_paragraph: extractContent
        };
      }

      return new Response(
        JSON.stringify({
          extracted_description: parsedExtraction.comprehensive_paragraph,
          bulleted_specs: parsedExtraction.bulleted_specs
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Original analysis mode
    let userPrompt = "";
    const parts: any[] = [];

    if (refine && queryId && answers) {
      userPrompt = `Previous analysis ID: ${queryId}

User has provided answers to clarifying questions:
${Object.entries(answers).map(([key, value]) => `${key}: ${value}`).join('\n')}

Please refine the previous analysis with these new details. Update price and lead time estimates based on the additional information. Indicate which fields changed and why.`;
      parts.push({ text: userPrompt });
    } else {
      if (fileUrls && fileUrls.length > 0) {
        if (description && description.trim()) {
          userPrompt = `IMPORTANT: You are analyzing a sourcing request that includes both a written description and technical document(s). The attached documents (technical drawings, datasheets, specifications) should be treated as the PRIMARY source of truth. If there are any contradictions between the written description and the documents, prioritize the specifications found in the documents.

User's written description:
${description}

Documents attached (see images/files below).

Task: Synthesize the information from both sources to create the most accurate cost estimate. Extract all technical specifications from the documents and combine them with any additional context from the written description. Provide realistic estimates for the Indian market.`;
        } else {
          userPrompt = `You are analyzing technical document(s) for a sourcing request. Extract all key technical specifications from the provided documents and use them to generate a comprehensive cost estimate.

Documents attached (see images/files below).

Task: Extract specifications and provide realistic estimates for the Indian market based solely on the document content.`;
        }

        parts.push({ text: userPrompt });

        for (const url of fileUrls) {
          const fileName = fileNames?.[fileUrls.indexOf(url)] || '';
          const fileExt = fileName.split('.').pop()?.toLowerCase();
          console.log('Processing file:', fileName, 'extension:', fileExt, 'url:', url);

          if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt || '')) {
            try {
              console.log('Fetching image from URL:', url);
              const response = await fetch(url);
              if (!response.ok) {
                console.error('Failed to fetch image:', response.status, response.statusText);
                throw new Error(`Failed to fetch image: ${response.statusText}`);
              }
              const arrayBuffer = await response.arrayBuffer();
              console.log('Image fetched, size:', arrayBuffer.byteLength);
              const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
              console.log('Image converted to base64, length:', base64.length);
              parts.push({
                inlineData: {
                  mimeType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
                  data: base64
                }
              });
            } catch (fetchError) {
              console.error('Error processing image:', fetchError);
              throw new Error(`Failed to process image ${fileName}: ${fetchError.message}`);
            }
          } else if (fileExt === 'pdf') {
            parts.push({ text: `PDF document attached: ${fileName} (URL: ${url})` });
          }
        }

        parts.push({ text: `\nMetadata: Quantity: ${quantity}, Priority: ${priority}, Currency: ${currency}` });
      } else {
        const structuredData = {
          user_description: description,
          metadata: { quantity, priority, currency },
        };

        userPrompt = `Analyze this sourcing request and provide structured output:

${JSON.stringify(structuredData, null, 2)}

Provide realistic estimates for the Indian market. Consider standard manufacturing processes, common suppliers, and current market conditions. Be specific about price ranges and lead times.`;
        parts.push({ text: userPrompt });
      }
    }

    console.log('Calling Gemini API');

    const response = await callGemini(GEMINI_API_KEY, parts, SYSTEM_PROMPT);

    console.log('Gemini API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      return geminiErrorResponse(response.status, errorText);
    }

    const data = await response.json();
    const content = extractGeminiText(data);

    if (!content) {
      console.error("No content in AI response:", JSON.stringify(data));
      throw new Error("No content in AI response");
    }

    let parsedResponse;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsedResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    parsedResponse.queryId = queryId || `q_${Date.now()}`;

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in sourcing-assistant:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
