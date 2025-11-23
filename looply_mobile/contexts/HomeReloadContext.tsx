import React, { createContext, useContext, useState, useRef, ReactNode } from "react";

interface HomeReloadContextType {
  isReloading: boolean;
  setIsReloading: (value: boolean) => void;
  triggerReload: () => void;
  setReloadCallback: (callback: () => void) => void;
}

const HomeReloadContext = createContext<HomeReloadContextType | undefined>(undefined);

export function HomeReloadProvider({ children }: { children: ReactNode }) {
  const [isReloading, setIsReloading] = useState(false);
  const reloadCallbackRef = useRef<(() => void) | null>(null);
  const lastReloadTimeRef = useRef<number>(0);
  const RELOAD_DEBOUNCE_MS = 500; // Chỉ cho phép reload mỗi 0.5 giây (giảm từ 2s để nhanh hơn)

  const triggerReload = () => {
    const now = Date.now();
    const timeSinceLastReload = now - lastReloadTimeRef.current;
    
    console.log(`[HomeReloadContext] 🚀 triggerReload called, isReloading: ${isReloading}, timeSinceLastReload: ${timeSinceLastReload}ms`);
    
    // Ngăn reload nếu đang reload hoặc vừa mới reload gần đây
    if (isReloading) {
      console.log(`[HomeReloadContext] ⚠️ Already reloading, skipping`);
      return;
    }
    
    if (timeSinceLastReload < RELOAD_DEBOUNCE_MS) {
      console.log(`[HomeReloadContext] ⚠️ Reload too soon (${timeSinceLastReload}ms < ${RELOAD_DEBOUNCE_MS}ms), skipping`);
      return;
    }
    
    if (reloadCallbackRef.current) {
      lastReloadTimeRef.current = now;
      setIsReloading(true);
      reloadCallbackRef.current();
    } else {
      console.log(`[HomeReloadContext] ⚠️ No reload callback registered`);
    }
  };

  const setReloadCallback = (callback: () => void) => {
    console.log(`[HomeReloadContext] 📝 Setting reload callback`);
    reloadCallbackRef.current = callback;
  };

  return (
    <HomeReloadContext.Provider value={{ isReloading, setIsReloading, triggerReload, setReloadCallback }}>
      {children}
    </HomeReloadContext.Provider>
  );
}

export function useHomeReload() {
  const context = useContext(HomeReloadContext);
  if (context === undefined) {
    throw new Error("useHomeReload must be used within a HomeReloadProvider");
  }
  return context;
}

