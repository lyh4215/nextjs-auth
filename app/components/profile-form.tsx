"use client";

import { useActionState } from "react";
import {
  updateProfileAction,
  type ProfileActionState,
} from "@/app/actions/profile";

const initialState: ProfileActionState = {};

export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, action, pending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={action} className="form-stack compact">
      <label>
        표시 이름
        <input name="displayName" defaultValue={displayName} required maxLength={50} />
      </label>
      {state.error && <p className="message error">{state.error}</p>}
      {state.success && <p className="message success">{state.success}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "저장 중…" : "프로필 저장"}
      </button>
    </form>
  );
}
