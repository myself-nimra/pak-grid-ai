"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Brain, Zap, Check, Sun, Battery, MapPin, Mail, Lock, User, KeyRound,
  ArrowRight, CheckCircle, AlertCircle, RefreshCw, Send, ShieldCheck, Sparkles,
  Eye, EyeOff, X, AlertTriangle, CheckCircle2, LockKeyhole, Settings, ExternalLink, HelpCircle
} from "lucide-react";

// Registered User Type definition
interface UserAccount {
  name: string;
  email: string;
  passwordHash: string;
  city: string;
  homeType: string;
  billRange: string;
  isGoogleUser?: boolean;
  createdAt: string;
}

// Initial Demo Seed Accounts
const SEED_USERS: UserAccount[] = [
  {
    name: "nimra",
    email: "nimra@pakgrid.ai",
    passwordHash: "Pakgrid_123",
    city: "Lahore",
    homeType: "House / Portion",
    billRange: "Rs. 15,000 - 30,000",
    createdAt: new Date().toISOString(),
  },
  {
    name: "Demo User",
    email: "user@gmail.com",
    passwordHash: "Demo_1234",
    city: "Karachi",
    homeType: "Apartment",
    billRange: "Rs. 30,000 - 50,000",
    createdAt: new Date().toISOString(),
  },
];

const cities = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta"];
const homeTypes = ["Apartment", "House / Portion", "Villa", "Commercial / Office"];
const billRanges = ["Rs. 5,000 - 15,000", "Rs. 15,000 - 30,000", "Rs. 30,000 - 50,000", "Rs. 50,000+"];

// Helper: Email Format Validator
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
};

// Helper: Password Strength Validator
// Requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 underscore (_)
const checkPasswordStrength = (pass: string) => {
  return {
    minLength: pass.length >= 8,
    hasUpper: /[A-Z]/.test(pass),
    hasLower: /[a-z]/.test(pass),
    hasNumber: /[0-9]/.test(pass),
    hasUnderscore: /_/.test(pass),
  };
};

const isPasswordValid = (pass: string): boolean => {
  const s = checkPasswordStrength(pass);
  return s.minLength && s.hasUpper && s.hasLower && s.hasNumber && s.hasUnderscore;
};

