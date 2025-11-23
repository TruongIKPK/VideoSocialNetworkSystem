import { useEffect, useState } from "react";

/**
 * Custom hook để debounce giá trị
 * @param value - Giá trị cần debounce
 * @param delay - Thời gian delay (ms)
 * @returns Giá trị đã debounce
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    console.log(`[useDebounce] ⏱️ Value changed: "${value}", waiting ${delay}ms...`);
    // Set timeout để update giá trị sau delay
    const handler = setTimeout(() => {
      console.log(`[useDebounce] ✅ Debounced value updated: "${value}"`);
      setDebouncedValue(value);
    }, delay);

    // Clear timeout nếu value thay đổi trước khi delay hết
    return () => {
      console.log(`[useDebounce] 🧹 Clearing timeout for previous value`);
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
