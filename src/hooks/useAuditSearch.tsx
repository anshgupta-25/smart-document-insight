import { createContext, useContext, useState, type ReactNode } from "react";

interface AuditSearchContextValue {
  searchTerms: string[];
  setSearchTerms: (terms: string[]) => void;
}

const AuditSearchContext = createContext<AuditSearchContextValue>({
  searchTerms: [],
  setSearchTerms: () => {},
});

export function AuditSearchProvider({ children }: { children: ReactNode }) {
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  return (
    <AuditSearchContext.Provider value={{ searchTerms, setSearchTerms }}>
      {children}
    </AuditSearchContext.Provider>
  );
}

export function useAuditSearch() {
  return useContext(AuditSearchContext);
}
