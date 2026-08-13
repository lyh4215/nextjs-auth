import { redirect } from "next/navigation";
import { AuthForm } from "@/app/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">SERVER SESSION</p>
        <h1>다시 만나 반가워요</h1>
        <p className="lead">계정에 안전하게 로그인하세요.</p>
        <AuthForm mode="login" />
      </section>
    </main>
  );
}
