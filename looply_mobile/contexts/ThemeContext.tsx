import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: "light" | "dark";
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "theme_mode";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Load theme preference from storage
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Update theme when mode or system color scheme changes
  useEffect(() => {
    let newTheme: "light" | "dark";
    if (themeMode === "system") {
      newTheme = systemColorScheme === "dark" ? "dark" : "light";
      console.log(`[Theme] System mode: ${systemColorScheme} -> Theme: ${newTheme}`);
    } else {
      newTheme = themeMode;
      console.log(`[Theme] Manual mode: ${themeMode} -> Theme: ${newTheme}`);
    }
    setTheme(newTheme);
  }, [themeMode, systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const storedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (storedMode && ["light", "dark", "system"].includes(storedMode)) {
        console.log(`[Theme] Loaded theme preference from storage: ${storedMode}`);
        setThemeModeState(storedMode as ThemeMode);
      } else {
        console.log(`[Theme] No stored preference found, using system default`);
      }
    } catch (error) {
      console.error("[Theme] Error loading theme preference:", error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      console.log(`[Theme] Setting theme mode to: ${mode}`);
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      console.log(`[Theme] ✅ Theme mode saved to storage: ${mode}`);
    } catch (error) {
      console.error("[Theme] ❌ Error saving theme preference:", error);
    }
  };

  const toggleTheme = async () => {
    const currentTheme = theme;
    const newMode = currentTheme === "light" ? "dark" : "light";
    console.log(`[Theme] 🔄 Toggling theme: ${currentTheme} -> ${newMode}`);
    await setThemeMode(newMode);
    console.log(`[Theme] ✅ Theme toggled successfully: ${newMode}`);
  };

  const value: ThemeContextType = {
    theme,
    themeMode,
    setThemeMode,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

