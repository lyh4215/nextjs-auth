// Role keys are stored in the database; custom roles need no code changes here.
export const DEFAULT_ROLE_KEY = "user";

type UserWithRoles = {
  roles: readonly { role: { key: string } }[];
};

/** Any listed role grants access; an empty list denies access.
 * Presentation helper. Server operations must independently call requireRole.
 */
export function hasRole(
  user: UserWithRoles | null | undefined,
  roleKey: string | readonly string[],
): boolean {
  const allowedRoles = typeof roleKey === "string" ? [roleKey] : roleKey;
  return user?.roles.some(({ role }) => allowedRoles.includes(role.key)) ?? false;
}
