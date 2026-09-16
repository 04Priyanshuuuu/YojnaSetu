import React, { createContext, useContext } from "react";

type NavigationContextValue = {
  openDrawer: () => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({
  openDrawer,
  children,
}: NavigationContextValue & { children: React.ReactNode }) {
  return (
    <NavigationContext.Provider value={{ openDrawer }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);

  if (!context) {
    throw new Error("useNavigation must be used inside NavigationProvider");
  }

  return context;
}
