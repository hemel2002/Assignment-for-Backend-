export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  role: string;
  permissions: string[];
}
