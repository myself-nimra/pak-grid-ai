import { NextRequest, NextResponse } from "next/server";

/**
 * PakGrid AI — AI Agent endpoint
 * Connects to Alibaba Cloud Bailian API (Qwen / Tongyi Qianwen)
 * to generate intelligent energy optimization reasoning.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      history = [],
      applianceContext = "",
    } = body as {
      message: string;
      history?: { role: string; content: string }[];
      applianceContext?: string;
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

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are PakGrid AI, an expert energy optimization assistant designed specifically for Pakistani households. You were built for the Alibaba Cloud AI Hackathon 2026.

Your expertise includes:
- Pakistani electricity tariff structures (peak vs off-peak rates, TOU billing)
- Load-shedding / blackout prediction and battery management
- Appliance-level energy optimization (AC, water pump, refrigerator, fans, TV, etc.)
- Phantom / standby load detection and elimination strategies
- Solar panel and battery storage optimization for residential setups
- ESP32 edge computing for real-time appliance relay control
- Cost savings calculation in Pakistani Rupees (PKR)

Key facts about Pakistan's electricity:
- Peak tariff hours are typically 5 PM to 9 PM (varies by city: LESCO, K-Electric, IESCO, etc.)
- Peak rates can reach PKR 55-60 per unit; off-peak is significantly cheaper
- Load-shedding is common, especially in summer (May-September)
- Average household monthly bill ranges from PKR 15,000 to 50,000+
- Phantom/standby loads waste 10-15% of the bill

Always be concise, practical, and data-driven. When relevant, quantify savings in PKR with realistic estimates. Format key numbers and terms in **bold** for readability. Keep responses under 200 words unless the user asks for detailed analysis.`;

    const messages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    if (applianceContext) {
      messages.push({
        role: "system",
        content: `Current household sensor data:\n${applianceContext}`,
      });
    }

    const validHistory = history.filter(
      (h) =>
        h &&
        typeof h.role === "string" &&
        typeof h.content === "string" &&
        ["user", "assistant"].includes(h.role)
    );
    messages.push(...validHistory.slice(-10));
    messages.push({ role: "user", content: message.trim() });

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
          messages,
          temperature: 0.7,
          max_tokens: 1200,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text().catch(() => "Unknown error");
      throw new Error(`Bailian API ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    const content: string =
      data?.choices?.[0]?.message?.content ?? "No response from AI model.";

    return NextResponse.json({ success: true, content });
  } catch (error: unknown) {
    const errMsg =
      error instanceof Error ? error.message : "Unknown server error";
    console.error("[AI Agent API Error]", errMsg);

    const isModelError =
      errMsg.includes("model") || errMsg.includes("Model");
    return NextResponse.json(
      {
        error: "Failed to generate AI response",
        details: errMsg,
        hint: isModelError
          ? "Try checking available models at Bailian console. Common models: qwen-plus, qwen-turbo, qwen-max"
          : undefined,
      },
      { status: 500 }
    );
  }
}
