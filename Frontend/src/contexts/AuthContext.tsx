import React, { createContext } from 'react';
import { useClerk, useUser } from '@clerk/clerk-react';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: ReturnType<typeof useUser>['user'];
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();

  // Simplify the authentication to just use the user's ID as the token
  // This works as long as we're passing the user_id directly to the database
  const logout = async () => {
    await signOut();
  };

  const value = {
    isAuthenticated: !!user,
    token: user?.id || null, // Just use the user ID directly
    user,
    loading: !isLoaded,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};