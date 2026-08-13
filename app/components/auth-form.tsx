"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  loginAction,
  registerAction,
  type AuthActionState,
} from "@/app/actions/auth";

const initialState: AuthActionState = {};

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const isLogin = mode === "login";

  return (
    <form action={formAction} className="form-stack">
      {!isLogin && (
        <label>
          이름
          <input name="displayName" autoComplete="name" required maxLength={50} />
        </label>
      )}
      <label>
        이메일
        <input name="email" type="email" autoComplete="email" required maxLength={254} />
      </label>
      <label>
        비밀번호
        <input
          name="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          required
          minLength={isLogin ? undefined : 12}
          maxLength={128}
        />
      </label>
      {!isLogin && <p className="hint">12자 이상의 비밀번호를 사용하세요.</p>}
      {state.error && <p className="message error">{state.error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "처리 중…" : isLogin ? "로그인" : "계정 만들기"}
      </button>
      <p className="switch-link">
        {isLogin ? "처음이신가요?" : "이미 계정이 있나요?"}{" "}
        <Link href={isLogin ? "/register" : "/login"}>
          {isLogin ? "회원가입" : "로그인"}
        </Link>
      </p>
    </form>
  );
}
