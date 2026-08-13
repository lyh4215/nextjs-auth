import { redirect } from "next/navigation";
import { AuthForm } from "@/app/components/auth-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <main className="flex min-h-svh items-center justify-center bg-[radial-gradient(circle_at_15%_20%,rgba(96,165,250,.25),transparent_30%),radial-gradient(circle_at_85%_85%,rgba(129,140,248,.2),transparent_32%)] bg-slate-50 p-5">
      <Card className="w-full max-w-md shadow-xl shadow-blue-950/10">
        <CardHeader className="gap-2 px-6 pt-2">
          <p className="text-xs font-semibold tracking-[0.16em] text-primary">CREATE ACCOUNT</p>
          <CardTitle className="text-2xl font-semibold tracking-tight">새 계정 만들기</CardTitle>
          <CardDescription>한 계정에는 하나의 활성 세션만 유지됩니다.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-2">
          <AuthForm mode="register" />
        </CardContent>
      </Card>
    </main>
  );
}
