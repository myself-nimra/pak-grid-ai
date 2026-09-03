import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, otp, purpose, senderEmail, appPassword } = body;

    if (!email || !otp) {
      return NextResponse.json({ error: "Recipient email and OTP code are required." }, { status: 400 });
    }

    const recipientEmail = email.trim();

    // Determine Gmail Sender Credentials
    // Priority: 1) Body parameter (senderEmail/appPassword), 2) Environment variables
    const gmailUser = (senderEmail || process.env.GMAIL_USER || process.env.SMTP_USER || "").trim();
    const gmailPass = (appPassword || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || "").replace(/\s+/g, "");

    const emailSubject = purpose === "forgot"
      ? `🔐 ${otp} is your PakGrid AI Password Reset Code`
      : `⚡ ${otp} is your PakGrid AI Verification Code`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; background: #0c0c0c; color: #f8fafc; border: 1px solid #ff8a0044; border-radius: 12px; padding: 30px;">
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="color: #ff8a00; margin: 0; font-size: 26px; font-weight: bold;">PakGrid <span style="color: #ffffff;">AI</span></h2>
          <p style="color: #a3a3a3; font-size: 13px; margin-top: 5px;">Next-Gen Energy Management & Automated Bill Reduction</p>
        </div>

        <div style="background: #171717; border-radius: 10px; padding: 25px; text-align: center; border: 1px solid #333333;">
          <p style="color: #e2e8f0; font-size: 14px; margin-top: 0;">
            ${purpose === "forgot" ? "We received a request to reset your PakGrid AI account password." : "Welcome to PakGrid AI! Complete your account registration."}
          </p>
          <p style="color: #a3a3a3; font-size: 13px;">Your 6-digit email verification code is:</p>
          
          <div style="background: #030303; border: 2px dashed #16f08b; border-radius: 8px; padding: 18px; margin: 20px 0;">
            <span style="font-family: 'Courier New', monospace; font-size: 34px; font-weight: bold; letter-spacing: 8px; color: #16f08b;">
              ${otp}
            </span>
          </div>

          <p style="color: #a3a3a3; font-size: 12px; margin-bottom: 0;">
            This code will expire in 10 minutes. Please do not share this code with anyone.
          </p>
        </div>

        <div style="margin-top: 25px; border-top: 1px solid #222222; padding-top: 15px; text-align: center; font-size: 11px; color: #666666;">
          <p style="margin: 4px 0;">PakGrid AI — Intelligent Local Power Grid Controller</p>
          <p style="margin: 4px 0;">If you did not request this verification code, please disregard this email.</p>
        </div>
      </div>
    `;

    // If Gmail credentials are available, send via Gmail SMTP using Nodemailer
    if (gmailUser && gmailPass) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: gmailUser,
            pass: gmailPass,
          },
        });

        const info = await transporter.sendMail({
          from: `"PakGrid AI Security" <${gmailUser}>`,
          to: recipientEmail,
          subject: emailSubject,
          html: htmlContent,
        });

        console.log(`[PakGrid Gmail SMTP Success] Sent OTP ${otp} to ${recipientEmail} via ${gmailUser}. MessageID: ${info.messageId}`);

        return NextResponse.json({
          success: true,
          delivered: true,
          method: "Gmail SMTP",
          sender: gmailUser,
          recipient: recipientEmail,
          messageId: info.messageId,
          timestamp: new Date().toISOString(),
        });
      } catch (gmailErr: any) {
        console.error("[PakGrid Gmail SMTP Error]:", gmailErr);
        return NextResponse.json(
          {
            error: `Gmail SMTP delivery failed: ${gmailErr?.message || "Invalid Gmail App Password"}`,
            details: "Please verify your Gmail address and 16-character App Password.",
          },
          { status: 500 }
        );
      }
    }

    // If credentials are not provided yet, notify the user with clear instructions
    console.warn(`[PakGrid Real Email Notice] No Gmail App Password provided for sending to ${recipientEmail}`);

    return NextResponse.json({
      success: false,
      delivered: false,
      error: "Gmail App Password required to send real emails to inbox.",
      instructions: "Please enter your Sender Gmail & 16-character App Password in the Login Page Email Setup box or .env.local file.",
      recipient: recipientEmail,
      otp: otp,
    });
  } catch (error: any) {
    console.error("[OTP API Error]:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
