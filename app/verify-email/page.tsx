"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

function VerifyEmailContent() {
  const params = useSearchParams();
  const { t } = useLanguage();
  const requestedNext = params.get("next") || "";
  const safeNext = requestedNext.startsWith("/") && !requestedNext.startsWith("//") && !requestedNext.startsWith("/admin") ? requestedNext : "";
  const signInHref = safeNext ? `/login?next=${encodeURIComponent(safeNext)}` : "/login";
  const [status, setStatus] = useState<"loading"|"success"|"error">("loading");
  const [message, setMessage] = useState("Verifying your email address...");
  useEffect(() => {
    const token = params.get("token") || "";
    if (!token) { setStatus("error"); setMessage("This verification link is invalid or expired."); return; }
    fetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to verify this email."); return data; })
      .then(data => { setStatus("success"); setMessage(data.message || "Email verified. You can now sign in."); })
      .catch(error => { setStatus("error"); setMessage(error.message || "Unable to verify this email."); });
  }, [params]);
  return <main className="auth-page"><div className="auth-card verification-card"><div className={status==="success"?"verification-icon":"verification-icon verification-icon-neutral"}>{status==="loading"?<LoaderCircle className="spin" size={30}/>:status==="success"?<CheckCircle2 size={30}/>:<XCircle size={30}/>}</div><span className="eyebrow">{t("emailVerificationTitle")}</span><h1>{status==="success"?"Email verified":status==="error"?"Verification failed":"Please wait"}</h1><p>{message}</p>{status!=="loading"&&<Link href={signInHref} className="button button-primary button-wide">{t("signIn")}</Link>}</div></main>;
}
export default function VerifyEmailPage() {
  return <Suspense fallback={<main className="auth-page"><div className="loading-block"/></main>}><VerifyEmailContent/></Suspense>;
}
