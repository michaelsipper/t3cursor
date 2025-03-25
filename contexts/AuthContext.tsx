// contexts/AuthContext.tsx

"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/users/get", {
        credentials: 'include',
      });
  
      if (response.ok) {
        const userData = await response.json();
        // Add debug log
        console.log('User Data from API:', userData);
        
        // Transform the data to ensure we have all required fields
        const userWithId = {
          ...userData,
          _id: userData._id || userData.id, // Ensure we have _id
          id: userData._id || userData.id,  // Ensure we have id
        };
        
        console.log('Transformed User Data:', userWithId);
        setUser(userWithId);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      await checkAuth();
      showToast("Logged in successfully!");
      router.push("/feed");
    } catch (error) {
      showToast("Login failed. Please try again.");
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      await login(email, password);
    } catch (error) {
      showToast("Signup failed. Please try again.");
      throw error;
    }
  };

  const logout = async () => {
    try {
      const response = await fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Logout failed');
      
      setUser(null);
      setIsAuthenticated(false);
      showToast("Logged out successfully!");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      showToast("Logout failed. Please try again.");
    }
  };

  const deleteAccount = async () => {
    try {
      const response = await fetch('/api/users/delete', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete account');

      setUser(null);
      setIsAuthenticated(false);
      showToast("Account deleted successfully");
      router.push("/login");
    } catch (error) {
      console.error("Delete account error:", error);
      showToast("Failed to delete account. Please try again.");
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        login,
        signup,
        logout,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}