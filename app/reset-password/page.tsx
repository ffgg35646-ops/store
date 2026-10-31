import { Suspense } from "react";
import { PasswordResetForm } from "@/components/password-reset-form";
export default function ResetPasswordPage(){return <Suspense fallback={<main className="auth-page"><div className="loading-block"/></main>}><PasswordResetForm mode="reset"/></Suspense>}
