"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
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
  const formRef = useRef<HTMLFormElement>(null);
  const replaceSessionRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!state.sessionReplacementPromptId) return;

    const confirmed = window.confirm(
      "이미 로그인 중인 계정입니다. 로그인하면 기존 기기에서 로그아웃됩니다. 계속하시겠습니까?",
    );

    if (confirmed && formRef.current && replaceSessionRef.current) {
      replaceSessionRef.current.value = "yes";
      formRef.current.requestSubmit();
    }
  }, [state.sessionReplacementPromptId]);

  return (
    <form ref={formRef} action={formAction} className="form-stack">
      {isLogin && (
        <input ref={replaceSessionRef} type="hidden" name="replaceSession" defaultValue="" />
      )}
      {!isLogin && (
        <label>
          이름
          <input
            name="displayName"
            autoComplete="name"
            required
            maxLength={50}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>
      )}
      <label>
        이메일
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
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
          value={password}
          onChange={(event) => setPassword(event.target.value)}
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
