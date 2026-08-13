import { redirect } from "next/navigation";
import { AuthForm } from "@/app/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">CREATE ACCOUNT</p>
        <h1>새 계정 만들기</h1>
        <p className="lead">한 계정에는 하나의 활성 세션만 유지됩니다.</p>
        <AuthForm mode="register" />
      </section>
    </main>
  );
}
