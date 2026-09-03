import { NextRequest, NextResponse } from "next/server";

/**
 * PakGrid AI — Bill Doctor endpoint
 * Uses Alibaba Cloud Bailian API (Qwen) to analyse electricity bill
 * data and return structured AI prescriptions with savings estimates.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      monthlyBill,
      city = "Lahore",
      billBreakdown,
      acHours = 8,
      solar = false,
      battery = false,
    } = body as {
      monthlyBill: number;
      city?: string;
      billBreakdown?: { name: string; value: number }[];
      acHours?: number;
      solar?: boolean;
      battery?: boolean;
    };

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

    if (!monthlyBill || typeof monthlyBill !== "number" || monthlyBill <= 0) {
      return NextResponse.json(
        { error: "A valid monthly bill amount is required" },
        { status: 400 }
      );
    }

    const breakdownText =
      billBreakdown && billBreakdown.length > 0
        ? billBreakdown
            .map((b) => `${b.name}: Rs. ${b.value.toLocaleString()}`)
            .join(", ")
        : "No detailed breakdown provided — estimate based on typical Pakistani household patterns.";

    const systemPrompt = `You are PakGrid AI Bill Doctor — a specialized electricity bill diagnostician for Pakistani households. You were built for the Alibaba Cloud AI Hackathon 2026.

You MUST respond with valid JSON only — no markdown fences, no backticks, no extra text before or after the JSON. Use this exact schema:

{
  "prescriptions": [
    {
      "problem": "short description of the energy waste issue",
      "action": "specific actionable recommendation",
      "saving": <number — estimated monthly PKR savings, integer>,
      "confidence": <number 50-99 — AI confidence percentage>,
      "category": "cooling" | "lighting" | "standby" | "pumping" | "battery" | "general"
    }
  ],
  "analysis": "2-3 sentence overall diagnosis of the electricity bill health",
  "healthRating": "A+" | "A" | "B+" | "B" | "C" | "D"
}

Rules:
- Generate exactly 4-6 prescriptions sorted by saving (highest first)
- All savings must be realistic for Pakistani households (PKR context)
- Confidence scores should vary between 72 and 96
- Be specific — mention appliance names, time windows, and PKR amounts
- Consider city-specific tariff patterns (peak hours, off-peak windows)
- If solar is installed, include solar-aware recommendations
- If battery storage exists, include battery optimization advice`;

    const userPrompt = `Analyze this Pakistani household electricity bill:

- Monthly Bill: Rs. ${monthlyBill.toLocaleString()}
- City: ${city}
- AC Daily Usage: ${acHours} hours
- Solar Panels: ${solar ? "Installed" : "Not installed"}
- Battery Storage: ${battery ? "Installed" : "Not installed"}
- Cost Breakdown: ${breakdownText}

Generate AI-optimized prescriptions to reduce this bill. Return ONLY the JSON object.`;

    const response = await fetch(
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "qwen-plus",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text().catch(() => "Unknown error");
      throw new Error(`Bailian API ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    const content: string =
      data?.choices?.[0]?.message?.content ?? "";

    if (!content) {
      throw new Error("Empty response from AI model");
    }

    try {
      const cleaned = content
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);

      if (
        !parsed.prescriptions ||
        !Array.isArray(parsed.prescriptions) ||
        parsed.prescriptions.length === 0
      ) {
        throw new Error("Invalid prescriptions format from AI");
      }

      return NextResponse.json({
        success: true,
        prescriptions: parsed.prescriptions,
        analysis: parsed.analysis || "Analysis complete.",
        healthRating: parsed.healthRating || "B+",
      });
    } catch (parseError) {
      console.error("[Bill Doctor] JSON parse error:", parseError);
      return NextResponse.json(
        {
          success: true,
          prescriptions: [],
          analysis: content,
          healthRating: "B+",
          parseWarning: true,
        }
      );
    }
  } catch (error: unknown) {
    const errMsg =
      error instanceof Error ? error.message : "Unknown server error";
    console.error("[Bill Doctor API Error]", errMsg);
    return NextResponse.json(
      { error: "Failed to analyze bill", details: errMsg },
      { status: 500 }
    );
  }
}
