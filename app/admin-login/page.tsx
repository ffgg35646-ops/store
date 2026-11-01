import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin-login-form";

export default function AdminLoginPage() {
  return <main className="auth-page"><Suspense fallback={<div className="loading-block"/>}><AdminLoginForm/></Suspense></main>;
}
