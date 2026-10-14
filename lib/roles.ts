// Role keys are stored in the database; custom roles need no code changes here.
export const DEFAULT_ROLE_KEY = "user";

type UserWithRoles = {
  roles: readonly { role: { key: string } }[];
};

/** Presentation helper. Server operations must independently call requireRole. */
export function hasRole(
  user: UserWithRoles | null | undefined,
  roleKey: string,
): boolean {
  return user?.roles.some(({ role }) => role.key === roleKey) ?? false;
}
