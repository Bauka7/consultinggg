import { useAuthStore } from '../store/auth.store';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);

  return {
    user,
    accessToken,
    isAuthenticated: !!user && !!accessToken,
    isClient: user?.role === 'client',
    isConsultant: user?.role === 'consultant',
    isFactory: user?.role === 'factory_admin',
    isAdmin: user?.role === 'platform_admin',
    setAuth,
    logout,
  };
}
