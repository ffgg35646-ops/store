import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return <main className="auth-page"><Suspense fallback={<div className="loading-block"/>}><AuthForm mode="login"/></Suspense></main>;
}
