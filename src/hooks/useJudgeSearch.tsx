import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface JudgeSearchContextValue {
  searchTerms: string[];
  setSearchTerms: (terms: string[]) => void;
}

const JudgeSearchContext = createContext<JudgeSearchContextValue>({
  searchTerms: [],
  setSearchTerms: () => {},
});

export function JudgeSearchProvider({ children }: { children: ReactNode }) {
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  return (
    <JudgeSearchContext.Provider value={{ searchTerms, setSearchTerms }}>
      {children}
    </JudgeSearchContext.Provider>
  );
}

export function useJudgeSearch() {
  return useContext(JudgeSearchContext);
}
