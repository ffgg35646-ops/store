"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, KeyRound, Mail, LockKeyhole } from "lucide-react";
export function PasswordResetForm({mode}:{mode:"forgot"|"reset"}){
 const params=useSearchParams(),router=useRouter(),token=params.get("token")||"";
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[confirm,setConfirm]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage("");setError("");try{
  if(mode==="reset"&&password!==confirm)throw new Error("The passwords do not match.");
  const response=await fetch(mode==="forgot"?"/api/auth/forgot-password":"/api/auth/reset-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(mode==="forgot"?{email}:{token,password})});
  const data=await response.json();if(!response.ok)throw new Error(data.error||"Unable to process this request.");
  setMessage(data.message||(mode==="forgot"?"If an active account exists, reset instructions will be sent.":"Password updated."));
  if(mode==="reset")setTimeout(()=>router.push("/login"),1200);
 }catch(err:any){setError(err.message||"Unable to process this request.");}finally{setBusy(false);}}
 return <main className="auth-page"><section className="auth-card"><div className="auth-logo"><span className="brand-mark">{mode==="forgot"?<Mail size={20}/>:<KeyRound size={20}/>}</span></div><span className="eyebrow">ACCOUNT RECOVERY</span><h1>{mode==="forgot"?"Reset your password":"Choose a new password"}</h1><p>{mode==="forgot"?"Enter the email address linked to your account. If it exists, we’ll send a secure reset link.":"Your reset link is time-limited and can only be used once."}</p><form className="form-stack" onSubmit={submit}>
 {mode==="forgot"?<label className="field"><span>Email address</span><div className="input-wrap"><Mail size={17}/><input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div></label>:<>{!token&&<div className="form-error">The reset token is missing. Request a new password reset link.</div>}<label className="field"><span>New password</span><div className="input-wrap"><LockKeyhole size={17}/><input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></div></label><label className="field"><span>Confirm new password</span><div className="input-wrap"><LockKeyhole size={17}/><input type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat your password"/></div></label></>}
 {error&&<div className="form-error">{error}</div>}{message&&<div className="admin-alert success">{message}</div>}<button className="button button-primary button-wide" disabled={busy||(mode==="reset"&&!token)}>{busy?"Please wait...":mode==="forgot"?"Send reset link":"Update password"} <ArrowRight size={16}/></button></form><div className="auth-switch"><Link href="/login">Back to sign in</Link></div></section></main>;
}
