import { redirect } from "next/navigation";
import { AuthForm } from "@/app/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { reason } = await searchParams;

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">SERVER SESSION</p>
        <h1>다시 만나 반가워요</h1>
        <p className="lead">계정에 안전하게 로그인하세요.</p>
        {(reason === "session-ended" || reason === "session-replaced") && (
          <p className="message error">
            {reason === "session-replaced"
              ? "다른 곳에서 이 계정으로 로그인하여 자동 로그아웃되었습니다."
              : "로그인 세션이 만료되어 자동 로그아웃되었습니다."}
          </p>
        )}
        <AuthForm mode="login" />
      </section>
    </main>
  );
}
