"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useRouter, useSearchParams } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { t } = useLanguage();
  const params = useSearchParams();
  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [confirmPassword,setConfirmPassword] = useState("");
  const [verificationSent,setVerificationSent] = useState(false);
  const [show,setShow] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  async function submit(e:React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    if (mode === "register" && password !== confirmPassword) { setError("Passwords do not match."); setBusy(false); return; }
    try {
      const response = await fetch(`/api/auth/${mode}`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name,email,password,confirmPassword}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      if (mode === "register" && data.verificationRequired) { setVerificationSent(true); return; }
      const next = params.get("next") || (data.user?.role === "admin" ? "/admin" : "/account");
      router.push(next); router.refresh();
    } catch(err:any) { setError(err.message); } finally { setBusy(false); }
  }
  if (verificationSent) return <div className="auth-card verification-card"><div className="verification-icon"><CheckCircle2 size={30}/></div><span className="eyebrow">{t("emailVerificationTitle")}</span><h1>{t("emailVerificationTitle")}</h1><p>{t("emailVerificationDescription")}</p><div className="verification-email">{email}</div><button type="button" className="button button-outline button-wide" disabled={busy} onClick={async()=>{setBusy(true);setError("");try{const response=await fetch("/api/auth/resend-verification",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});const data=await response.json();if(!response.ok)throw new Error(data.error||t("verificationFailed"));setError(t("verificationSent"));}catch(err:any){setError(err.message||t("verificationFailed"));}finally{setBusy(false);}}}>{busy?t("pleaseWait"):t("resendVerification")}</button>{error&&<div className={error===t("verificationSent")?"form-success":"form-error"}>{error}</div>}<div className="auth-switch"><Link href="/login">{t("signIn")}</Link></div></div>;
  return <div className="auth-card"><div className="auth-logo"><span className="brand-mark">N</span></div><span className="eyebrow">{mode === "login" ? t("welcomeBack") : t("joinMarketplace")}</span><h1>{mode === "login" ? t("signInTitle") : t("createAccount")}</h1><p>{mode === "login" ? t("signInDescription") : t("registerDescription")}</p>
    <form onSubmit={submit} className="form-stack">
      {mode === "register" && <label className="field"><span>{t("fullName")}</span><div className="input-wrap"><UserRound size={17}/><input required minLength={2} value={name} onChange={e=>setName(e.target.value)} placeholder={t("yourName")}/></div></label>}
      <label className="field"><span>{t("emailAddress")}</span><div className="input-wrap"><Mail size={17}/><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div></label>
      <label className="field"><span>{t("password")}</span><div className="input-wrap"><LockKeyhole size={17}/><input type={show ? "text" : "password"} required minLength={mode==="register" ? 8 : 1} value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode==="register" ? t("passwordPlaceholder") : t("yourPassword")}/><button type="button" className="input-action" onClick={()=>setShow(!show)}>{show ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
      {mode === "register" && <label className="field"><span>{t("confirmPassword")}</span><div className="input-wrap"><LockKeyhole size={17}/><input type="password" required minLength={8} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder={t("confirmPasswordPlaceholder")}/></div></label>}\n      {error && <div className="form-error">{error}</div>}
      <button disabled={busy} className="button button-primary button-wide">{busy ? t("pleaseWait") : mode==="login" ? t("signIn") : t("createAccountButton")} <ArrowRight size={17}/></button>
    </form>
    <div className="auth-switch">{mode==="login" ? <><Link href="/forgot-password">{t("forgotPassword")}</Link><br/>{t("newHere")} <Link href="/register">{t("createAccount")}</Link></> : <>{t("alreadyHaveAccount")} <Link href="/login">{t("signIn")}</Link></>}</div>
    <div className="auth-safe"><LockKeyhole size={13}/> {t("protectedDetails")}</div>
  </div>;
}
