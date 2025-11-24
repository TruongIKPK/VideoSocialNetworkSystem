import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getToken, removeToken } from "@/utils/tokenStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import authService, { User } from "@/service/authService";
import { connectSocket, disconnectSocket } from "@/services/socketService";

interface UserContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_STORAGE_KEY = "user_data";

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data from storage on mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Connect socket when user is authenticated
  useEffect(() => {
    if (token && user) {
      // Socket connection will be handled in _layout.tsx with moderation handler
      // We just ensure socket is available when user is logged in
    } else {
      // Disconnect socket when user logs out
      disconnectSocket();
    }
  }, [token, user]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const storedToken = await getToken();
      
      if (storedToken) {
        setToken(storedToken);
        
        // Try to load user data from AsyncStorage
        const userDataString = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (userDataString) {
          try {
            const userData = JSON.parse(userDataString);
            setUser(userData);
          } catch (e) {
            console.error("Error parsing user data:", e);
          }
        }
        
        // If no user data in storage, try to fetch from API
        if (!userDataString) {
          await fetchUserInfo(storedToken);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserInfo = async (authToken: string) => {
    try {
      const response = await fetch(
        "https://videosocialnetworksystem.onrender.com/api/users/me",
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      } else {
        // Token might be invalid, clear everything
        await logout();
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const login = async (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await removeToken();
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    await authService.logout();
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUserInfo(token);
    }
  };

  const value: UserContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    refreshUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

