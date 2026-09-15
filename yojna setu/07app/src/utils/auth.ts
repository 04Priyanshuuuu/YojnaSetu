export type AuthRole =
  | "BENEFICIARY"
  | "PARTNER_USER"
  | "PARTNER_ADMIN"
  | "SYSTEM_ADMIN";

export type AuthState = {
  isAuthenticated?: boolean;
  role?: AuthRole;
};

export const getInitialAuthState = (): AuthState => ({
  isAuthenticated: false,
  role: undefined,
});

export const canAccessRoleRoute = (role?: AuthRole) => Boolean(role);
