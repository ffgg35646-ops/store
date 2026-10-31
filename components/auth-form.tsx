"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [show,setShow] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  async function submit(e:React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`/api/auth/${mode}`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name,email,password}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      const next = params.get("next") || (data.user?.role === "admin" ? "/admin" : "/account");
      router.push(next); router.refresh();
    } catch(err:any) { setError(err.message); } finally { setBusy(false); }
  }
  return <div className="auth-card"><div className="auth-logo"><span className="brand-mark">N</span></div><span className="eyebrow">{mode === "login" ? "WELCOME BACK" : "JOIN THE MARKETPLACE"}</span><h1>{mode === "login" ? "Sign in to your account" : "Create your account"}</h1><p>{mode === "login" ? "Access your orders, wallet and exclusive offers." : "A smarter way to shop for your digital essentials."}</p>
    <form onSubmit={submit} className="form-stack">
      {mode === "register" && <label className="field"><span>Full name</span><div className="input-wrap"><UserRound size={17}/><input required minLength={2} value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></div></label>}
      <label className="field"><span>Email address</span><div className="input-wrap"><Mail size={17}/><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div></label>
      <label className="field"><span>Password</span><div className="input-wrap"><LockKeyhole size={17}/><input type={show ? "text" : "password"} required minLength={mode==="register" ? 8 : 1} value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode==="register" ? "At least 8 characters" : "Your password"}/><button type="button" className="input-action" onClick={()=>setShow(!show)}>{show ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
      {error && <div className="form-error">{error}</div>}
      <button disabled={busy} className="button button-primary button-wide">{busy ? "Please wait..." : mode==="login" ? "Sign in" : "Create account"} <ArrowRight size={17}/></button>
    </form>
    <div className="auth-switch">{mode==="login" ? <>New here? <Link href="/register">Create an account</Link></> : <>Already have an account? <Link href="/login">Sign in</Link></>}</div>
    <div className="auth-safe"><LockKeyhole size={13}/> Your account details are protected.</div>
  </div>;
}
