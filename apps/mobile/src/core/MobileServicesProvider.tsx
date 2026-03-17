import { createContext, useContext, useMemo } from "react";
import { createMobileServices, type MobileServices } from "./createMobileServices";

const MobileServicesContext = createContext<MobileServices | null>(null);

export function MobileServicesProvider({ children }: { children: React.ReactNode }) {
  const services = useMemo(() => createMobileServices(), []);

  return <MobileServicesContext.Provider value={services}>{children}</MobileServicesContext.Provider>;
}

export function useMobileServices() {
  const value = useContext(MobileServicesContext);
  if (!value) {
    throw new Error("useMobileServices must be used within MobileServicesProvider");
  }

  return value;
}
