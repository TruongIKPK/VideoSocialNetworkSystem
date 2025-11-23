import { useTheme } from "@/contexts/ThemeContext";
import { getColors } from "@/constants/theme";

/**
 * Hook to get theme-aware colors
 * Returns colors based on the current theme (light/dark)
 */
export function useColors() {
  const { theme } = useTheme();
  return getColors(theme);
}

