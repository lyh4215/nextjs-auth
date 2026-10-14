import "server-only";

import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/roles";

/** Controls visibility only; guard protected data and actions with requireRole. */
export async function RoleGate({
  role,
  children,
  fallback = null,
}: {
  role: string | readonly string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const user = await getCurrentUser();
  return hasRole(user, role) ? children : fallback;
}
