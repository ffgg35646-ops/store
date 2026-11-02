"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "فشل تسجيل دخول الإدارة.");
      const next = params.get("next");
      router.replace(next?.startsWith("/admin/") ? next : "/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر تسجيل الدخول.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card admin-auth-card" dir="rtl">
      <div className="auth-logo"><span className="brand-mark">N</span></div>
      <span className="eyebrow">NOVA DIGITAL · دخول آمن</span>
      <h1>تسجيل دخول الإدارة</h1>
      <p>سجّل الدخول بحساب الإدارة لإدارة المنتجات والعملاء والخصومات.</p>
      <form onSubmit={submit} className="form-stack">
        <label className="field"><span>البريد الإلكتروني للإدارة</span><div className="input-wrap"><Mail size={17}/><input type="email" autoComplete="username" required value={email} onChange={event=>setEmail(event.target.value)} placeholder="admin@example.com"/></div></label>
        <label className="field"><span>كلمة المرور</span><div className="input-wrap"><LockKeyhole size={17}/><input type={showPassword?"text":"password"} autoComplete="current-password" required value={password} onChange={event=>setPassword(event.target.value)} placeholder="أدخل كلمة المرور"/><button type="button" className="input-action" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword?"إخفاء كلمة المرور":"إظهار كلمة المرور"}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
        {error&&<div className="form-error">{error}</div>}
        <button disabled={busy} className="button button-primary button-wide">{busy?"جارٍ تسجيل الدخول...":"دخول لوحة التحكم"} <ArrowRight size={17}/></button>
      </form>
      <div className="auth-safe"><ShieldCheck size={14}/> Administrator-only access</div>
      <div className="auth-switch"><Link href="/">العودة إلى المتجر</Link></div>
    </div>
  );
}
