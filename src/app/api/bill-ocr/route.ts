import { NextRequest, NextResponse } from "next/server";

/**
 * PakGrid AI — Bill OCR endpoint
 * Uses Alibaba Cloud Bailian Qwen-VL (Vision) to extract
 * structured bill data from uploaded electricity bill images.
 */
export async function POST(req: NextRequest) {
  try {
    const { imageData, mimeType } = await req.json();

    const apiKey = process.env.ALIBABA_CLOUD_API_KEY;

    if (!apiKey || apiKey === "your_bailian_api_key_here") {
      return NextResponse.json(
        {
          success: false,
          error:
            "AI service not configured. Add ALIBABA_CLOUD_API_KEY to .env.local. Get a free key at https://bailian.console.aliyun.com/",
        },
        { status: 503 }
      );
    }

    if (!imageData) {
      return NextResponse.json(
        { error: "No image data provided" },
        { status: 400 }
      );
    }

    if (!imageData.startsWith("data:")) {
      return NextResponse.json(
        { error: "Invalid image data format" },
        { status: 400 }
      );
    }

    const isImage = mimeType?.startsWith("image/");
    if (!isImage) {
      return NextResponse.json(
        { error: "Only image files (JPG, PNG, WEBP) are supported for OCR" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are PakGrid AI Bill Scanner — an OCR specialist for Pakistani electricity bills (LESCO, IESCO, MEPCO, FESCO, HESCO, SEPCO, PESCO, QESCO, TESCO, K-Electric).

Extract the following from the bill image and respond with VALID JSON only (no markdown fences, no extra text):

{
  "fields": [
    { "label": "Provider / DISCO Name", "value": "<extracted text>" },
    { "label": "Total Amount (PKR)", "value": "<number only>" },
    { "label": "Due Date", "value": "<DD/MM/YYYY>" },
    { "label": "Bill Month", "value": "<e.g. August 2026>" },
    { "label": "Consumer Name", "value": "<extracted text>" },
    { "label": "Consumer ID / Reference", "value": "<extracted text>" },
    { "label": "Units Consumed (kWh)", "value": "<number>" },
    { "label": "Tariff Category", "value": "<e.g. Residential A-1>" },
    { "label": "Previous Reading", "value": "<number>" },
    { "label": "Current Reading", "value": "<number>" }
  ],
  "confidence": <overall confidence 0-100>
}

Rules:
- If a field is not visible, set value to ""
- Extract numbers without commas or currency symbols
- Convert dates to DD/MM/YYYY format
- Be precise with Pakistani bill terminology`;

    const response = await fetch(
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "qwen-vl-plus",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: imageData },
                },
                {
                  type: "text",
                  text: "Extract all visible electricity bill details from this image. Return ONLY valid JSON.",
                },
              ],
            },
          ],
          temperature: 0.2,
          max_tokens: 1500,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Bailian API ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          error: "OCR could not extract text from this image. Please try a clearer photo or enter details manually.",
          fallback: true,
        },
        { status: 422 }
      );
    }

    try {
      const cleaned = content
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);

      if (!parsed.fields || !Array.isArray(parsed.fields)) {
        throw new Error("Invalid fields format from OCR");
      }

      return NextResponse.json({
        success: true,
        fields: parsed.fields,
        confidence: parsed.confidence || 85,
      });
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to parse extracted data. Switching to manual entry mode.",
          fallback: true,
          rawContent: content,
        },
        { status: 422 }
      );
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Bill OCR API Error]", errMsg);
    return NextResponse.json(
      { error: "OCR extraction failed", details: errMsg },
      { status: 500 }
    );
  }
}