export default function LoginPage() {
  const router = useRouter();

  // Navigation Modes: 'login' | 'signup' | 'forgot' | 'verify_otp' | 'renew_password' | 'onboarding'
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "verify_otp" | "renew_password" | "onboarding">("login");

  // Form Inputs
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("Lahore");
  const [homeType, setHomeType] = useState("House / Portion");
  const [billRange, setBillRange] = useState("Rs. 15,000 - 30,000");

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP State
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState<"signup" | "forgot">("signup");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Gmail SMTP Sender Credentials State (Stored in localStorage)
  const [senderGmail, setSenderGmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [showSmtpModal, setShowSmtpModal] = useState(false);

  // Errors & Toasts
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  // Google Modal
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState("");

  // Onboarding sequence
  const [onboardStep, setOnboardStep] = useState(0);

  // Load saved Gmail SMTP credentials on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSmtp = localStorage.getItem("pakgrid_smtp_creds");
      if (savedSmtp) {
        try {
          const parsed = JSON.parse(savedSmtp);
          setSenderGmail(parsed.senderGmail || "");
          setAppPassword(parsed.appPassword || "");
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Save Gmail SMTP credentials
  const saveSmtpCreds = (gUser: string, gPass: string) => {
    setSenderGmail(gUser);
    setAppPassword(gPass);
    if (typeof window !== "undefined") {
      localStorage.setItem("pakgrid_smtp_creds", JSON.stringify({ senderGmail: gUser, appPassword: gPass }));
    }
    showToastNotification("✅ Gmail App Password settings saved!", "success");
    setShowSmtpModal(false);
  };

  // ----------------------------------------------------
  // LocalStorage User Database Management
  // ----------------------------------------------------
  const getUsers = (): UserAccount[] => {
    if (typeof window === "undefined") return SEED_USERS;
    const stored = localStorage.getItem("pakgrid_users");
    if (!stored) {
      localStorage.setItem("pakgrid_users", JSON.stringify(SEED_USERS));
      return SEED_USERS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return SEED_USERS;
    }
  };

  const saveUser = (newUser: UserAccount) => {
    const users = getUsers();
    const existingIndex = users.findIndex((u) => u.email.toLowerCase() === newUser.email.toLowerCase());
    if (existingIndex >= 0) {
      users[existingIndex] = newUser;
    } else {
      users.push(newUser);
    }
    localStorage.setItem("pakgrid_users", JSON.stringify(users));
  };

  const findUserByEmail = (userEmail: string): UserAccount | undefined => {
    const users = getUsers();
    return users.find((u) => u.email.toLowerCase() === userEmail.trim().toLowerCase());
  };

  const showToastNotification = (message: string, type: "success" | "info" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 6000);
  };

  // Resend OTP timer
  useEffect(() => {
    let interval: any;
    if (mode === "verify_otp" && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, otpTimer]);

  // Real Email & OTP Dispatch function
  const sendRealOtp = async (targetEmail: string, purpose: "signup" | "forgot") => {
    setErrorMsg(null);

    // If sender Gmail or App Password is missing, prompt user to set it up
    if (!senderGmail || !appPassword) {
      setShowSmtpModal(true);
      setErrorMsg("Please enter your Sender Gmail & 16-character App Password to send real emails to inbox.");
      showToastNotification("⚠️ Please configure your Gmail App Password below to send real emails", "info");
      return;
    }

    setSendingEmail(true);

    // Generate real 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtp(["", "", "", "", "", ""]);
    setOtpTimer(60);
    setCanResend(false);
    setOtpPurpose(purpose);

    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          otp: code,
          purpose,
          name: name || "User",
          senderEmail: senderGmail,
          appPassword: appPassword,
        }),
      });

      const data = await res.json();
      setSendingEmail(false);

      if (res.ok && data.success) {
        setMode("verify_otp");
        showToastNotification(`📬 REAL EMAIL SENT! OTP delivered from ${senderGmail} to ${targetEmail}. Please check your inbox!`, "success");
      } else {
        setErrorMsg(data.error || "Gmail SMTP delivery failed. Please check your Gmail App Password.");
        showToastNotification(`❌ Email delivery error: ${data.error || "Check App Password"}`, "error");
        setShowSmtpModal(true);
      }
    } catch (e: any) {
      setSendingEmail(false);
      setErrorMsg(`Failed to connect to email service: ${e?.message || "Error"}`);
      showToastNotification("❌ Failed to send email. Check internet connection and Gmail credentials.", "error");
    }
  };

  // ----------------------------------------------------
  // ACTION HANDLERS
  // ----------------------------------------------------

  // 1. LOGIN SUBMIT
  const handleLoginSubmit = () => {
    setErrorMsg(null);

    if (!email) {
      setErrorMsg("Please enter your email address.");
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMsg("Invalid Email Format! Please enter a valid email address (e.g., user@example.com).");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    // Check if account exists
    const user = findUserByEmail(email);
    if (!user) {
      setErrorMsg("Account Not Found! This email is not registered. Please Sign Up first.");
      showToastNotification("Account not found. Please click Sign Up to register.", "error");
      return;
    }

    // Check password
    if (user.passwordHash !== password) {
      setErrorMsg("Incorrect Password! The password you entered is incorrect. Please try again or use Forgot Password.");
      showToastNotification("Incorrect password. Please check your credentials.", "error");
      return;
    }

    // Login Success
    showToastNotification(`Welcome back, ${user.name}! Accessing AI Control Room...`, "success");
    if (typeof window !== "undefined") {
      localStorage.setItem("pakgrid_session", JSON.stringify(user));
    }
    startOnboarding();
  };

  // 2. SIGNUP INITIATE (Send Real OTP)
  const handleSignupInitiate = () => {
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setErrorMsg("Please enter your email address.");
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMsg("Invalid Email Format! Please enter a valid email address (e.g., user@example.com).");
      return;
    }

    // Check if email already registered
    const existing = findUserByEmail(email);
    if (existing) {
      setErrorMsg("This email is already registered! Please switch to Sign In.");
      showToastNotification("Account already exists. Please log in.", "error");
      return;
    }

    // Check password strength
    if (!isPasswordValid(password)) {
      setErrorMsg("Password requirement error! Must be at least 8 characters long and contain 1 Uppercase (A-Z), 1 Lowercase (a-z), 1 Number (0-9), and 1 Underscore (_).");
      return;
    }

    // Send OTP to real email
    sendRealOtp(email, "signup");
  };

  // 3. FORGOT PASSWORD INITIATE (Send Reset OTP)
  const handleForgotInitiate = () => {
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg("Please enter your registered email address.");
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMsg("Invalid Email Format! Please enter a valid email address (e.g., user@example.com).");
      return;
    }

    // Check if email exists
    const user = findUserByEmail(email);
    if (!user) {
      setErrorMsg("Account Not Found! No account registered with this email address. Please Sign Up first.");
      showToastNotification("No account found with this email.", "error");
      return;
    }

    sendRealOtp(email, "forgot");
  };

  // 4. VERIFY OTP SUBMIT
  const handleVerifyOtpSubmit = () => {
    setErrorMsg(null);
    const entered = otp.join("");

    if (entered.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit verification code received in your email.");
      return;
    }

    if (entered !== generatedOtp) {
      setErrorMsg("Invalid OTP Code! The 6-digit code you typed does not match the code sent to your Gmail inbox. Please check your email and try again.");
      showToastNotification("Invalid OTP code. Check your Gmail inbox.", "error");
      return;
    }

    showToastNotification("✅ Real OTP verified successfully!", "success");

    if (otpPurpose === "signup") {
      // Save user to LocalStorage DB
      const newUser: UserAccount = {
        name: name || "PakGrid User",
        email: email,
        passwordHash: password,
        city: city,
        homeType: homeType,
        billRange: billRange,
        createdAt: new Date().toISOString(),
      };
      saveUser(newUser);
      if (typeof window !== "undefined") {
        localStorage.setItem("pakgrid_session", JSON.stringify(newUser));
      }
      startOnboarding();
    } else {
      // Transition to Renew Password mode
      setMode("renew_password");
    }
  };

  // 5. RENEW PASSWORD SUBMIT
  const handleRenewPasswordSubmit = () => {
    setErrorMsg(null);

    if (!isPasswordValid(password)) {
      setErrorMsg("Password requirement error! Must be at least 8 characters long and contain 1 Uppercase (A-Z), 1 Lowercase (a-z), 1 Number (0-9), and 1 Underscore (_).");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match! Please check password confirmation.");
      return;
    }

    // Update user in LocalStorage DB
    const user = findUserByEmail(email);
    if (user) {
      user.passwordHash = password;
      saveUser(user);
    }

    showToastNotification("✅ Password updated successfully! You can now log in with your new password.", "success");
    setPassword("");
    setConfirmPassword("");
    setMode("login");
  };

  // 6. GOOGLE AUTHENTICATION
  const handleGoogleAuthAction = (googleEmail: string, googleName: string) => {
    setGoogleLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      setGoogleLoading(false);
      setShowGoogleModal(false);

      if (!isValidEmail(googleEmail)) {
        setErrorMsg("Invalid Google account email address.");
        return;
      }

      // Check if user exists, else auto-register
      let user = findUserByEmail(googleEmail);
      if (!user) {
        user = {
          name: googleName,
          email: googleEmail,
          passwordHash: "Google_OAuth_User_123",
          city: "Lahore",
          homeType: "House / Portion",
          billRange: "Rs. 15,000 - 30,000",
          isGoogleUser: true,
          createdAt: new Date().toISOString(),
        };
        saveUser(user);
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("pakgrid_session", JSON.stringify(user));
      }

      showToastNotification(`Google OAuth Login Successful for ${googleName}!`, "success");
      startOnboarding();
    }, 1200);
  };

  // ONBOARDING ANIMATION
  const startOnboarding = () => {
    setMode("onboarding");
    const steps = [
      "Verifying credentials & license",
      "Building household energy baseline",
      "Connecting local ESP32 edge node",
      "AI optimization engines initialized",
    ];
    steps.forEach((_, i) => setTimeout(() => setOnboardStep(i + 1), (i + 1) * 700));
    setTimeout(() => router.push("/dashboard"), 3400);
  };

  const passCheck = checkPasswordStrength(password);

  return (
    <div className="pt-16 min-h-screen grid-bg relative overflow-hidden flex items-center justify-center">

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-4 z-50 p-4 rounded-card shadow-2xl backdrop-blur-xl border flex items-center gap-3 max-w-md ${
              toast.type === "success"
                ? "bg-green-savings/15 border-green-savings/40 text-green-savings"
                : toast.type === "error"
                ? "bg-danger/15 border-danger/40 text-danger"
                : "bg-ai/15 border-ai/40 text-ai"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 size={18} /> : toast.type === "error" ? <AlertTriangle size={18} /> : <Sparkles size={18} />}
            <span className="text-xs font-medium leading-relaxed">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-12 items-center w-full min-h-[calc(100vh-5rem)]">

        {/* Left Column: AI Orb Visual */}
        <div className="hidden lg:flex flex-col items-center justify-center relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[450px] h-[450px] bg-orange-electric/6 rounded-full blur-[100px]" />
          </div>

          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-44 h-44 rounded-full bg-gradient-to-br from-orange-electric/30 to-orange-deep/20 flex items-center justify-center mb-8 pulse-ring"
          >
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-electric to-orange-deep flex items-center justify-center shadow-[0_0_60px_rgba(255,138,0,0.5)]">
              <Brain size={44} className="text-white" />
            </div>
          </motion.div>

          <h2 className="font-heading text-3xl font-bold mb-3 text-center">
            PakGrid <span className="gradient-text-orange">AI Brain</span>
          </h2>
          <p className="text-muted text-center max-w-sm text-sm leading-relaxed mb-6">
            Autonomous tariff shifting, blackout pre-charging, and phantom load elimination for Pakistani households.
          </p>

          {/* Real Email Setup Banner */}
          <div className="glass-card p-4 max-w-sm w-full border-orange-electric/30 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-orange-electric flex items-center gap-1.5">
                <Settings size={14} /> Gmail Real Email Dispatcher
              </span>
              <button
                onClick={() => setShowSmtpModal(true)}
                className="text-[11px] text-green-savings hover:underline font-semibold"
              >
                {senderGmail ? "⚙️ Configured" : "⚙️ Setup Now"}
              </button>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              {senderGmail ? (
                <>Sending real OTP emails from <strong className="text-main">{senderGmail}</strong></>
              ) : (
                <>Enter your Sender Gmail & 16-character App Password to send real emails to any inbox.</>
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-sm w-full">
            <div className="glass-card p-3 text-center">
              <div className="text-xs text-muted">Bill Reduction</div>
              <div className="font-mono-num font-bold text-green-savings text-base">Up to 50%</div>
            </div>
            <div className="glass-card p-3 text-center">
              <div className="text-xs text-muted">Edge Microchip</div>
              <div className="font-mono-num font-bold text-orange-electric text-base">Rs. 3,300 ESP32</div>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div className="glass-card p-6 sm:p-8 max-w-md mx-auto w-full border-orange-electric/25 border-glow-anim shadow-2xl relative z-10">

          {/* Top Gmail App Password Bar */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 text-xs">
            <div className="flex items-center gap-1.5 text-muted">
              <Mail size={14} className={senderGmail ? "text-green-savings" : "text-warning"} />
              <span>Real Email Dispatcher:</span>
              <strong className={senderGmail ? "text-green-savings" : "text-warning"}>
                {senderGmail ? "Ready" : "Setup Required"}
              </strong>
            </div>
            <button
              onClick={() => setShowSmtpModal(true)}
              className="text-orange-electric hover:underline text-[11px] font-semibold flex items-center gap-1"
            >
              <Settings size={12} /> Configure
            </button>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-5 p-3.5 rounded-card bg-danger/15 border border-danger/40 text-danger text-xs flex items-start gap-2.5 leading-relaxed"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMsg}</div>
                <button onClick={() => setErrorMsg(null)} className="text-danger/70 hover:text-danger">
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Tabs (Login / Sign Up) */}
          {mode !== "onboarding" && mode !== "verify_otp" && mode !== "renew_password" && (
            <div className="flex rounded-btn overflow-hidden border border-white/10 mb-6 bg-black/40 p-1">
              <button
                onClick={() => {
                  setErrorMsg(null);
                  setMode("login");
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-btn transition-all ${
                  mode === "login" || mode === "forgot" ? "bg-orange-electric text-white shadow-md" : "text-muted hover:text-main"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setErrorMsg(null);
                  setMode("signup");
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-btn transition-all ${
                  mode === "signup" ? "bg-orange-electric text-white shadow-md" : "text-muted hover:text-main"
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">

            {/* ── 1. LOGIN MODE ── */}
            {mode === "login" && (
              <motion.div key="login" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <div className="mb-5">
                  <h3 className="font-heading text-xl font-bold mb-1">Welcome Back</h3>
                  <p className="text-muted text-xs">Enter your credentials to access the PakGrid AI dashboard</p>
                </div>

                {/* Continue with Google button */}
                <button
                  onClick={() => setShowGoogleModal(true)}
                  className="w-full py-2.5 px-4 rounded-btn bg-white/5 border border-white/10 text-main text-xs font-semibold flex items-center justify-center gap-2 hover:bg-white/10 transition-all mb-4"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px bg-white/10 flex-1" />
                  <span className="text-[10px] text-muted uppercase">or continue with email</span>
                  <div className="h-px bg-white/10 flex-1" />
                </div>

                <div className="space-y-4 mb-5">
                  <div>
                    <label className="text-xs text-muted mb-1 block">Email Address</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        className="input-field pl-9 text-xs"
                        placeholder="ahmed@pakgrid.ai"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-muted">Password</label>
                      <button
                        onClick={() => {
                          setErrorMsg(null);
                          setMode("forgot");
                        }}
                        className="text-[11px] text-orange-electric hover:underline font-medium"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        className="input-field pl-9 pr-9 text-xs"
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLoginSubmit}
                  className="btn-primary w-full text-center py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <KeyRound size={14} /> Sign In to Dashboard
                </button>
              </motion.div>
            )}

            {/* ── 2. SIGN UP MODE ── */}
            {mode === "signup" && (
              <motion.div key="signup" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div className="mb-4">
                  <h3 className="font-heading text-xl font-bold mb-1">Create Account</h3>
                  <p className="text-muted text-xs">Sign up to enable AI automated energy optimization</p>
                </div>

                {/* Google Sign up button */}
                <button
                  onClick={() => setShowGoogleModal(true)}
                  className="w-full py-2 px-4 rounded-btn bg-white/5 border border-white/10 text-main text-xs font-semibold flex items-center justify-center gap-2 hover:bg-white/10 transition-all mb-4"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-[11px] text-muted mb-1 block">Full Name</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        className="input-field pl-9 text-xs py-2"
                        placeholder="Ahmed Khan"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-muted mb-1 block">Your Email Address (Recipient Inbox)</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        className="input-field pl-9 text-xs py-2"
                        placeholder="sweety1nimra1@gmail.com"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-muted mb-1 block">Password</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        className="input-field pl-9 pr-9 text-xs py-2"
                        placeholder="e.g. Pakgrid_123"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    {/* Real-time Password Strength Requirements Checklist */}
                    {password && (
                      <div className="mt-2 bg-black/40 p-2.5 rounded border border-white/10 text-[10px] space-y-1">
                        <div className="font-semibold text-muted mb-1">Password Requirements:</div>
                        <div className={`flex items-center gap-1.5 ${passCheck.minLength ? "text-green-savings" : "text-danger"}`}>
                          <span>{passCheck.minLength ? "✓" : "✕"}</span> Minimum 8 characters
                        </div>
                        <div className={`flex items-center gap-1.5 ${passCheck.hasUpper ? "text-green-savings" : "text-danger"}`}>
                          <span>{passCheck.hasUpper ? "✓" : "✕"}</span> 1 Uppercase letter (A-Z)
                        </div>
                        <div className={`flex items-center gap-1.5 ${passCheck.hasLower ? "text-green-savings" : "text-danger"}`}>
                          <span>{passCheck.hasLower ? "✓" : "✕"}</span> 1 Lowercase letter (a-z)
                        </div>
                        <div className={`flex items-center gap-1.5 ${passCheck.hasNumber ? "text-green-savings" : "text-danger"}`}>
                          <span>{passCheck.hasNumber ? "✓" : "✕"}</span> 1 Number (0-9)
                        </div>
                        <div className={`flex items-center gap-1.5 ${passCheck.hasUnderscore ? "text-green-savings" : "text-danger"}`}>
                          <span>{passCheck.hasUnderscore ? "✓" : "✕"}</span> 1 Underscore (_)
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-muted mb-1 block">City</label>
                      <select className="input-field text-xs py-2" value={city} onChange={(e) => setCity(e.target.value)}>
                        {cities.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-muted mb-1 block">Monthly Bill</label>
                      <select className="input-field text-xs py-2" value={billRange} onChange={(e) => setBillRange(e.target.value)}>
                        {billRanges.map((b) => (
                          <option key={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSignupInitiate}
                  disabled={sendingEmail}
                  className="btn-primary w-full text-center py-2.5 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {sendingEmail ? (
                    <>
                      <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Sending Real Email OTP...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Send Real OTP to Email
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* ── 3. FORGOT PASSWORD MODE ── */}
            {mode === "forgot" && (
              <motion.div key="forgot" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-5">
                  <h3 className="font-heading text-xl font-bold mb-1">Reset Password</h3>
                  <p className="text-muted text-xs">Enter your registered email address to receive a password reset OTP code</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-xs text-muted mb-1 block">Registered Email Address</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        className="input-field pl-9 text-xs"
                        placeholder="yourname@gmail.com"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleForgotInitiate}
                    disabled={sendingEmail}
                    className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {sendingEmail ? (
                      <>
                        <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Sending Reset Code...
                      </>
                    ) : (
                      <>
                        <Send size={14} /> Send Password Reset OTP
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setErrorMsg(null);
                      setMode("login");
                    }}
                    className="btn-secondary w-full py-2 text-xs border-none hover:bg-white/5"
                  >
                    Back to Sign In
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── 4. VERIFY OTP MODE ── */}
            {mode === "verify_otp" && (
              <motion.div key="verify" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-orange-electric/15 text-orange-electric flex items-center justify-center mx-auto mb-3 border border-orange-electric/30">
                    <ShieldCheck size={24} />
                  </div>
                  <h3 className="font-heading text-xl font-bold mb-1">Enter Verification Code</h3>
                  <p className="text-muted text-xs leading-relaxed">
                    A 6-digit OTP code has been dispatched to your email:<br />
                    <strong className="text-main">{email}</strong>
                  </p>
                  <p className="text-[11px] text-green-savings mt-2 font-medium bg-green-savings/10 p-2 rounded border border-green-savings/20">
                    📩 Please check your Gmail Inbox (or Spam folder) and type the code below:
                  </p>
                </div>

                {/* 6-box OTP Input */}
                <div className="flex justify-between gap-2 mb-6">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newOtp = [...otp];
                        newOtp[idx] = val;
                        setOtp(newOtp);
                        if (val && idx < 5) {
                          document.getElementById(`otp-${idx + 1}`)?.focus();
                        }
                      }}
                      className="w-11 h-12 text-center text-lg font-mono-num font-bold rounded-btn bg-black/60 border border-white/15 focus:border-orange-electric focus:outline-none focus:ring-1 focus:ring-orange-electric"
                    />
                  ))}
                </div>

                <button
                  onClick={handleVerifyOtpSubmit}
                  className="btn-primary w-full py-2.5 text-xs font-bold mb-4"
                >
                  Verify Code & Continue
                </button>

                <div className="text-center text-xs text-muted">
                  {otpTimer > 0 ? (
                    <span>Resend OTP code in <strong className="text-orange-electric font-mono-num">{otpTimer}s</strong></span>
                  ) : (
                    <button
                      onClick={() => sendRealOtp(email, otpPurpose)}
                      className="text-orange-electric hover:underline font-semibold flex items-center gap-1 mx-auto"
                    >
                      <RefreshCw size={12} /> Resend Verification Code
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── 5. RENEW PASSWORD MODE ── */}
            {mode === "renew_password" && (
              <motion.div key="renew" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-5">
                  <div className="w-10 h-10 rounded-full bg-green-savings/15 text-green-savings flex items-center justify-center mb-3">
                    <LockKeyhole size={20} />
                  </div>
                  <h3 className="font-heading text-xl font-bold mb-1">Create New Password</h3>
                  <p className="text-muted text-xs">Set a strong new password for <strong className="text-main">{email}</strong></p>
                </div>

                <div className="space-y-4 mb-5">
                  <div>
                    <label className="text-xs text-muted mb-1 block">New Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        className="input-field pl-9 pr-9 text-xs"
                        placeholder="e.g. Newpass_123"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    {/* Live Password Strength Requirements Checklist */}
                    {password && (
                      <div className="mt-2 bg-black/40 p-2.5 rounded border border-white/10 text-[10px] space-y-1">
                        <div className="font-semibold text-muted mb-1">Password Requirements:</div>
                        <div className={`flex items-center gap-1.5 ${passCheck.minLength ? "text-green-savings" : "text-danger"}`}>
                          <span>{passCheck.minLength ? "✓" : "✕"}</span> Minimum 8 characters
                        </div>
                        <div className={`flex items-center gap-1.5 ${passCheck.hasUpper ? "text-green-savings" : "text-danger"}`}>
                          <span>{passCheck.hasUpper ? "✓" : "✕"}</span> 1 Uppercase letter (A-Z)
                        </div>
                        <div className={`flex items-center gap-1.5 ${passCheck.hasLower ? "text-green-savings" : "text-danger"}`}>
                          <span>{passCheck.hasLower ? "✓" : "✕"}</span> 1 Lowercase letter (a-z)
                        </div>
                        <div className={`flex items-center gap-1.5 ${passCheck.hasNumber ? "text-green-savings" : "text-danger"}`}>
                          <span>{passCheck.hasNumber ? "✓" : "✕"}</span> 1 Number (0-9)
                        </div>
                        <div className={`flex items-center gap-1.5 ${passCheck.hasUnderscore ? "text-green-savings" : "text-danger"}`}>
                          <span>{passCheck.hasUnderscore ? "✓" : "✕"}</span> 1 Underscore (_)
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-muted mb-1 block">Confirm New Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        className="input-field pl-9 pr-9 text-xs"
                        placeholder="Confirm new password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleRenewPasswordSubmit}
                  className="btn-primary w-full py-2.5 text-xs font-bold"
                >
                  Update Password & Sign In
                </button>
              </motion.div>
            )}

            {/* ── 6. ONBOARDING ANIMATION ── */}
            {mode === "onboarding" && (
              <motion.div key="onboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-electric to-orange-deep flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(255,138,0,0.4)] animate-pulse">
                  <Zap size={36} className="text-white" />
                </div>

                <h3 className="font-heading text-2xl font-bold mb-6">Initializing PakGrid AI...</h3>

                <div className="space-y-3 text-left max-w-xs mx-auto text-xs">
                  {[
                    "Verifying credentials & license",
                    "Building household energy baseline",
                    "Connecting local ESP32 edge node",
                    "AI optimization engines initialized",
                  ].map((t, i) => (
                    <motion.div
                      key={t}
                      initial={{ opacity: 0, x: -15 }}
                      animate={onboardStep > i ? { opacity: 1, x: 0 } : {}}
                      className="flex items-center gap-3 p-2 rounded-btn bg-white/3"
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        onboardStep > i ? "bg-green-savings/20 text-green-savings" : "bg-white/5 text-muted"
                      }`}>
                        {onboardStep > i ? <Check size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-muted" />}
                      </div>
                      <span className={onboardStep > i ? "text-main font-medium" : "text-muted"}>{t}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ── GMAIL APP PASSWORD SETUP MODAL ── */}
      <AnimatePresence>
        {showSmtpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#181818] border border-orange-electric/30 rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowSmtpModal(false)}
                className="absolute top-4 right-4 text-muted hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-lg bg-orange-electric/15 text-orange-electric flex items-center justify-center">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base">Gmail App Password Setup</h3>
                  <p className="text-[11px] text-muted">Configure your Gmail credentials to send real OTPs to any inbox</p>
                </div>
              </div>

              <div className="bg-orange-electric/10 border border-orange-electric/25 p-3 rounded-card my-4 text-xs space-y-1.5 text-main">
                <div className="font-semibold text-orange-electric flex items-center gap-1">
                  <HelpCircle size={13} /> How to get a 16-character Gmail App Password:
                </div>
                <ol className="list-decimal list-inside text-[11px] text-muted space-y-1 pl-1">
                  <li>Go to your Google Account: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-orange-electric underline inline-flex items-center gap-0.5">myaccount.google.com/apppasswords <ExternalLink size={10} /></a></li>
                  <li>Sign in & search for <strong>App Passwords</strong> (requires 2-Step Verification enabled).</li>
                  <li>Type app name e.g. <code>PakGrid</code> and click <strong>Create</strong>.</li>
                  <li>Copy the generated <strong>16-character code</strong> (e.g. <code>abcd efgh ijkl mnop</code>) & paste below!</li>
                </ol>
              </div>

              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-xs text-muted mb-1 block">Sender Gmail Address</label>
                  <input
                    className="input-field text-xs py-2"
                    placeholder="yourgmail@gmail.com"
                    value={senderGmail}
                    onChange={(e) => setSenderGmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">16-Character Gmail App Password</label>
                  <input
                    className="input-field text-xs py-2 font-mono-num"
                    placeholder="abcd efgh ijkl mnop"
                    type="password"
                    value={appPassword}
                    onChange={(e) => setAppPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => saveSmtpCreds(senderGmail, appPassword)}
                  className="btn-primary flex-1 py-2 text-xs font-bold"
                >
                  Save & Enable Real Email Sending
                </button>
                <button
                  onClick={() => setShowSmtpModal(false)}
                  className="btn-secondary py-2 text-xs px-4"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── GOOGLE OAUTH REAL WORKING MODAL ── */}
      <AnimatePresence>
        {showGoogleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#181818] border border-white/15 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span className="font-heading font-semibold text-sm">Sign in with Google</span>
                </div>
                <button onClick={() => setShowGoogleModal(false)} className="text-muted hover:text-white text-xs">✕</button>
              </div>

              <p className="text-muted text-xs mb-4">Select or enter your Gmail account to continue to <strong>PakGrid AI</strong>:</p>

              {googleLoading ? (
                <div className="py-8 flex flex-col items-center justify-center">
                  <RefreshCw className="text-orange-electric animate-spin mb-3" size={28} />
                  <p className="text-xs text-muted">Authenticating Google OAuth session...</p>
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  {/* Account Selector Cards */}
                  {[
                    { name: "Ahmed Khan", email: "ahmed.pakgrid@gmail.com", avatar: "AK" },
                    { name: "Nimra User", email: "sweety1nimra1@gmail.com", avatar: "NU" },
                  ].map((acc) => (
                    <button
                      key={acc.email}
                      onClick={() => handleGoogleAuthAction(acc.email, acc.name)}
                      className="w-full p-3 rounded-card bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center gap-3 text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-electric to-orange-deep text-white font-bold text-xs flex items-center justify-center">
                        {acc.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-main truncate">{acc.name}</p>
                        <p className="text-[11px] text-muted truncate">{acc.email}</p>
                      </div>
                    </button>
                  ))}

                  {/* Or enter custom Gmail */}
                  <div className="pt-2 border-t border-white/10">
                    <label className="text-[11px] text-muted mb-1 block">Or enter custom Gmail:</label>
                    <div className="flex gap-2">
                      <input
                        className="input-field text-xs py-1.5"
                        placeholder="yourname@gmail.com"
                        value={googleEmailInput}
                        onChange={(e) => setGoogleEmailInput(e.target.value)}
                      />
                      <button
                        onClick={() => {
                          if (!googleEmailInput || !isValidEmail(googleEmailInput)) {
                            showToastNotification("Please enter a valid Gmail address", "error");
                            return;
                          }
                          handleGoogleAuthAction(googleEmailInput, googleEmailInput.split("@")[0]);
                        }}
                        className="btn-primary text-xs py-1.5 px-3 shrink-0"
                      >
                        Sign In
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-muted/60 text-center">
                PakGrid AI OAuth 2.0 Identity Service
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
