import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api";

interface AuthContextType {
  isAdmin: boolean;
  isUser: boolean;
  userEmail: string | null;
  token: string | null;
  loginAsUser: (email: string, token?: string, isAdmin?: boolean) => void;
  logout: () => void;
  setUserEmail: React.Dispatch<React.SetStateAction<string | null>>;
  initialized: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAdmin: false,
  isUser: false,
  userEmail: null,
  token: null,
  loginAsUser: () => { },
  logout: () => { },
  setUserEmail: () => { },
  initialized: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedEmail = localStorage.getItem("userEmail");

    if (storedToken) {
      try {
        const payload = JSON.parse(atob(storedToken.split(".")[1]));
        setIsUser(true);
        setIsAdmin(!!payload.isAdmin);
        setUserEmail(payload.email);
        setToken(storedToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      } catch {
        console.error("Invalid JWT token");
        localStorage.removeItem("token");
      }
    } else if (storedEmail) {
      setIsUser(true);
      setUserEmail(storedEmail);
    }

    setInitialized(true);
  }, []);

  const loginAsUser = (email: string, token?: string, isAdmin?: boolean) => {
    localStorage.setItem("userEmail", email);
    if (token) {
      localStorage.setItem("token", token);
      setToken(token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    setIsUser(true);
    setIsAdmin(!!isAdmin);
    setUserEmail(email);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    delete api.defaults.headers.common["Authorization"];
    setIsAdmin(false);
    setIsUser(false);
    setUserEmail(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAdmin,
        isUser,
        userEmail,
        token,
        loginAsUser,
        logout,
        setUserEmail,
        initialized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
