import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "node:crypto";
import nodemailer from "nodemailer";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/store";

type SmtpDiagnostic = {
  errorCode: string;
  status: number;
  missing?: string[];
};

function getSmtpConfiguration():
  | { ok: true; host: string; port: number; secure: boolean; user: string; password: string; from: string }
  | (SmtpDiagnostic & { ok: false }) {
  const required = ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"];
  const missing = required.filter((key) => !String(process.env[key] || "").trim());
  if (missing.length) return { ok: false, errorCode: "smtpConfigMissing", status: 503, missing };

  const host = String(process.env.SMTP_HOST).trim();
  const user = String(process.env.SMTP_USER).trim();
  const password = String(process.env.SMTP_PASSWORD);
  const from = String(process.env.SMTP_FROM).trim();
  const rawPort = String(process.env.SMTP_PORT || "587").trim();
  const port = Number(rawPort);
  const rawSecure = String(process.env.SMTP_SECURE || "false").trim().toLowerCase();

  if (
    !host ||
    /^(smtp|smtps):\/\//i.test(host) ||
    /\s/.test(host) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !["true", "false"].includes(rawSecure)
  ) {
    return { ok: false, errorCode: "smtpSettingsInvalid", status: 503 };
  }

  const fromAddress = (from.match(/<([^<>]+)>/)?.[1] || from).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromAddress)) {
    return { ok: false, errorCode: "smtpSenderRejected", status: 503 };
  }

  return { ok: true, host, port, secure: rawSecure === "true", user, password, from };
}

function diagnoseSmtpError(error: unknown, stage: "verify" | "send"): SmtpDiagnostic {
  const err = (error || {}) as {
    code?: string;
    command?: string;
    response?: string;
    responseCode?: number;
    message?: string;
  };
  const code = String(err.code || "").toUpperCase();
  const command = String(err.command || "").toUpperCase();
  const details = [err.message, err.response, err.command, err.responseCode]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    code === "EAUTH" ||
    /\b535\b|\b534\b|5\.7\.8|invalid login|authentication failed|username and password not accepted|application-specific password/i.test(details)
  ) {
    return { errorCode: "smtpAuthFailed", status: 502 };
  }

  if (
    stage === "send" &&
    (command.includes("MAIL FROM") || /sender address rejected|mail from address|not authorized to send as|unauthorized sender/i.test(details))
  ) {
    return { errorCode: "smtpSenderRejected", status: 502 };
  }

  if (
    stage === "send" &&
    (command.includes("RCPT TO") ||
      /recipient|mailbox|user unknown|no such user|unknown user|address rejected|invalid recipient|5\.1\.[01]/i.test(details) ||
      err.responseCode === 551 ||
      err.responseCode === 553)
  ) {
    return { errorCode: "smtpRecipientRejected", status: 422 };
  }

  if (/tls|ssl|certificate|handshake|wrong version number/i.test(details) || code.includes("TLS")) {
    return { errorCode: "smtpTlsFailed", status: 502 };
  }

  if (
    ["ENOTFOUND", "ECONNECTION", "ECONNREFUSED", "ETIMEDOUT", "ESOCKET", "EHOSTUNREACH", "EAI_AGAIN"].includes(code) ||
    /connection timeout|connect econn|getaddrinfo|socket hang up|connection refused/i.test(details)
  ) {
    return { errorCode: "smtpConnectionFailed", status: 502 };
  }

  return { errorCode: stage === "verify" ? "smtpVerifyFailed" : "smtpSendFailed", status: 502 };
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    if (await getCurrentUser()) {
      return NextResponse.json({ error: "Sign out of your current account before creating another account." }, { status: 409 });
    }

    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword || "");

    if (name.length < 2 || name.length > 80) return NextResponse.json({ error: "Enter a valid name." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    if (password !== confirmPassword) return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    if (await User.exists({ email })) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

    const smtp = getSmtpConfiguration();
    const isProduction = process.env.NODE_ENV === "production";
    if (!smtp.ok && isProduction) {
      return NextResponse.json(
        { errorCode: smtp.errorCode, ...(smtp.missing ? { missing: smtp.missing } : {}) },
        { status: smtp.status }
      );
    }

    const verificationToken = randomBytes(32).toString("hex");
    const base = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const requestedNext = String(body.next || "").trim();
    const safeNext = requestedNext.startsWith("/") && !requestedNext.startsWith("//") && !requestedNext.startsWith("/admin") ? requestedNext : "";
    const verifyUrl = `${base}/verify-email?token=${verificationToken}${safeNext ? `&next=${encodeURIComponent(safeNext)}` : ""}`;

    let transport: ReturnType<typeof nodemailer.createTransport> | null = null;
    if (smtp.ok) {
      transport = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: { user: smtp.user, pass: smtp.password },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        tls: { minVersion: "TLSv1.2" },
      });

      try {
        await transport.verify();
      } catch (mailError) {
        const diagnostic = diagnoseSmtpError(mailError, "verify");
        console.error("SMTP verification check failed", {
          code: (mailError as any)?.code,
          command: (mailError as any)?.command,
          responseCode: (mailError as any)?.responseCode,
          diagnostic: diagnostic.errorCode,
        });
        transport.close();
        return NextResponse.json({ errorCode: diagnostic.errorCode }, { status: diagnostic.status });
      }
    }

    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      emailVerified: false,
      emailVerificationTokenHash: createHash("sha256").update(verificationToken).digest("hex"),
      emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    if (transport && smtp.ok) {
      try {
        const info = await transport.sendMail({
          from: smtp.from,
          to: user.email,
          subject: "Verify your Nova Digital email",
          text: `Welcome to Nova Digital. Verify your email within 24 hours: ${verifyUrl}`,
          html: `<p>Welcome to Nova Digital, ${name.replace(/[<>]/g, "")}.</p><p>Verify your email address to activate your account.</p><p><a href="${verifyUrl}">Verify my email</a></p><p>This link expires in 24 hours.</p>`,
        });

        if (info.rejected?.length || !info.accepted?.length) {
          const rejectedError = Object.assign(new Error("Recipient rejected by SMTP server"), {
            code: "EENVELOPE",
            command: "RCPT TO",
            responseCode: 550,
          });
          throw rejectedError;
        }
      } catch (mailError) {
        const diagnostic = diagnoseSmtpError(mailError, "send");
        try {
          await User.deleteOne({ _id: user._id });
        } catch (cleanupError) {
          console.error("Could not remove unverified user after email failure", cleanupError);
        }
        console.error("Verification email could not be sent", {
          code: (mailError as any)?.code,
          command: (mailError as any)?.command,
          responseCode: (mailError as any)?.responseCode,
          diagnostic: diagnostic.errorCode,
        });
        return NextResponse.json({ errorCode: diagnostic.errorCode }, { status: diagnostic.status });
      } finally {
        transport.close();
      }
    } else {
      console.info("Development email verification URL:", verifyUrl);
    }

    try {
      await notify({
        userId: user._id,
        title: "Welcome to the store",
        body: "Your account is ready. Explore the catalog and discover digital essentials.",
        type: "system",
        href: "/account",
      });
    } catch (notificationError) {
      console.error("Could not create welcome notification", notificationError);
    }

    return NextResponse.json(
      { verificationRequired: true, email: user.email, message: "Check your email to verify and activate your account." },
      { status: 201 }
    );
  } catch (error) {
    console.error("register", error);
    return NextResponse.json({ error: "Unable to create your account." }, { status: 500 });
  }
}
